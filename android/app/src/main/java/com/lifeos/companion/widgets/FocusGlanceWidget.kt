package com.lifeos.companion.widgets

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.ActionParameters
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.lifeos.companion.MainActivity
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.FocusRepository
import com.lifeos.companion.data.repository.StartFocusResult
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.service.FocusTimerService
import com.lifeos.companion.util.IstClock
import java.time.Instant
import java.time.format.DateTimeFormatter

private val OledBlack = Color(0xFF000000)
private val OledCard = Color(0xFF0A0A0A)
private val OledBorder = Color(0xFF222222)
private val TimeGold = Color(0xFFF59E0B)
private val RoseStop = Color(0xFFF43F5E)
private val TextPrimary = Color(0xFFF5F5F5)
private val TextMuted = Color(0xFF71717A)

class FocusGlanceWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = FocusGlanceWidget()
}

class FocusGlanceWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        SupabaseClientProvider.init(context)
        val userId = SupabaseClientProvider.awaitAuthenticatedUserId(context)
        val snapshot = runCatching {
            if (userId != null) {
                val remote = FocusRepository().fetchFocusSnapshot()
                val mins = remote.todayLogs.sumOf { it.durationMinutes ?: 0 }
                val bucketMins = TIME_BUCKETS.associateWith { b ->
                    remote.todayLogs.filter { it.bucket == b }.sumOf { it.durationMinutes ?: 0 }
                }
                WidgetStateSync.saveFocusState(context, remote.activeTimer, mins, bucketMins)
                WidgetStateSync.loadFocusState(context)
            } else {
                WidgetStateSync.loadFocusState(context)
            }
        }.getOrElse { WidgetStateSync.loadFocusState(context) }

        provideContent {
            FocusWidgetContent(context = context, snapshot = snapshot)
        }
    }
}

@Composable
private fun FocusWidgetContent(
    context: Context,
    snapshot: FocusWidgetSnapshot,
) {
    val isActive = snapshot.activeId != null
    val openIntent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://focus"), context, MainActivity::class.java)
    val startLabel = snapshot.activeStartTime?.let { iso ->
        runCatching {
            Instant.parse(iso)
                .atZone(IstClock.ZONE_IST)
                .format(DateTimeFormatter.ofPattern("HH:mm"))
        }.getOrNull()
    }

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(OledBorder)
            .cornerRadius(16.dp)
            .padding(1.dp),
    ) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(OledBlack)
                .cornerRadius(15.dp)
                .clickable(actionStartActivity(openIntent))
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = if (isActive) "CHRONOS · LIVE" else "CHRONOS",
                    style = TextStyle(
                        color = ColorProvider(TimeGold),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    ),
                    modifier = GlanceModifier.defaultWeight(),
                )
                Text(
                    text = "${snapshot.todayFocusMinutes}M",
                    style = TextStyle(
                        color = ColorProvider(TextMuted),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
            }

            Spacer(modifier = GlanceModifier.height(8.dp))

            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = GlanceModifier.defaultWeight()) {
                    Text(
                        text = if (isActive) (snapshot.activeBucket ?: "Deep Work") else "Deep Work",
                        style = TextStyle(
                            color = ColorProvider(TextPrimary),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                        ),
                    )
                    Text(
                        text = if (isActive) {
                            "Since ${startLabel ?: "--:--"} IST"
                        } else {
                            "Tap Start for instant session"
                        },
                        style = TextStyle(
                            color = ColorProvider(TextMuted),
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                        ),
                    )
                }

                Spacer(modifier = GlanceModifier.width(8.dp))

                Box(
                    contentAlignment = Alignment.Center,
                    modifier = GlanceModifier
                        .background(if (isActive) RoseStop else TimeGold)
                        .cornerRadius(10.dp)
                        .clickable(
                            actionRunCallback(
                                if (isActive) StopFocusWidgetAction::class.java
                                else StartDeepWorkWidgetAction::class.java,
                            ),
                        )
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                ) {
                    Text(
                        text = if (isActive) "STOP" else "START",
                        style = TextStyle(
                            color = ColorProvider(OledBlack),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                        ),
                    )
                }
            }
        }
    }
}

class StartDeepWorkWidgetAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val userId = SupabaseClientProvider.awaitAuthenticatedUserId(context)
        if (userId == null) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://focus"), context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            return
        }

        val repo = FocusRepository()
        runCatching {
            when (val res = repo.startWithConflictCheck(bucket = "Deep Work", taskId = null, description = null)) {
                is StartFocusResult.Started -> {
                    FocusTimerService.start(context, res.log)
                    WidgetStateSync.saveFocusState(context, res.log)
                }
                is StartFocusResult.Conflict -> {
                    // Active session already exists (e.g., started on Web); sync widget to it & start FGS
                    FocusTimerService.start(context, res.existing)
                    WidgetStateSync.saveFocusState(context, res.existing)
                }
            }
        }
        FocusGlanceWidget().update(context, glanceId)
    }
}

class StopFocusWidgetAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val cached = WidgetStateSync.loadFocusState(context)
        val userId = SupabaseClientProvider.awaitAuthenticatedUserId(context)
        if (userId != null && cached.activeId != null && cached.activeStartTime != null) {
            runCatching {
                val repo = FocusRepository()
                repo.stopTimer(
                    TimeLogDto(
                        id = cached.activeId,
                        userId = userId,
                        bucket = cached.activeBucket ?: "Deep Work",
                        description = cached.activeDescription,
                        startTime = cached.activeStartTime,
                    ),
                )
                val snap = repo.fetchFocusSnapshot()
                val mins = snap.todayLogs.sumOf { it.durationMinutes ?: 0 }
                FocusTimerService.stop(context)
                WidgetStateSync.saveFocusState(context, snap.activeTimer, mins)
            }.onFailure {
                FocusTimerService.stop(context)
                WidgetStateSync.saveFocusState(context, null)
            }
        }
        FocusGlanceWidget().update(context, glanceId)
    }
}
