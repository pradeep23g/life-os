package com.lifeos.companion.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.updateAll
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.TIME_BUCKETS
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

data class FocusWidgetSnapshot(
    val activeId: String?,
    val activeBucket: String?,
    val activeStartTime: String?,
    val activeDescription: String?,
    val todayFocusMinutes: Int,
    val todayBucketMinutes: Map<String, Int>,
)

object WidgetStateSync {
    private const val PREFS = "life_os_focus_widget_state"
    private const val KEY_ACTIVE_ID = "active_id"
    private const val KEY_ACTIVE_BUCKET = "active_bucket"
    private const val KEY_ACTIVE_START = "active_start"
    private const val KEY_ACTIVE_DESC = "active_desc"
    private const val KEY_TODAY_MINS = "today_mins"
    private const val PREFIX_BUCKET = "bucket_mins_"

    fun saveFocusState(
        context: Context,
        active: TimeLogDto?,
        todayFocusMinutes: Int? = null,
        todayBucketMinutes: Map<String, Int>? = null,
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
        if (todayBucketMinutes != null) {
            TIME_BUCKETS.forEach { bucket ->
                editor.putInt("$PREFIX_BUCKET$bucket", todayBucketMinutes[bucket] ?: 0)
            }
        }
        editor.apply()

        refreshAllFocusWidgetsAsync(context)
    }

    fun loadFocusState(context: Context): FocusWidgetSnapshot {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val buckets = TIME_BUCKETS.associateWith { bucket ->
            prefs.getInt("$PREFIX_BUCKET$bucket", 0)
        }
        return FocusWidgetSnapshot(
            activeId = prefs.getString(KEY_ACTIVE_ID, null),
            activeBucket = prefs.getString(KEY_ACTIVE_BUCKET, null),
            activeStartTime = prefs.getString(KEY_ACTIVE_START, null),
            activeDescription = prefs.getString(KEY_ACTIVE_DESC, null),
            todayFocusMinutes = prefs.getInt(KEY_TODAY_MINS, 0),
            todayBucketMinutes = buckets,
        )
    }

    fun refreshAllFocusWidgetsAsync(context: Context) {
        val appCtx = context.applicationContext
        CoroutineScope(Dispatchers.IO).launch {
            runCatching { FocusGlanceWidget().updateAll(appCtx) }
            runCatching { FocusDonut1x1Widget().updateAll(appCtx) }
            runCatching { FocusMix2x2Widget().updateAll(appCtx) }
        }
    }

    fun refreshHabitWidgetAsync(context: Context) {
        val appCtx = context.applicationContext
        CoroutineScope(Dispatchers.IO).launch {
            runCatching { HabitGlanceWidget().updateAll(appCtx) }
        }
    }

    fun rebindAllAppWidgets(context: Context) {
        val appCtx = context.applicationContext
        val manager = AppWidgetManager.getInstance(appCtx)
        listOf(
            FocusGlanceWidgetReceiver::class.java,
            HabitGlanceWidgetReceiver::class.java,
            FocusDonut1x1WidgetReceiver::class.java,
            FocusMix2x2WidgetReceiver::class.java,
        ).forEach { receiverCls ->
            runCatching {
                val ids = manager.getAppWidgetIds(ComponentName(appCtx, receiverCls))
                if (ids.isNotEmpty()) {
                    val intent = Intent(appCtx, receiverCls).apply {
                        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    }
                    appCtx.sendBroadcast(intent)
                }
            }
        }
    }
}
