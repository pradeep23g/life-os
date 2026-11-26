package com.lifeos.companion.data.repository

import com.lifeos.companion.data.model.HabitDto
import com.lifeos.companion.data.model.HabitLogDto
import com.lifeos.companion.data.model.HabitLogInsertDto
import com.lifeos.companion.data.model.JournalEntryDto
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.model.TimeLogInsertDto
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.telemetry.EventTypes
import com.lifeos.companion.telemetry.LifeOsDomains
import com.lifeos.companion.telemetry.TelemetryLogger
import com.lifeos.companion.util.IstClock
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.Duration
import java.time.Instant
import java.util.UUID

data class HabitWithTodayStatus(
    val habit: HabitDto,
    val todayValue: Int,
) {
    val isDone: Boolean
        get() = if (habit.habitType == "target") todayValue >= habit.targetValue else todayValue >= 1
}

data class HomeSnapshot(
    val activeTimer: TimeLogDto?,
    val habits: List<HabitWithTodayStatus>,
    val pendingTasks: List<TaskDto>,
    val journalLoggedToday: Boolean,
    val todayFocusMinutes: Int,
)

class HomeRepository {
    private val db get() = SupabaseClientProvider.client.postgrest

    private fun requireUserId(): String =
        checkNotNull(SupabaseClientProvider.auth.currentUserOrNull()?.id) { "User not authenticated" }

    suspend fun fetchHomeSnapshot(): HomeSnapshot {
        val userId = requireUserId()
        val todayIst = IstClock.todayIstString()

        val activeTimer = db["time_logs"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("end_time", null)
                }
                order("start_time", Order.DESCENDING)
                limit(1)
            }
            .decodeSingleOrNull<TimeLogDto>()

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

        val habitsWithStatus = habits.map { habit ->
            HabitWithTodayStatus(
                habit = habit,
                todayValue = todayLogs[habit.id]?.value ?: 0,
            )
        }

        val allPendingTasks = db["tasks"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("deleted_at", null)
                    eq("is_completed", false)
                }
                order("created_at", Order.ASCENDING)
            }
            .decodeList<TaskDto>()
            .sortedWith(
                compareBy<TaskDto>(
                    { task ->
                        when {
                            task.deadlineType == "specific_date" && task.deadlineDate != null && task.deadlineDate < todayIst -> 0
                            task.deadlineType == "same_day" || task.deadlineDate == todayIst -> 1
                            task.deadlineType == "specific_date" -> 2
                            else -> 3
                        }
                    },
                    { it.deadlineDate ?: "9999-12-31" },
                    { it.createdAt },
                ),
            )

        val recentJournals = db["journal_entries"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("deleted_at", null)
                }
                order("created_at", Order.DESCENDING)
                limit(5)
            }
            .decodeList<JournalEntryDto>()

        val journalLoggedToday = recentJournals.any { entry ->
            runCatching { IstClock.toIstDateString(Instant.parse(entry.createdAt)) }.getOrNull() == todayIst
        }

        val recentLogs = db["time_logs"]
            .select {
                filter {
                    eq("user_id", userId)
                }
                order("start_time", Order.DESCENDING)
                limit(25)
            }
            .decodeList<TimeLogDto>()

        val todayFocusMinutes = recentLogs
            .filter { log ->
                log.endTime != null &&
                    runCatching { IstClock.toIstDateString(Instant.parse(log.startTime)) }.getOrNull() == todayIst
            }
            .sumOf { it.durationMinutes ?: 0 }

        return HomeSnapshot(
            activeTimer = activeTimer,
            habits = habitsWithStatus,
            pendingTasks = allPendingTasks,
            journalLoggedToday = journalLoggedToday,
            todayFocusMinutes = todayFocusMinutes,
        )
    }

    suspend fun toggleBinaryHabitToday(item: HabitWithTodayStatus) {
        val userId = requireUserId()
        val todayIst = IstClock.todayIstString()
        val nowIso = IstClock.nowIsoUtc()

        if (item.isDone) {
            db["habit_logs"].delete {
                filter {
                    eq("user_id", userId)
                    eq("habit_id", item.habit.id)
                    eq("log_date", todayIst)
                }
            }
            TelemetryLogger.logEventSafe(
                domain = LifeOsDomains.MIND_OS,
                entityType = "habit",
                entityId = item.habit.id,
                eventType = EventTypes.MIND_HABIT_UNCOMPLETED,
                payload = buildJsonObject {
                    put("log_date", todayIst)
                },
            )
        } else {
            val existing = db["habit_logs"].select {
                filter {
                    eq("user_id", userId)
                    eq("habit_id", item.habit.id)
                    eq("log_date", todayIst)
                }
            }.decodeSingleOrNull<HabitLogDto>()

            if (existing != null) {
                db["habit_logs"].update({
                    set("value", item.habit.targetValue)
                    set("logged_at", nowIso)
                }) {
                    filter { eq("id", existing.id) }
                }
            } else {
                db["habit_logs"].insert(
                    HabitLogInsertDto(
                        id = UUID.randomUUID().toString(),
                        userId = userId,
                        habitId = item.habit.id,
                        logDate = todayIst,
                        value = item.habit.targetValue.coerceAtLeast(1),
                        loggedAt = nowIso,
                    ),
                )
            }
            TelemetryLogger.logEventSafe(
                domain = LifeOsDomains.MIND_OS,
                entityType = "habit",
                entityId = item.habit.id,
                eventType = EventTypes.MIND_HABIT_COMPLETED,
                payload = buildJsonObject {
                    put("log_date", todayIst)
                    put("value", item.habit.targetValue.coerceAtLeast(1))
                },
            )
        }
    }

    suspend fun toggleTaskCompleted(task: TaskDto) {
        val next = !task.isCompleted
        db["tasks"].update({
            set("is_completed", next)
            set("updated_at", IstClock.nowIsoUtc())
        }) {
            filter { eq("id", task.id) }
        }
        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.PRODUCTIVITY_HUB,
            entityType = "task",
            entityId = task.id,
            eventType = EventTypes.PRODUCTIVITY_TASK_STATUS_CHANGED,
            payload = buildJsonObject {
                put("is_completed", next)
                put("title", task.title)
            },
        )
    }

    suspend fun startQuickFocus(bucket: String = "Deep Work", description: String? = null): TimeLogDto {
        val userId = requireUserId()
        val id = UUID.randomUUID().toString()
        val nowIso = IstClock.nowIsoUtc()
        val row = TimeLogInsertDto(
            id = id,
            userId = userId,
            bucket = bucket,
            description = description,
            startTime = nowIso,
        )
        db["time_logs"].insert(row)
        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.TIME_OS,
            entityType = "time_log",
            entityId = id,
            eventType = EventTypes.TIME_SESSION_STARTED,
            payload = buildJsonObject {
                put("bucket", bucket)
            },
        )
        return TimeLogDto(
            id = id,
            userId = userId,
            bucket = bucket,
            description = description,
            startTime = nowIso,
            endTime = null,
            durationMinutes = null,
        )
    }

    suspend fun stopActiveFocus(active: TimeLogDto) {
        val now = Instant.now()
        val start = runCatching { Instant.parse(active.startTime) }.getOrElse { now }
        val minutes = Duration.between(start, now).toMinutes().toInt().coerceAtLeast(1)
        val nowIso = now.toString()

        db["time_logs"].update({
            set("end_time", nowIso)
            set("duration_minutes", minutes)
            set("updated_at", nowIso)
        }) {
            filter { eq("id", active.id) }
        }

        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.TIME_OS,
            entityType = "time_log",
            entityId = active.id,
            eventType = EventTypes.TIME_SESSION_LOGGED,
            payload = buildJsonObject {
                put("bucket", active.bucket)
                put("duration_minutes", minutes)
            },
        )
    }
}
