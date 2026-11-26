package com.lifeos.companion.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.lifeos.companion.MainActivity
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.FocusRepository
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.widgets.WidgetStateSync
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant

class FocusTimerService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var targetAlertJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ensureChannels()
        when (intent?.action) {
            ACTION_STOP_FROM_NOTIFICATION -> {
                val timeLogId = intent.getStringExtra(EXTRA_TIME_LOG_ID)
                val bucket = intent.getStringExtra(EXTRA_BUCKET) ?: "Deep Work"
                val startIso = intent.getStringExtra(EXTRA_START_TIME_ISO) ?: Instant.now().toString()
                serviceScope.launch {
                    runCatching {
                        SupabaseClientProvider.init(applicationContext)
                        val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id
                        if (userId != null && timeLogId != null) {
                            FocusRepository().stopTimer(
                                TimeLogDto(
                                    id = timeLogId,
                                    userId = userId,
                                    bucket = bucket,
                                    startTime = startIso,
                                ),
                            )
                            WidgetStateSync.saveFocusState(applicationContext, null)
                        }
                    }
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
                return START_NOT_STICKY
            }

            ACTION_START -> {
                val timeLogId = intent.getStringExtra(EXTRA_TIME_LOG_ID) ?: return START_NOT_STICKY
                val bucket = intent.getStringExtra(EXTRA_BUCKET) ?: "Deep Work"
                val description = intent.getStringExtra(EXTRA_DESCRIPTION)
                val startIso = intent.getStringExtra(EXTRA_START_TIME_ISO) ?: Instant.now().toString()
                val targetMinutes = intent.getIntExtra(EXTRA_TARGET_MINUTES, 0)
                val startMillis = runCatching { Instant.parse(startIso).toEpochMilli() }
                    .getOrElse { System.currentTimeMillis() }

                val notification = buildChronosNotification(
                    timeLogId = timeLogId,
                    bucket = bucket,
                    description = description,
                    startIso = startIso,
                    startMillis = startMillis,
                    targetMinutes = targetMinutes,
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    startForeground(
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }

                scheduleTargetAlertIfNeeded(bucket, startMillis, targetMinutes)
            }

            ACTION_DISMISS -> {
                targetAlertJob?.cancel()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun scheduleTargetAlertIfNeeded(
        bucket: String,
        startMillis: Long,
        targetMinutes: Int,
    ) {
        targetAlertJob?.cancel()
        if (targetMinutes <= 0) return
        val targetMillis = startMillis + targetMinutes * 60_000L
        val remaining = targetMillis - System.currentTimeMillis()
        if (remaining <= 0L) return

        targetAlertJob = serviceScope.launch {
            delay(remaining)
            val manager = getSystemService(NotificationManager::class.java)
            val openIntent = PendingIntent.getActivity(
                this@FocusTimerService,
                102,
                Intent(this@FocusTimerService, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val alert = NotificationCompat.Builder(this@FocusTimerService, CHANNEL_ALERT)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Focus target reached (${targetMinutes}m)")
                .setContentText("$bucket session hit your preset target. Stop or keep flowing.")
                .setContentIntent(openIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build()
            manager.notify(ALERT_NOTIFICATION_ID, alert)
        }
    }

    private fun buildChronosNotification(
        timeLogId: String,
        bucket: String,
        description: String?,
        startIso: String,
        startMillis: Long,
        targetMinutes: Int,
    ): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            100,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val stopIntent = PendingIntent.getService(
            this,
            101,
            Intent(this, FocusTimerService::class.java).apply {
                action = ACTION_STOP_FROM_NOTIFICATION
                putExtra(EXTRA_TIME_LOG_ID, timeLogId)
                putExtra(EXTRA_BUCKET, bucket)
                putExtra(EXTRA_START_TIME_ISO, startIso)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val subtitle = buildString {
            if (!description.isNullOrBlank()) {
                append(description)
            } else {
                append("Active focus session")
            }
            if (targetMinutes > 0) {
                append(" · Target ${targetMinutes}m")
            }
        }

        return NotificationCompat.Builder(this, CHANNEL_TIMER)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Chronos · $bucket")
            .setContentText(subtitle)
            .setUsesChronometer(true)
            .setWhen(startMillis)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openIntent)
            .addAction(android.R.drawable.ic_media_pause, "Stop", stopIntent)
            .build()
    }

    private fun ensureChannels() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_TIMER) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_TIMER,
                    "Chronos Focus Timer",
                    NotificationManager.IMPORTANCE_LOW,
                ),
            )
        }
        if (manager.getNotificationChannel(CHANNEL_ALERT) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ALERT,
                    "Focus Target Alerts",
                    NotificationManager.IMPORTANCE_HIGH,
                ),
            )
        }
    }

    override fun onDestroy() {
        targetAlertJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }

    companion object {
        private const val CHANNEL_TIMER = "chronos_timer"
        private const val CHANNEL_ALERT = "chronos_target_alert"
        private const val NOTIFICATION_ID = 4101
        private const val ALERT_NOTIFICATION_ID = 4102

        const val ACTION_START = "com.lifeos.companion.action.START_TIMER"
        const val ACTION_DISMISS = "com.lifeos.companion.action.DISMISS_TIMER"
        const val ACTION_STOP_FROM_NOTIFICATION = "com.lifeos.companion.action.STOP_TIMER_FROM_NOTIF"

        const val EXTRA_TIME_LOG_ID = "extra_time_log_id"
        const val EXTRA_BUCKET = "extra_bucket"
        const val EXTRA_DESCRIPTION = "extra_description"
        const val EXTRA_START_TIME_ISO = "extra_start_time_iso"
        const val EXTRA_TARGET_MINUTES = "extra_target_minutes"

        fun start(context: Context, log: TimeLogDto, targetMinutes: Int = 0) {
            val intent = Intent(context, FocusTimerService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_TIME_LOG_ID, log.id)
                putExtra(EXTRA_BUCKET, log.bucket)
                putExtra(EXTRA_DESCRIPTION, log.description)
                putExtra(EXTRA_START_TIME_ISO, log.startTime)
                putExtra(EXTRA_TARGET_MINUTES, targetMinutes)
            }
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, FocusTimerService::class.java).apply {
                action = ACTION_DISMISS
            }
            context.startService(intent)
        }
    }
}
