package com.lifeos.companion.data.repository

import com.lifeos.companion.data.local.CachedHabitEntity
import com.lifeos.companion.data.local.OutboxOpTypes
import com.lifeos.companion.data.model.HabitDto
import com.lifeos.companion.data.model.HabitLogDto
import com.lifeos.companion.data.model.HabitStreakBreakDto
import com.lifeos.companion.data.model.HabitStreakHealDto
import com.lifeos.companion.data.model.HabitStreakHealInsertDto
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.HabitCreatePayload
import com.lifeos.companion.data.sync.HabitDeletePayload
import com.lifeos.companion.data.sync.HabitSetTodayPayload
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.telemetry.EventTypes
import com.lifeos.companion.telemetry.LifeOsDomains
import com.lifeos.companion.telemetry.TelemetryLogger
import com.lifeos.companion.util.IstClock
import com.lifeos.companion.widgets.WidgetStateSync
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.Instant
import java.time.YearMonth
import java.util.UUID

data class HabitsHealSummary(
    val unhealedBreaks: List<HabitStreakBreakDto> = emptyList(),
    val healsUsedThisMonth: Int = 0,
    val maxHealsPerMonth: Int = 5,
) {
    val healsRemaining: Int get() = (maxHealsPerMonth - healsUsedThisMonth).coerceAtLeast(0)
}

class HabitsRepository {
    private val dao get() = OutboxManager.database().dao()
    private val db get() = SupabaseClientProvider.client.postgrest
    private val json = Json

    private fun currentUserIdOrNull(): String? =
        SupabaseClientProvider.auth.currentUserOrNull()?.id

    fun observeHabitsToday(): Flow<List<HabitWithTodayStatus>> {
        val userId = currentUserIdOrNull() ?: return flowOf(emptyList())
        val todayIst = IstClock.todayIstString()
        return dao.observeHabits(userId).map { list ->
            list.map { entity ->
                HabitWithTodayStatus(
                    habit = HabitDto(
                        id = entity.id,
                        userId = entity.userId,
                        title = entity.title,
                        habitType = entity.habitType,
                        targetValue = entity.targetValue,
                        unit = entity.unit,
                        createdAt = entity.createdAt,
                    ),
                    todayValue = if (entity.todayLogDate == todayIst) entity.todayValue else 0,
                )
            }
        }
    }

    suspend fun refreshFromRemote() {
        val userId = currentUserIdOrNull() ?: return
        val hasPendingHabitOps = dao.getPendingMutations().any { it.opType.startsWith("HABIT") }
        if (hasPendingHabitOps) {
            OutboxManager.scheduleSyncNow()
            return
        }

        val todayIst = IstClock.todayIstString()
        val habits = db["habits"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("deleted_at", null)
                }
                order("created_at", Order.ASCENDING)
            }
            .decodeList<HabitDto>()

        val todayLogs = db["habit_logs"]
            .select {
                filter {
                    eq("user_id", userId)
                    eq("log_date", todayIst)
                }
            }
            .decodeList<HabitLogDto>()
            .associateBy { it.habitId }

        val cached = habits.map { h ->
            CachedHabitEntity(
                id = h.id,
                userId = h.userId,
                title = h.title,
                habitType = h.habitType,
                targetValue = h.targetValue,
                unit = h.unit,
                createdAt = h.createdAt,
                todayLogDate = todayIst,
                todayValue = todayLogs[h.id]?.value ?: 0,
            )
        }
        dao.replaceHabitsForUser(userId, cached)
        OutboxManager.appContextOrNull()?.let { WidgetStateSync.refreshHabitWidgetAsync(it) }
    }

    suspend fun setTodayValue(item: HabitWithTodayStatus, nextValue: Int) {
        val userId = currentUserIdOrNull() ?: return
        val todayIst = IstClock.todayIstString()
        val clamped = nextValue.coerceAtLeast(0)

        // Optimistic Room update
        dao.updateHabitTodayValue(item.habit.id, clamped, todayIst)

        val payload = HabitSetTodayPayload(
            userId = userId,
            habitId = item.habit.id,
            logDate = todayIst,
            previousValue = item.todayValue,
            nextValue = clamped,
            habitType = item.habit.habitType,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.HABIT_SET_TODAY,
            entityId = item.habit.id,
            payloadJson = json.encodeToString(payload),
        )
        OutboxManager.appContextOrNull()?.let { WidgetStateSync.refreshHabitWidgetAsync(it) }
    }

    suspend fun createHabit(
        title: String,
        habitType: String,
        targetValue: Int,
        unit: String?,
    ) {
        val userId = currentUserIdOrNull() ?: return
        val id = UUID.randomUUID().toString()
        val nowIso = IstClock.nowIsoUtc()
        val todayIst = IstClock.todayIstString()
        val cleanTitle = title.trim()
        val cleanUnit = unit?.trim()?.takeIf { it.isNotEmpty() }
        val normalizedTarget = if (habitType == "target") targetValue.coerceAtLeast(1) else 1

        dao.upsertHabit(
            CachedHabitEntity(
                id = id,
                userId = userId,
                title = cleanTitle,
                habitType = habitType,
                targetValue = normalizedTarget,
                unit = cleanUnit,
                createdAt = nowIso,
                todayLogDate = todayIst,
                todayValue = 0,
            ),
        )

        val payload = HabitCreatePayload(
            id = id,
            userId = userId,
            title = cleanTitle,
            habitType = habitType,
            targetValue = normalizedTarget,
            unit = cleanUnit,
            createdAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.HABIT_CREATE,
            entityId = id,
            payloadJson = json.encodeToString(payload),
        )
    }

    suspend fun deleteHabit(habitId: String) {
        val userId = currentUserIdOrNull() ?: return
        val nowIso = IstClock.nowIsoUtc()
        dao.deleteHabitById(habitId)

        val payload = HabitDeletePayload(
            userId = userId,
            habitId = habitId,
            deletedAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.HABIT_DELETE,
            entityId = habitId,
            payloadJson = json.encodeToString(payload),
        )
    }

    suspend fun fetchHealSummary(): HabitsHealSummary {
        val userId = currentUserIdOrNull() ?: return HabitsHealSummary()
        val currentMonth = YearMonth.from(IstClock.todayIst())

        val unhealed = db["habit_streak_breaks"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("healed_at", null)
                }
                order("break_date", Order.DESCENDING)
                limit(15)
            }
            .decodeList<HabitStreakBreakDto>()

        val heals = db["habit_streak_heals"]
            .select {
                filter { eq("user_id", userId) }
                order("created_at", Order.DESCENDING)
                limit(20)
            }
            .decodeList<HabitStreakHealDto>()

        val usedThisMonth = heals.count { heal ->
            runCatching {
                val instant = Instant.parse(heal.createdAt)
                val istDate = instant.atZone(IstClock.ZONE_IST).toLocalDate()
                YearMonth.from(istDate) == currentMonth
            }.getOrDefault(false)
        }

        return HabitsHealSummary(
            unhealedBreaks = unhealed,
            healsUsedThisMonth = usedThisMonth,
        )
    }

    suspend fun healStreakBreak(
        breakItem: HabitStreakBreakDto,
        reason: String?,
    ) {
        val userId = checkNotNull(currentUserIdOrNull()) { "Not authenticated" }
        val summary = fetchHealSummary()
        require(summary.healsRemaining > 0) {
            "Monthly heal quota reached (5/5 heals used this month)."
        }

        val nowIso = IstClock.nowIsoUtc()
        val cleanReason = reason?.trim()?.takeIf { it.isNotEmpty() }

        db["habit_streak_heals"].insert(
            HabitStreakHealInsertDto(
                id = UUID.randomUUID().toString(),
                userId = userId,
                habitId = breakItem.habitId,
                breakId = breakItem.id,
                reason = cleanReason,
                createdAt = nowIso,
            ),
        )

        db["habit_streak_breaks"].update({
            set("healed_at", nowIso)
        }) {
            filter {
                eq("id", breakItem.id)
                eq("user_id", userId)
            }
        }

        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.MIND_OS,
            entityType = "habit_break",
            entityId = breakItem.id,
            eventType = EventTypes.MIND_HABIT_BREAK_HEALED,
            payload = buildJsonObject {
                put("habitId", breakItem.habitId)
                put("break_date", breakItem.breakDate)
            },
        )
    }
}
