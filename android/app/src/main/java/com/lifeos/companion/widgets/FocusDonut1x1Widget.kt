package com.lifeos.companion.widgets

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.lifeos.companion.MainActivity
import com.lifeos.companion.data.repository.FocusRepository
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.data.repository.TimeBucketColorStore
import com.lifeos.companion.data.supabase.SupabaseClientProvider

private val OledBlack = Color(0xFF000000)
private val OledBorder = Color(0xFF222222)
private val TextPrimary = Color(0xFFF5F5F5)
private val TextMuted = Color(0xFF71717A)

class FocusDonut1x1WidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = FocusDonut1x1Widget()
}

class FocusDonut1x1Widget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        SupabaseClientProvider.init(context)
        TimeBucketColorStore.init(context)
        val userId = SupabaseClientProvider.awaitAuthenticatedUserId(context)
        val snapshot = runCatching {
            if (userId != null) {
                TimeBucketColorStore.refreshFromRemote(context)
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

        val bitmap = renderDonutBitmap(snapshot)

        provideContent {
            FocusDonut1x1Content(
                context = context,
                totalMinutes = snapshot.todayFocusMinutes,
                donutBitmap = bitmap,
            )
        }
    }

    private fun renderDonutBitmap(snapshot: FocusWidgetSnapshot): Bitmap {
        val sizePx = 200
        val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val stroke = 20f
        val pad = stroke / 2f + 8f
        val rect = RectF(pad, pad, sizePx - pad, sizePx - pad)

        val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = stroke
            color = android.graphics.Color.parseColor("#1C1C20")
        }
        canvas.drawOval(rect, trackPaint)

        val entries = TIME_BUCKETS.map { b -> b to (snapshot.todayBucketMinutes[b] ?: 0) }
            .filter { it.second > 0 }
            .sortedByDescending { it.second }
        val total = entries.sumOf { it.second }

        if (total > 0) {
            var startAngle = -90f
            val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = stroke
                strokeCap = Paint.Cap.BUTT
            }
            entries.forEach { (bucket, mins) ->
                val sweep = (mins.toFloat() / total.toFloat()) * 360f
                arcPaint.color = android.graphics.Color.parseColor(TimeBucketColorStore.hexFor(bucket))
                val gap = if (entries.size > 1) 2.5f else 0f
                canvas.drawArc(rect, startAngle, (sweep - gap).coerceAtLeast(1f), false, arcPaint)
                startAngle += sweep
            }
        }
        return bmp
    }
}

@Composable
private fun FocusDonut1x1Content(
    context: Context,
    totalMinutes: Int,
    donutBitmap: Bitmap,
) {
    val openIntent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://time-os?tab=strip"), context, MainActivity::class.java)
    val label = if (totalMinutes >= 60) {
        val h = totalMinutes / 60
        val m = totalMinutes % 60
        if (m == 0) "${h}h" else "${h}h${m}"
    } else {
        "${totalMinutes}m"
    }

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(OledBorder)
            .cornerRadius(18.dp)
            .padding(1.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = GlanceModifier
                .fillMaxSize()
                .background(OledBlack)
                .cornerRadius(17.dp)
                .clickable(actionStartActivity(openIntent))
                .padding(6.dp),
        ) {
            Image(
                provider = ImageProvider(donutBitmap),
                contentDescription = "Focus Donut",
                modifier = GlanceModifier.fillMaxSize(),
            )
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = label,
                    style = TextStyle(
                        color = ColorProvider(TextPrimary),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
                Text(
                    text = "TODAY",
                    style = TextStyle(
                        color = ColorProvider(TextMuted),
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
            }
        }
    }
}
