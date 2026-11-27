package com.lifeos.companion.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject

@Serializable
data class HabitDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    @SerialName("habit_type") val habitType: String = "binary",
    @SerialName("target_value") val targetValue: Int = 1,
    val unit: String? = null,
    @SerialName("deleted_at") val deletedAt: String? = null,
    @SerialName("created_at") val createdAt: String = "",
)

@Serializable
data class HabitLogDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("habit_id") val habitId: String,
    @SerialName("log_date") val logDate: String,
    val value: Int = 1,
    @SerialName("logged_at") val loggedAt: String = "",
)

@Serializable
data class HabitLogInsertDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("habit_id") val habitId: String,
    @SerialName("log_date") val logDate: String,
    val value: Int,
    @SerialName("logged_at") val loggedAt: String,
)

@Serializable
data class HabitInsertDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    @SerialName("habit_type") val habitType: String = "binary",
    @SerialName("target_value") val targetValue: Int = 1,
    val unit: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class HabitStreakBreakDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("habit_id") val habitId: String,
    @SerialName("break_date") val breakDate: String,
    val reason: String? = null,
    @SerialName("recovery_commitment") val recoveryCommitment: String? = null,
    @SerialName("healed_at") val healedAt: String? = null,
    @SerialName("created_at") val createdAt: String = "",
)

@Serializable
data class HabitStreakHealInsertDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("habit_id") val habitId: String,
    @SerialName("break_id") val breakId: String,
    val reason: String? = null,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class HabitStreakHealDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("habit_id") val habitId: String,
    @SerialName("break_id") val breakId: String,
    val reason: String? = null,
    @SerialName("created_at") val createdAt: String = "",
)

@Serializable
data class TaskDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    @SerialName("deadline_type") val deadlineType: String = "no_deadline",
    @SerialName("deadline_date") val deadlineDate: String? = null,
    @SerialName("is_completed") val isCompleted: Boolean = false,
    @SerialName("deleted_at") val deletedAt: String? = null,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
)

@Serializable
data class TaskInsertDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    @SerialName("deadline_type") val deadlineType: String = "no_deadline",
    @SerialName("deadline_date") val deadlineDate: String? = null,
    @SerialName("is_completed") val isCompleted: Boolean = false,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class TimeLogDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("task_id") val taskId: String? = null,
    val bucket: String,
    val description: String? = null,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String? = null,
    @SerialName("duration_minutes") val durationMinutes: Int? = null,
)

@Serializable
data class TimeLogInsertDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("task_id") val taskId: String? = null,
    val bucket: String,
    val description: String? = null,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String? = null,
    @SerialName("duration_minutes") val durationMinutes: Int? = null,
)

@Serializable
data class UserSettingsTimeColorsRow(
    val id: String? = null,
    @SerialName("user_id") val userId: String,
    @SerialName("time_bucket_colors") val timeBucketColors: JsonObject? = null,
)

@Serializable
data class UserSettingsTimeColorsUpsert(
    @SerialName("user_id") val userId: String,
    @SerialName("time_bucket_colors") val timeBucketColors: JsonObject,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class JournalEntryDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val mood: Int,
    @SerialName("what_went_good") val whatWentGood: String? = null,
    @SerialName("what_you_learned") val whatYouLearned: String? = null,
    @SerialName("brief_about_day") val briefAboutDay: String? = null,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
    @SerialName("deleted_at") val deletedAt: String? = null,
)

@Serializable
data class JournalInsertDto(
    val id: String,
    @SerialName("user_id") val userId: String,
    val mood: Int,
    @SerialName("what_went_good") val whatWentGood: String? = null,
    @SerialName("what_you_learned") val whatYouLearned: String? = null,
    @SerialName("brief_about_day") val briefAboutDay: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
)

@Serializable
data class EventInsertDto(
    @SerialName("user_id") val userId: String,
    val domain: String,
    @SerialName("entity_type") val entityType: String,
    @SerialName("entity_id") val entityId: String? = null,
    @SerialName("event_type") val eventType: String,
    @SerialName("event_date_ist") val eventDateIst: String,
    val payload: JsonObject = buildJsonObject { },
    @SerialName("created_at") val createdAt: String,
)
