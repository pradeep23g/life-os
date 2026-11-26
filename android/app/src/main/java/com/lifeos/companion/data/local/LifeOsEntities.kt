package com.lifeos.companion.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_habits")
data class CachedHabitEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val title: String,
    val habitType: String,
    val targetValue: Int,
    val unit: String?,
    val createdAt: String,
    val todayLogDate: String,
    val todayValue: Int,
)

@Entity(tableName = "cached_tasks")
data class CachedTaskEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val title: String,
    val deadlineType: String,
    val deadlineDate: String?,
    val isCompleted: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

@Entity(tableName = "cached_journals")
data class CachedJournalEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val mood: Int,
    val whatWentGood: String?,
    val whatYouLearned: String?,
    val briefAboutDay: String?,
    val createdAt: String,
)

@Entity(tableName = "pending_mutations")
data class PendingMutationEntity(
    @PrimaryKey val id: String,
    val opType: String,
    val entityId: String,
    val payloadJson: String,
    val createdAtIso: String,
    val eventDateIst: String,
    val retryCount: Int = 0,
    val lastError: String? = null,
)

object OutboxOpTypes {
    const val HABIT_SET_TODAY = "HABIT_SET_TODAY"
    const val HABIT_CREATE = "HABIT_CREATE"
    const val HABIT_DELETE = "HABIT_DELETE"
    const val TASK_CREATE = "TASK_CREATE"
    const val TASK_TOGGLE = "TASK_TOGGLE"
    const val TASK_DELETE = "TASK_DELETE"
    const val JOURNAL_CREATE = "JOURNAL_CREATE"
    const val JOURNAL_DELETE = "JOURNAL_DELETE"
}
