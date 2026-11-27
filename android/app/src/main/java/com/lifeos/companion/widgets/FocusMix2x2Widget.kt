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
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
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
private val TimeGold = Color(0xFFF59E0B)

class FocusMix2x2WidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = FocusMix2x2Widget()
}

class FocusMix2x2Widget : GlanceAppWidget() {
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

        val top3 = TIME_BUCKETS.map { b -> b to (snapshot.todayBucketMinutes[b] ?: 0) }
            .filter { it.second > 0 }
            .sortedByDescending { it.second }
            .take(3)

        val barBitmap = renderFlatBarBitmap(top3, snapshot.todayBucketMinutes)

        provideContent {
            FocusMix2x2Content(
                context = context,
                totalMinutes = snapshot.todayFocusMinutes,
                top3 = top3,
                barBitmap = barBitmap,
            )
        }
    }

    private fun renderFlatBarBitmap(
        @Suppress("UNUSED_PARAMETER") top3: List<Pair<String, Int>>,
        allBuckets: Map<String, Int>,
    ): Bitmap {
        val widthPx = 420
        val heightPx = 28
        val bmp = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)

        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.parseColor("#18181B")
        }
        canvas.drawRoundRect(RectF(0f, 0f, widthPx.toFloat(), heightPx.toFloat()), 12f, 12f, bgPaint)

        val sortedAll = TIME_BUCKETS.map { b -> b to (allBuckets[b] ?: 0) }
            .filter { it.second > 0 }
            .sortedByDescending { it.second }
        val total = sortedAll.sumOf { it.second }

        if (total > 0) {
            val segPaint = Paint(Paint.ANTI_ALIAS_FLAG)
            var left = 0f
            sortedAll.forEachIndexed { idx, (bucket, mins) ->
                val segWidth = (mins.toFloat() / total.toFloat()) * widthPx.toFloat()
                segPaint.color = android.graphics.Color.parseColor(TimeBucketColorStore.hexFor(bucket))
                val right = if (idx == sortedAll.lastIndex) widthPx.toFloat() else (left + segWidth)
                canvas.drawRect(left, 0f, right, heightPx.toFloat(), segPaint)
                left = right
            }
        }
        return bmp
    }
}

@Composable
private fun FocusMix2x2Content(
    context: Context,
    totalMinutes: Int,
    top3: List<Pair<String, Int>>,
    barBitmap: Bitmap,
) {
    val openIntent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://time-os?tab=analytics"), context, MainActivity::class.java)
    val totalLabel = if (totalMinutes >= 60) {
        "${totalMinutes / 60}h ${totalMinutes % 60}m"
    } else {
        "${totalMinutes}m"
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
                .padding(12.dp),
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "TIME OS",
                    style = TextStyle(
                        color = ColorProvider(TimeGold),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    ),
                    modifier = GlanceModifier.defaultWeight(),
                )
                Text(
                    text = totalLabel,
                    style = TextStyle(
                        color = ColorProvider(TextPrimary),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
            }

            Spacer(modifier = GlanceModifier.height(8.dp))

            Image(
                provider = ImageProvider(barBitmap),
                contentDescription = "Bucket distribution bar",
                modifier = GlanceModifier
                    .fillMaxWidth()
                    .height(10.dp),
            )

            Spacer(modifier = GlanceModifier.height(10.dp))

            if (top3.isEmpty()) {
                Text(
                    text = "No focus logged today",
                    style = TextStyle(color = ColorProvider(TextMuted), fontSize = 11.sp),
                )
            } else {
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    top3.forEach { (bucket, mins) ->
                        val bucketColor = TimeBucketColorStore.colorFor(bucket)
                        Column(
                            modifier = GlanceModifier.defaultWeight(),
                            horizontalAlignment = Alignment.Start,
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = GlanceModifier
                                        .size(7.dp)
                                        .background(bucketColor)
                                        .cornerRadius(4.dp),
                                ) {}
                                Spacer(modifier = GlanceModifier.width(4.dp))
                                Text(
                                    text = bucket.split(" ").first(),
                                    maxLines = 1,
                                    style = TextStyle(
                                        color = ColorProvider(TextPrimary),
                                        fontSize = 10.sp,
                                    ),
                                )
                            }
                            Text(
                                text = "${mins}m",
                                style = TextStyle(
                                    color = ColorProvider(bucketColor),
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
    }
}
