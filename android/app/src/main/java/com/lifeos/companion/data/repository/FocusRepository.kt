package com.lifeos.companion.data.repository

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

data class FocusSnapshot(
    val activeTimer: TimeLogDto?,
    val todayLogs: List<TimeLogDto>,
    val logs7d: List<TimeLogDto>,
    val logs30d: List<TimeLogDto>,
    val openTasks: List<TaskDto>,
)

sealed interface StartFocusResult {
    data class Started(val log: TimeLogDto) : StartFocusResult
    data class Conflict(val existing: TimeLogDto) : StartFocusResult
}

class FocusRepository {
    private val db get() = SupabaseClientProvider.client.postgrest

    private fun requireUserId(): String =
        checkNotNull(SupabaseClientProvider.auth.currentUserOrNull()?.id) { "User not authenticated" }

    suspend fun fetchFocusSnapshot(): FocusSnapshot {
        val userId = requireUserId()
        val today = IstClock.todayIst()
        val todayIst = today.toString()
        val sevenDaysAgoIst = today.minusDays(6).toString()
        val thirtyDaysAgoIst = today.minusDays(29).toString()
        val thirtyDaysStartIso = today.minusDays(30).atStartOfDay(IstClock.ZONE_IST).toInstant().toString()

        val recent = db["time_logs"]
            .select {
                filter {
                    eq("user_id", userId)
                    gte("start_time", thirtyDaysStartIso)
                }
                order("start_time", Order.DESCENDING)
                limit(500)
            }
            .decodeList<TimeLogDto>()

        val active = recent.firstOrNull { it.endTime == null }
            ?: db["time_logs"]
                .select {
                    filter {
                        eq("user_id", userId)
                        exact("end_time", null)
                    }
                    order("start_time", Order.DESCENDING)
                    limit(1)
                }
                .decodeSingleOrNull<TimeLogDto>()

        val completed = recent.filter { it.endTime != null }

        val todayLogs = completed.filter { log ->
            runCatching { IstClock.toIstDateString(Instant.parse(log.startTime)) }.getOrNull() == todayIst
        }
        val logs7d = completed.filter { log ->
            val d = runCatching { IstClock.toIstDateString(Instant.parse(log.startTime)) }.getOrNull()
            d != null && d >= sevenDaysAgoIst
        }
        val logs30d = completed.filter { log ->
            val d = runCatching { IstClock.toIstDateString(Instant.parse(log.startTime)) }.getOrNull()
            d != null && d >= thirtyDaysAgoIst
        }

        val openTasks = db["tasks"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("deleted_at", null)
                    eq("is_completed", false)
                }
                order("created_at", Order.DESCENDING)
                limit(30)
            }
            .decodeList<TaskDto>()

        return FocusSnapshot(
            activeTimer = active,
            todayLogs = todayLogs,
            logs7d = logs7d,
            logs30d = logs30d,
            openTasks = openTasks,
        )
    }

    suspend fun startWithConflictCheck(
        bucket: String,
        taskId: String?,
        description: String?,
    ): StartFocusResult {
        val userId = requireUserId()
        val existing = db["time_logs"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("end_time", null)
                }
                order("start_time", Order.DESCENDING)
                limit(1)
            }
            .decodeSingleOrNull<TimeLogDto>()

        if (existing != null) {
            return StartFocusResult.Conflict(existing)
        }

        val inserted = insertNewTimer(userId, bucket, taskId, description)
        return StartFocusResult.Started(inserted)
    }

    suspend fun takeOverAndStart(
        existing: TimeLogDto,
        bucket: String,
        taskId: String?,
        description: String?,
    ): TimeLogDto {
        val userId = requireUserId()
        stopTimer(existing)
        return insertNewTimer(userId, bucket, taskId, description)
    }

    suspend fun stopTimer(active: TimeLogDto) {
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
                if (active.taskId != null) put("task_id", active.taskId)
            },
        )
    }

    suspend fun logManualSession(
        bucket: String,
        startInstant: Instant,
        endInstant: Instant,
        description: String?,
    ): TimeLogDto {
        val userId = requireUserId()
        require(endInstant.isAfter(startInstant)) { "End time must be after start time." }
        val minutes = Duration.between(startInstant, endInstant).toMinutes().toInt().coerceAtLeast(1)
        val id = UUID.randomUUID().toString()
        val cleanDesc = description?.trim()?.takeIf { it.isNotEmpty() }

        db["time_logs"].insert(
            TimeLogInsertDto(
                id = id,
                userId = userId,
                taskId = null,
                bucket = bucket,
                description = cleanDesc,
                startTime = startInstant.toString(),
                endTime = endInstant.toString(),
                durationMinutes = minutes,
            ),
        )

        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.TIME_OS,
            entityType = "time_log",
            entityId = id,
            eventType = EventTypes.TIME_SESSION_LOGGED,
            payload = buildJsonObject {
                put("bucket", bucket)
                put("duration_minutes", minutes)
                put("manual", true)
            },
        )

        return TimeLogDto(
            id = id,
            userId = userId,
            bucket = bucket,
            description = cleanDesc,
            startTime = startInstant.toString(),
            endTime = endInstant.toString(),
            durationMinutes = minutes,
        )
    }

    suspend fun deleteSession(log: TimeLogDto) {
        val userId = requireUserId()
        db["time_logs"].delete {
            filter {
                eq("id", log.id)
                eq("user_id", userId)
            }
        }
        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.TIME_OS,
            entityType = "time_log",
            entityId = log.id,
            eventType = EventTypes.TIME_TIME_LOG_DELETED,
            payload = buildJsonObject {
                put("bucket", log.bucket)
                put("duration_minutes", log.durationMinutes ?: 0)
            },
        )
    }

    private suspend fun insertNewTimer(
        userId: String,
        bucket: String,
        taskId: String?,
        description: String?,
    ): TimeLogDto {
        val id = UUID.randomUUID().toString()
        val nowIso = IstClock.nowIsoUtc()
        val cleanDesc = description?.trim()?.takeIf { it.isNotEmpty() }

        db["time_logs"].insert(
            TimeLogInsertDto(
                id = id,
                userId = userId,
                taskId = taskId,
                bucket = bucket,
                description = cleanDesc,
                startTime = nowIso,
            ),
        )

        TelemetryLogger.logEventSafe(
            domain = LifeOsDomains.TIME_OS,
            entityType = "time_log",
            entityId = id,
            eventType = EventTypes.TIME_SESSION_STARTED,
            payload = buildJsonObject {
                put("bucket", bucket)
                if (taskId != null) put("task_id", taskId)
            },
        )

        return TimeLogDto(
            id = id,
            userId = userId,
            taskId = taskId,
            bucket = bucket,
            description = cleanDesc,
            startTime = nowIso,
            endTime = null,
            durationMinutes = null,
        )
    }
}
