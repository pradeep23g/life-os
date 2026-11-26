package com.lifeos.companion.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.lifeos.companion.util.IstClock
import java.time.ZonedDateTime

object EveningReminderScheduler {
    private const val REQ_TASKS = 2001
    private const val REQ_JOURNAL = 2002

    fun scheduleAll(context: Context) {
        val config = EveningReminderPreferences.load(context)
        scheduleSingle(
            context = context,
            requestCode = REQ_TASKS,
            action = EveningReminderReceiver.ACTION_EVENING_TASKS,
            enabled = config.tasksEnabled,
            hourIst = config.tasksHour,
            minuteIst = config.tasksMinute,
        )
        scheduleSingle(
            context = context,
            requestCode = REQ_JOURNAL,
            action = EveningReminderReceiver.ACTION_EVENING_JOURNAL,
            enabled = config.journalEnabled,
            hourIst = config.journalHour,
            minuteIst = config.journalMinute,
        )
    }

    private fun scheduleSingle(
        context: Context,
        requestCode: Int,
        action: String,
        enabled: Boolean,
        hourIst: Int,
        minuteIst: Int,
    ) {
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            Intent(context, EveningReminderReceiver::class.java).apply { this.action = action },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        if (!enabled) {
            alarmManager.cancel(pendingIntent)
            return
        }

        val nowIst = ZonedDateTime.now(IstClock.ZONE_IST)
        var nextTrigger = nowIst
            .withHour(hourIst.coerceIn(0, 23))
            .withMinute(minuteIst.coerceIn(0, 59))
            .withSecond(0)
            .withNano(0)

        if (!nextTrigger.isAfter(nowIst)) {
            nextTrigger = nextTrigger.plusDays(1)
        }

        val triggerAtMillis = nextTrigger.toInstant().toEpochMilli()
        val canExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }

        if (canExact) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent,
            )
        } else {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent,
            )
        }
    }
}
