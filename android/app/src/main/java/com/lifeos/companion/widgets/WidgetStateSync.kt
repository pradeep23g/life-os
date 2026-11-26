package com.lifeos.companion.widgets

import android.content.Context
import androidx.glance.appwidget.updateAll
import com.lifeos.companion.data.model.TimeLogDto
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

data class FocusWidgetSnapshot(
    val activeId: String?,
    val activeBucket: String?,
    val activeStartTime: String?,
    val activeDescription: String?,
    val todayFocusMinutes: Int,
)

object WidgetStateSync {
    private const val PREFS = "life_os_focus_widget_state"
    private const val KEY_ACTIVE_ID = "active_id"
    private const val KEY_ACTIVE_BUCKET = "active_bucket"
    private const val KEY_ACTIVE_START = "active_start"
    private const val KEY_ACTIVE_DESC = "active_desc"
    private const val KEY_TODAY_MINS = "today_mins"

    fun saveFocusState(
        context: Context,
        active: TimeLogDto?,
        todayFocusMinutes: Int? = null,
    ) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        if (active != null) {
            editor.putString(KEY_ACTIVE_ID, active.id)
            editor.putString(KEY_ACTIVE_BUCKET, active.bucket)
            editor.putString(KEY_ACTIVE_START, active.startTime)
            editor.putString(KEY_ACTIVE_DESC, active.description)
        } else {
            editor.remove(KEY_ACTIVE_ID)
            editor.remove(KEY_ACTIVE_BUCKET)
            editor.remove(KEY_ACTIVE_START)
            editor.remove(KEY_ACTIVE_DESC)
        }
        if (todayFocusMinutes != null) {
            editor.putInt(KEY_TODAY_MINS, todayFocusMinutes)
        }
        editor.apply()

        CoroutineScope(Dispatchers.IO).launch {
            runCatching { FocusGlanceWidget().updateAll(context.applicationContext) }
        }
    }

    fun loadFocusState(context: Context): FocusWidgetSnapshot {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return FocusWidgetSnapshot(
            activeId = prefs.getString(KEY_ACTIVE_ID, null),
            activeBucket = prefs.getString(KEY_ACTIVE_BUCKET, null),
            activeStartTime = prefs.getString(KEY_ACTIVE_START, null),
            activeDescription = prefs.getString(KEY_ACTIVE_DESC, null),
            todayFocusMinutes = prefs.getInt(KEY_TODAY_MINS, 0),
        )
    }

    fun refreshHabitWidgetAsync(context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            runCatching { HabitGlanceWidget().updateAll(context.applicationContext) }
        }
    }
}
