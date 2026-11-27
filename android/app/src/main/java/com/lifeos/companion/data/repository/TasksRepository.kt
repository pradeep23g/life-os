package com.lifeos.companion.data.repository

import com.lifeos.companion.data.local.CachedTaskEntity
import com.lifeos.companion.data.local.OutboxOpTypes
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.data.sync.TaskCreatePayload
import com.lifeos.companion.data.sync.TaskDeletePayload
import com.lifeos.companion.data.sync.TaskTogglePayload
import com.lifeos.companion.util.IstClock
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

class TasksRepository {
    private val dao get() = OutboxManager.database().dao()
    private val db get() = SupabaseClientProvider.client.postgrest
    private val json = Json

    private fun currentUserIdOrNull(): String? =
        OutboxManager.appContextOrNull()?.let { SupabaseClientProvider.cachedUserIdOrNull(it) }
            ?: SupabaseClientProvider.auth.currentUserOrNull()?.id

    fun observeTasks(): Flow<List<TaskDto>> {
        val userId = currentUserIdOrNull() ?: return flowOf(emptyList())
        return dao.observeTasks(userId).map { list ->
            list.map { e ->
                TaskDto(
                    id = e.id,
                    userId = e.userId,
                    title = e.title,
                    deadlineType = e.deadlineType,
                    deadlineDate = e.deadlineDate,
                    isCompleted = e.isCompleted,
                    createdAt = e.createdAt,
                    updatedAt = e.updatedAt,
                )
            }
        }
    }

    suspend fun refreshFromRemote() {
        val userId = currentUserIdOrNull() ?: return
        val hasPendingTaskOps = dao.getPendingMutations().any { it.opType.startsWith("TASK") }
        if (hasPendingTaskOps) {
            OutboxManager.scheduleSyncNow()
            return
        }

        val tasks = db["tasks"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("deleted_at", null)
                }
                order("created_at", Order.DESCENDING)
                limit(150)
            }
            .decodeList<TaskDto>()

        dao.replaceTasksForUser(
            userId,
            tasks.map { t ->
                CachedTaskEntity(
                    id = t.id,
                    userId = t.userId,
                    title = t.title,
                    deadlineType = t.deadlineType,
                    deadlineDate = t.deadlineDate,
                    isCompleted = t.isCompleted,
                    createdAt = t.createdAt,
                    updatedAt = t.updatedAt,
                )
            },
        )
    }

    suspend fun createTask(
        title: String,
        deadlineType: String,
        deadlineDate: String?,
    ) {
        val userId = currentUserIdOrNull() ?: return
        val id = UUID.randomUUID().toString()
        val nowIso = IstClock.nowIsoUtc()
        val cleanTitle = title.trim()
        val resolvedDate = if (deadlineType == "specific_date") deadlineDate else null

        dao.upsertTask(
            CachedTaskEntity(
                id = id,
                userId = userId,
                title = cleanTitle,
                deadlineType = deadlineType,
                deadlineDate = resolvedDate,
                isCompleted = false,
                createdAt = nowIso,
                updatedAt = nowIso,
            ),
        )

        val payload = TaskCreatePayload(
            id = id,
            userId = userId,
            title = cleanTitle,
            deadlineType = deadlineType,
            deadlineDate = resolvedDate,
            createdAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.TASK_CREATE,
            entityId = id,
            payloadJson = json.encodeToString(payload),
        )
    }

    suspend fun toggleTask(task: TaskDto) {
        val userId = currentUserIdOrNull() ?: return
        val next = !task.isCompleted
        val nowIso = IstClock.nowIsoUtc()

        dao.updateTaskCompleted(task.id, next, nowIso)

        val payload = TaskTogglePayload(
            userId = userId,
            taskId = task.id,
            title = task.title,
            isCompleted = next,
            updatedAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.TASK_TOGGLE,
            entityId = task.id,
            payloadJson = json.encodeToString(payload),
        )
    }

    suspend fun deleteTask(taskId: String) {
        val userId = currentUserIdOrNull() ?: return
        val nowIso = IstClock.nowIsoUtc()

        dao.deleteTaskById(taskId)

        val payload = TaskDeletePayload(
            userId = userId,
            taskId = taskId,
            deletedAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.TASK_DELETE,
            entityId = taskId,
            payloadJson = json.encodeToString(payload),
        )
    }
}
