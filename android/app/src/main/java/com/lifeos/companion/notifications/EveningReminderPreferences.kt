package com.lifeos.companion.notifications

import android.content.Context

data class EveningScheduleConfig(
    val tasksEnabled: Boolean = true,
    val tasksHour: Int = 19,
    val tasksMinute: Int = 30,
    val journalEnabled: Boolean = true,
    val journalHour: Int = 22,
    val journalMinute: Int = 0,
)

object EveningReminderPreferences {
    private const val PREFS = "life_os_evening_reminders"
    private const val KEY_TASKS_ENABLED = "tasks_enabled"
    private const val KEY_TASKS_HOUR = "tasks_hour"
    private const val KEY_TASKS_MINUTE = "tasks_minute"
    private const val KEY_JOURNAL_ENABLED = "journal_enabled"
    private const val KEY_JOURNAL_HOUR = "journal_hour"
    private const val KEY_JOURNAL_MINUTE = "journal_minute"

    fun load(context: Context): EveningScheduleConfig {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return EveningScheduleConfig(
            tasksEnabled = prefs.getBoolean(KEY_TASKS_ENABLED, true),
            tasksHour = prefs.getInt(KEY_TASKS_HOUR, 19),
            tasksMinute = prefs.getInt(KEY_TASKS_MINUTE, 30),
            journalEnabled = prefs.getBoolean(KEY_JOURNAL_ENABLED, true),
            journalHour = prefs.getInt(KEY_JOURNAL_HOUR, 22),
            journalMinute = prefs.getInt(KEY_JOURNAL_MINUTE, 0),
        )
    }

    fun save(context: Context, config: EveningScheduleConfig) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_TASKS_ENABLED, config.tasksEnabled)
            .putInt(KEY_TASKS_HOUR, config.tasksHour)
            .putInt(KEY_TASKS_MINUTE, config.tasksMinute)
            .putBoolean(KEY_JOURNAL_ENABLED, config.journalEnabled)
            .putInt(KEY_JOURNAL_HOUR, config.journalHour)
            .putInt(KEY_JOURNAL_MINUTE, config.journalMinute)
            .apply()
    }
}
