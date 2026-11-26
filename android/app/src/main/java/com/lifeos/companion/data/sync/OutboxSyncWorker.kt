package com.lifeos.companion.data.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.lifeos.companion.data.local.LifeOsDatabase
import com.lifeos.companion.data.local.OutboxOpTypes
import com.lifeos.companion.data.local.PendingMutationEntity
import com.lifeos.companion.data.model.HabitInsertDto
import com.lifeos.companion.data.model.HabitLogDto
import com.lifeos.companion.data.model.HabitLogInsertDto
import com.lifeos.companion.data.model.JournalInsertDto
import com.lifeos.companion.data.model.TaskInsertDto
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.telemetry.EventTypes
import com.lifeos.companion.telemetry.LifeOsDomains
import com.lifeos.companion.telemetry.TelemetryLogger
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.Instant
import java.util.UUID

class OutboxSyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun doWork(): Result {
        SupabaseClientProvider.init(applicationContext)
        val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id ?: return Result.retry()
        val dao = LifeOsDatabase.get(applicationContext).dao()
        val pending = dao.getPendingMutations()
        if (pending.isEmpty()) return Result.success()

        var anyTransientFailure = false
        for (item in pending) {
            try {
                processMutation(item, userId)
                dao.deleteMutation(item.id)
            } catch (e: Exception) {
                Log.w(TAG, "Outbox op ${item.opType} (${item.id}) failed: ${e.message}")
                dao.markMutationRetry(item.id, e.message ?: "Sync error")
                anyTransientFailure = true
                if (item.retryCount >= 6) {
                    // Preserve user state from infinite blocking; leave error recorded or drop if stale
                    continue
                }
            }
        }
        return if (anyTransientFailure) Result.retry() else Result.success()
    }

    private suspend fun processMutation(item: PendingMutationEntity, authenticatedUserId: String) {
        val db = SupabaseClientProvider.client.postgrest
        val eventTime = runCatching { Instant.parse(item.createdAtIso) }.getOrElse { Instant.now() }

        when (item.opType) {
            OutboxOpTypes.HABIT_SET_TODAY -> {
                val p = json.decodeFromString<HabitSetTodayPayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return

                if (p.nextValue <= 0) {
                    db["habit_logs"].delete {
                        filter {
                            eq("user_id", p.userId)
                            eq("habit_id", p.habitId)
                            eq("log_date", p.logDate)
                        }
                    }
                    val eventType = if (p.habitType == "target") {
                        EventTypes.MIND_HABIT_COUNT_ADJUSTED
                    } else {
                        EventTypes.MIND_HABIT_UNCOMPLETED
                    }
                    TelemetryLogger.logEventSafe(
                        domain = LifeOsDomains.MIND_OS,
                        entityType = if (p.habitType == "target") "habit_log" else "habit",
                        entityId = p.habitId,
                        eventType = eventType,
                        payload = buildJsonObject {
                            put("habit_id", p.habitId)
                            put("log_date", p.logDate)
                            put("previous_value", p.previousValue)
                            put("next_value", 0)
                            put("cleared", true)
                        },
                        createdAt = eventTime,
                    )
                } else {
                    val existing = db["habit_logs"].select {
                        filter {
                            eq("user_id", p.userId)
                            eq("habit_id", p.habitId)
                            eq("log_date", p.logDate)
                        }
                    }.decodeSingleOrNull<HabitLogDto>()

                    if (existing != null) {
                        db["habit_logs"].update({
                            set("value", p.nextValue)
                            set("logged_at", item.createdAtIso)
                        }) {
                            filter { eq("id", existing.id) }
                        }
                    } else {
                        db["habit_logs"].insert(
                            HabitLogInsertDto(
                                id = UUID.randomUUID().toString(),
                                userId = p.userId,
                                habitId = p.habitId,
                                logDate = p.logDate,
                                value = p.nextValue,
                                loggedAt = item.createdAtIso,
                            ),
                        )
                    }

                    val eventType = if (p.habitType == "target") {
                        EventTypes.MIND_HABIT_COUNT_ADJUSTED
                    } else {
                        EventTypes.MIND_HABIT_COMPLETED
                    }
                    TelemetryLogger.logEventSafe(
                        domain = LifeOsDomains.MIND_OS,
                        entityType = if (p.habitType == "target") "habit_log" else "habit",
                        entityId = p.habitId,
                        eventType = eventType,
                        payload = buildJsonObject {
                            put("habit_id", p.habitId)
                            put("log_date", p.logDate)
                            put("previous_value", p.previousValue)
                            put("next_value", p.nextValue)
                            put("value", p.nextValue)
                        },
                        createdAt = eventTime,
                    )
                }
            }

            OutboxOpTypes.HABIT_CREATE -> {
                val p = json.decodeFromString<HabitCreatePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["habits"].insert(
                    HabitInsertDto(
                        id = p.id,
                        userId = p.userId,
                        title = p.title,
                        habitType = p.habitType,
                        targetValue = p.targetValue,
                        unit = p.unit,
                        createdAt = p.createdAt,
                        updatedAt = p.createdAt,
                    ),
                )
                TelemetryLogger.logEventSafe(
                    domain = LifeOsDomains.MIND_OS,
                    entityType = "habit",
                    entityId = p.id,
                    eventType = EventTypes.MIND_HABIT_CREATED,
                    payload = buildJsonObject {
                        put("title", p.title)
                        put("habit_type", p.habitType)
                        put("target_value", p.targetValue)
                    },
                    createdAt = eventTime,
                )
            }

            OutboxOpTypes.HABIT_DELETE -> {
                val p = json.decodeFromString<HabitDeletePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["habits"].update({
                    set("deleted_at", p.deletedAt)
                    set("updated_at", p.deletedAt)
                }) {
                    filter {
                        eq("id", p.habitId)
                        eq("user_id", p.userId)
                    }
                }
                TelemetryLogger.logEventSafe(
                    domain = LifeOsDomains.MIND_OS,
                    entityType = "habit",
                    entityId = p.habitId,
                    eventType = EventTypes.MIND_HABIT_DELETED,
                    payload = buildJsonObject { put("habit_id", p.habitId) },
                    createdAt = eventTime,
                )
            }

            OutboxOpTypes.TASK_CREATE -> {
                val p = json.decodeFromString<TaskCreatePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["tasks"].insert(
                    TaskInsertDto(
                        id = p.id,
                        userId = p.userId,
                        title = p.title,
                        deadlineType = p.deadlineType,
                        deadlineDate = p.deadlineDate,
                        isCompleted = false,
                        createdAt = p.createdAt,
                        updatedAt = p.createdAt,
                    ),
                )
                TelemetryLogger.logEventSafe(
                    domain = LifeOsDomains.PRODUCTIVITY_HUB,
                    entityType = "task",
                    entityId = p.id,
                    eventType = EventTypes.PRODUCTIVITY_TASK_CREATED,
                    payload = buildJsonObject {
                        put("title", p.title)
                        put("deadline_type", p.deadlineType)
                    },
                    createdAt = eventTime,
                )
            }

            OutboxOpTypes.TASK_TOGGLE -> {
                val p = json.decodeFromString<TaskTogglePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["tasks"].update({
                    set("is_completed", p.isCompleted)
                    set("updated_at", p.updatedAt)
                }) {
                    filter {
                        eq("id", p.taskId)
                        eq("user_id", p.userId)
                    }
                }
                TelemetryLogger.logEventSafe(
                    domain = LifeOsDomains.PRODUCTIVITY_HUB,
                    entityType = "task",
                    entityId = p.taskId,
                    eventType = EventTypes.PRODUCTIVITY_TASK_STATUS_CHANGED,
                    payload = buildJsonObject {
                        put("title", p.title)
                        put("is_completed", p.isCompleted)
                    },
                    createdAt = eventTime,
                )
            }

            OutboxOpTypes.TASK_DELETE -> {
                val p = json.decodeFromString<TaskDeletePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["tasks"].update({
                    set("deleted_at", p.deletedAt)
                    set("updated_at", p.deletedAt)
                }) {
                    filter {
                        eq("id", p.taskId)
                        eq("user_id", p.userId)
                    }
                }
            }

            OutboxOpTypes.JOURNAL_CREATE -> {
                val p = json.decodeFromString<JournalCreatePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["journal_entries"].insert(
                    JournalInsertDto(
                        id = p.id,
                        userId = p.userId,
                        mood = p.mood,
                        whatWentGood = p.whatWentGood,
                        whatYouLearned = p.whatYouLearned,
                        briefAboutDay = p.briefAboutDay,
                        createdAt = p.createdAt,
                        updatedAt = p.createdAt,
                    ),
                )
                TelemetryLogger.logEventSafe(
                    domain = LifeOsDomains.MIND_OS,
                    entityType = "journal_entry",
                    entityId = p.id,
                    eventType = EventTypes.MIND_JOURNAL_ENTRY_CREATED,
                    payload = buildJsonObject { put("mood", p.mood) },
                    createdAt = eventTime,
                )
            }

            OutboxOpTypes.JOURNAL_DELETE -> {
                val p = json.decodeFromString<JournalDeletePayload>(item.payloadJson)
                if (p.userId != authenticatedUserId) return
                db["journal_entries"].update({
                    set("deleted_at", p.deletedAt)
                    set("updated_at", p.deletedAt)
                }) {
                    filter {
                        eq("id", p.journalId)
                        eq("user_id", p.userId)
                    }
                }
                TelemetryLogger.logEventSafe(
                    domain = LifeOsDomains.MIND_OS,
                    entityType = "journal_entry",
                    entityId = p.journalId,
                    eventType = EventTypes.MIND_JOURNAL_ENTRY_DELETED,
                    payload = buildJsonObject { put("journal_entry_id", p.journalId) },
                    createdAt = eventTime,
                )
            }
        }
    }

    companion object {
        private const val TAG = "OutboxSyncWorker"
    }
}
