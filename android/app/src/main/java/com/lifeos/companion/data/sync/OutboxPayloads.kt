package com.lifeos.companion.data.sync

import kotlinx.serialization.Serializable

@Serializable
data class HabitSetTodayPayload(
    val userId: String,
    val habitId: String,
    val logDate: String,
    val previousValue: Int,
    val nextValue: Int,
    val habitType: String,
)

@Serializable
data class HabitCreatePayload(
    val id: String,
    val userId: String,
    val title: String,
    val habitType: String,
    val targetValue: Int,
    val unit: String? = null,
    val createdAt: String,
)

@Serializable
data class HabitDeletePayload(
    val userId: String,
    val habitId: String,
    val deletedAt: String,
)

@Serializable
data class TaskCreatePayload(
    val id: String,
    val userId: String,
    val title: String,
    val deadlineType: String,
    val deadlineDate: String? = null,
    val createdAt: String,
)

@Serializable
data class TaskTogglePayload(
    val userId: String,
    val taskId: String,
    val title: String,
    val isCompleted: Boolean,
    val updatedAt: String,
)

@Serializable
data class TaskDeletePayload(
    val userId: String,
    val taskId: String,
    val deletedAt: String,
)

@Serializable
data class JournalCreatePayload(
    val id: String,
    val userId: String,
    val mood: Int,
    val whatWentGood: String? = null,
    val whatYouLearned: String? = null,
    val briefAboutDay: String? = null,
    val createdAt: String,
)

@Serializable
data class JournalDeletePayload(
    val userId: String,
    val journalId: String,
    val deletedAt: String,
)
