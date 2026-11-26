package com.lifeos.companion.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat
import com.lifeos.companion.MainActivity
import com.lifeos.companion.data.local.LifeOsDatabase
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.util.IstClock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant

class EveningReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        when (action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED",
            -> {
                EveningReminderScheduler.scheduleAll(context)
            }

            ACTION_EVENING_TASKS -> {
                val pendingResult = goAsync()
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        EveningReminderScheduler.scheduleAll(context)
                        showTasksCheckIn(context)
                    } finally {
                        pendingResult.finish()
                    }
                }
            }

            ACTION_EVENING_JOURNAL -> {
                val pendingResult = goAsync()
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        EveningReminderScheduler.scheduleAll(context)
                        showJournalCheckIn(context)
                    } finally {
                        pendingResult.finish()
                    }
                }
            }
        }
    }

    companion object {
        const val ACTION_EVENING_TASKS = "com.lifeos.companion.action.EVENING_TASKS"
        const val ACTION_EVENING_JOURNAL = "com.lifeos.companion.action.EVENING_JOURNAL"
        private const val CHANNEL_ID = "life_os_evening_sync"
        private const val NOTIF_TASKS = 5101
        private const val NOTIF_JOURNAL = 5102

        suspend fun showTasksCheckIn(context: Context) {
            ensureChannel(context)
            val openCount = runCatching {
                SupabaseClientProvider.init(context)
                val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id ?: return@runCatching null
                LifeOsDatabase.get(context).dao().getTasksSnapshot(userId).count { !it.isCompleted }
            }.getOrNull()

            val body = when {
                openCount == null -> "Review your remaining execution tasks for today."
                openCount == 0 -> "Today's execution ledger is clear. Do a quick final check."
                openCount == 1 -> "1 open task remaining on your ledger."
                else -> "$openCount open tasks remaining on your ledger."
            }

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://tasks/today"), context, MainActivity::class.java)
            val pi = PendingIntent.getActivity(
                context,
                NOTIF_TASKS,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_agenda)
                .setContentTitle("Life OS · Evening Tasks")
                .setContentText(body)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()

            context.getSystemService(NotificationManager::class.java).notify(NOTIF_TASKS, notification)
        }

        suspend fun showJournalCheckIn(context: Context) {
            ensureChannel(context)
            val loggedToday = runCatching {
                SupabaseClientProvider.init(context)
                val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id ?: return@runCatching false
                val todayIst = IstClock.todayIstString()
                LifeOsDatabase.get(context).dao().getJournalsSnapshot(userId).any { entry ->
                    runCatching { IstClock.toIstDateString(Instant.parse(entry.createdAt)) }.getOrNull() == todayIst
                }
            }.getOrDefault(false)

            val body = if (loggedToday) {
                "Today's reflection is logged. Add any closing thoughts before rest."
            } else {
                "Evening close: capture mood, wins, and what you learned today."
            }

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://mind/journal"), context, MainActivity::class.java)
            val pi = PendingIntent.getActivity(
                context,
                NOTIF_JOURNAL,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_edit)
                .setContentTitle("Life OS · Daily Journal")
                .setContentText(body)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()

            context.getSystemService(NotificationManager::class.java).notify(NOTIF_JOURNAL, notification)
        }

        private fun ensureChannel(context: Context) {
            val manager = context.getSystemService(NotificationManager::class.java)
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                manager.createNotificationChannel(
                    NotificationChannel(
                        CHANNEL_ID,
                        "Evening Check-ins",
                        NotificationManager.IMPORTANCE_DEFAULT,
                    ),
                )
            }
        }
    }
}
