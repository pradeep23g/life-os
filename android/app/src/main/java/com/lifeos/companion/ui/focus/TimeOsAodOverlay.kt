package com.lifeos.companion.ui.focus

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.ActivityInfo
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.ui.theme.LifeOsColors
import kotlin.math.cos
import kotlin.math.sin

private fun Context.findActivity(): Activity? {
    var current: Context? = this
    while (current is ContextWrapper) {
        if (current is Activity) return current
        current = current.baseContext
    }
    return null
}

private fun aodMilestoneBadge(elapsedSeconds: Long): String? {
    if (elapsedSeconds < 600L) return null
    val mod600 = elapsedSeconds % 600L
    if (elapsedSeconds in 5400L..5410L) return "90M ULTRADIAN BRAC CYCLE"
    if (elapsedSeconds in 3120L..3130L) return "52M DESKTIME FLOW PEAK"
    if (elapsedSeconds in 1500L..1510L) return "25M POMODORO QUANTUM"
    if (mod600 < 10L) {
        val epoch = (elapsedSeconds / 600L).toInt()
        return "EPOCH ${epoch.toString().padStart(2, '0')} · ${epoch * 10}M LOCKED"
    }
    return null
}

@Composable
fun TimeOsAodOverlay(
    activeTimer: TimeLogDto,
    elapsedSeconds: Long,
    bucketColor: Color,
    targetMinutes: Int,
    onExitAod: () -> Unit,
) {
    val context = LocalContext.current
    val activity = remember(context) { context.findActivity() }

    BackHandler { onExitAod() }

    // Keep screen on + allow auto-rotate (sensor) + hide system bars while in AOD
    DisposableEffect(activity) {
        val window = activity?.window
        val prevOrientation = activity?.requestedOrientation ?: ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        if (activity != null && window != null) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(WindowInsetsCompat.Type.systemBars())
        }
        onDispose {
            if (activity != null && window != null) {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                activity.requestedOrientation = prevOrientation
                val controller = WindowCompat.getInsetsController(window, window.decorView)
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
        }
    }

    // 60-second anti-burn-in pixel shift (smooth Lissajous micro-drift within ±10dp)
    val minuteStep = (elapsedSeconds / 60L).toDouble()
    val density = LocalDensity.current
    val shiftXPx = with(density) { (10.0 * cos(minuteStep * 0.9)).dp.toPx() }.toFloat()
    val shiftYPx = with(density) { (10.0 * sin(minuteStep * 1.3)).dp.toPx() }.toFloat()

    // Scientific interval milestone (10-min attention epoch / 25m / 52m / 90m)
    val milestoneText = aodMilestoneBadge(elapsedSeconds)
    val isMilestoneActive = milestoneText != null

    var dragAccumulated by remember { mutableFloatStateOf(0f) }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(LifeOsColors.VoidBlack)
            .pointerInput(Unit) {
                detectVerticalDragGestures(
                    onDragStart = { dragAccumulated = 0f },
                    onVerticalDrag = { _, dragAmount ->
                        if (dragAmount > 0f) {
                            dragAccumulated += dragAmount
                            if (dragAccumulated > 140f) {
                                onExitAod()
                            }
                        }
                    },
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        val isLandscape = maxWidth > maxHeight
        val clockSize = if (isLandscape) 92.sp else 64.sp

        // Milestone-only radial aura & shockwave glow (zero continuous ambient glow)
        if (isMilestoneActive) {
            val infinite = rememberInfiniteTransition(label = "AodMilestonePulse")
            val shockwave by infinite.animateFloat(
                initialValue = 0.2f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Restart,
                ),
                label = "AodShockwave",
            )

            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f + shiftXPx, size.height / 2f + shiftYPx)
                val baseRadius = size.minDimension * if (isLandscape) 0.44f else 0.48f

                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            bucketColor.copy(alpha = 0.36f * (1f - shockwave * 0.4f)),
                            Color.Transparent,
                        ),
                        center = center,
                        radius = baseRadius * 1.45f,
                    ),
                    radius = baseRadius * 1.45f,
                    center = center,
                )

                drawCircle(
                    color = bucketColor.copy(alpha = (1f - shockwave) * 0.85f),
                    radius = baseRadius * (0.6f + 0.8f * shockwave),
                    center = center,
                    style = Stroke(width = 3.dp.toPx()),
                )
            }
        }

        // Pixel-shifted clock cluster
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .graphicsLayer {
                    translationX = shiftXPx
                    translationY = shiftYPx
                },
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(bucketColor),
                )
                Text(
                    text = activeTimer.bucket.uppercase(),
                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                    color = bucketColor,
                    letterSpacing = 2.sp,
                    fontWeight = FontWeight.Bold,
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = formatAodHms(elapsedSeconds),
                style = MaterialTheme.typography.displayLarge.copy(
                    fontFamily = FontFamily.Monospace,
                    fontSize = clockSize,
                ),
                color = LifeOsColors.TextPrimary,
                fontWeight = FontWeight.Bold,
            )

            if (!activeTimer.description.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = activeTimer.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = LifeOsColors.TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            if (targetMinutes > 0) {
                val progress = (elapsedSeconds / (targetMinutes * 60f)).coerceIn(0f, 1f)
                Spacer(modifier = Modifier.height(16.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    color = bucketColor,
                    trackColor = LifeOsColors.BorderSubtle,
                    modifier = Modifier
                        .width(200.dp)
                        .height(3.dp)
                        .clip(RoundedCornerShape(2.dp)),
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "TARGET ${targetMinutes}M · ${(progress * 100).toInt()}%",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                )
            }

            AnimatedVisibility(
                visible = milestoneText != null,
                enter = fadeIn(tween(350)),
                exit = fadeOut(tween(500)),
            ) {
                if (milestoneText != null) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Spacer(modifier = Modifier.height(18.dp))
                        Surface(
                            shape = CircleShape,
                            color = bucketColor.copy(alpha = 0.16f),
                            border = BorderStroke(1.dp, bucketColor.copy(alpha = 0.8f)),
                        ) {
                            Text(
                                text = milestoneText,
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                color = bucketColor,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.4.sp,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun formatAodHms(totalSeconds: Long): String {
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return "%02d:%02d:%02d".format(hours, minutes, seconds)
}
