package com.lifeos.companion.ui.focus

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Brightness2
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Memory
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.data.repository.TimeBucketColorStore
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.util.IstClock
import kotlinx.coroutines.delay
import java.time.Duration
import java.time.Instant
import java.time.format.DateTimeFormatter

private val TARGET_PRESETS = listOf(0, 25, 50, 90)

private data class CsMlQuote(
    val tag: String,
    val line: String,
)

private val CS_ML_TELEMETRY_QUOTES = listOf(
    CsMlQuote("ATTENTION // FLOPS", "Attention is scarce compute — allocate FLOPs exclusively to high-gradient work."),
    CsMlQuote("SYSTEMS // CACHE", "Context switches flush working memory. Protect L1 temporal locality."),
    CsMlQuote("BACKPROP // HORIZON", "Mastery is gradient descent with a low learning rate and zero skipped steps."),
    CsMlQuote("KERNEL // THROUGHPUT", "Optimize the inner loop first; everything else is I/O wait."),
    CsMlQuote("ALIGNMENT // SIGNAL", "Reduce entropy before scaling compute. Clarity beats raw hours."),
)

@Composable
fun FocusScreen(
    preselectedTaskId: String?,
    onClearPreselectedTask: () -> Unit,
    initialSubPage: TimeOsSubPage? = null,
    onConsumeInitialSubPage: () -> Unit = {},
    onAodActiveChanged: (Boolean) -> Unit = {},
    modifier: Modifier = Modifier,
    viewModel: FocusViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val bucketHexMap by TimeBucketColorStore.hexMap.collectAsState()
    var showManualLogSheet by remember { mutableStateOf(false) }

    val isAodShowing = state.isAodOpen && state.activeTimer != null
    LaunchedEffect(isAodShowing) {
        onAodActiveChanged(isAodShowing)
    }

    fun bucketColor(bucket: String): Color {
        val hex = bucketHexMap[bucket] ?: TimeBucketColorStore.hexFor(bucket)
        return TimeBucketColorStore.parseHexColor(hex)
    }

    LaunchedEffect(preselectedTaskId) {
        if (preselectedTaskId != null) {
            viewModel.applyPreselectedTask(preselectedTaskId)
            onClearPreselectedTask()
        }
    }

    LaunchedEffect(initialSubPage) {
        if (initialSubPage != null) {
            viewModel.selectSubPage(initialSubPage)
            onConsumeInitialSubPage()
        }
    }

    var elapsedSeconds by remember(state.activeTimer?.id) { mutableLongStateOf(0L) }
    LaunchedEffect(state.activeTimer?.id, state.activeTimer?.startTime) {
        val active = state.activeTimer
        if (active == null) {
            elapsedSeconds = 0L
            return@LaunchedEffect
        }
        val start = runCatching { Instant.parse(active.startTime) }.getOrElse { Instant.now() }
        while (true) {
            elapsedSeconds = Duration.between(start, Instant.now()).seconds.coerceAtLeast(0L)
            delay(1000L)
        }
    }

    // Full-Screen Immersive AOD Overlay
    if (state.isAodOpen && state.activeTimer != null) {
        TimeOsAodOverlay(
            activeTimer = state.activeTimer!!,
            elapsedSeconds = elapsedSeconds,
            bucketColor = bucketColor(state.activeTimer!!.bucket),
            targetMinutes = state.selectedTargetMinutes,
            onExitAod = { viewModel.setAodOpen(false) },
        )
        return
    }

    if (showManualLogSheet) {
        ManualSessionSheet(
            bucketHexMap = bucketHexMap,
            onDismiss = { showManualLogSheet = false },
            onSubmit = { bucket, start, end, desc ->
                viewModel.logManualSession(bucket, start, end, desc)
                showManualLogSheet = false
            },
        )
    }

    state.conflictTimer?.let { existing ->
        AlertDialog(
            onDismissRequest = { viewModel.dismissConflict() },
            containerColor = LifeOsColors.SurfaceElevated,
            title = {
                Text(
                    text = "Active Timer Detected",
                    style = MaterialTheme.typography.titleMedium,
                    color = LifeOsColors.TextPrimary,
                )
            },
            text = {
                Text(
                    text = "${existing.bucket} is already running (started elsewhere). Take over by closing the previous log and starting your new session, or resume it here?",
                    style = MaterialTheme.typography.bodySmall,
                    color = LifeOsColors.TextSecondary,
                )
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.takeOverConflict() },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = LifeOsColors.TimeGold,
                        contentColor = LifeOsColors.VoidBlack,
                    ),
                ) {
                    Text("Take Over")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.resumeConflictExisting() }) {
                    Text("Resume Existing", color = LifeOsColors.TextPrimary)
                }
            },
        )
    }

    val totalTodayMinutes = remember(state.todayLogs) {
        state.todayLogs.sumOf { it.durationMinutes ?: 0 }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(LifeOsColors.VoidBlack)
            .statusBarsPadding(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 104.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Header + Top Subpage Selector
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "TIME OS · CHRONOS",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TimeGold,
                            letterSpacing = 1.6.sp,
                        )
                        Text(
                            text = "Temporal Engine",
                            style = MaterialTheme.typography.headlineSmall,
                            color = LifeOsColors.TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = formatHoursMins(totalTodayMinutes),
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextSecondary,
                        )
                        IconButton(onClick = { showManualLogSheet = true }, modifier = Modifier.size(34.dp)) {
                            Icon(
                                imageVector = Icons.Rounded.Add,
                                contentDescription = "Manual Log",
                                tint = LifeOsColors.TimeGold,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                        IconButton(onClick = { viewModel.refresh() }, modifier = Modifier.size(34.dp)) {
                            Icon(
                                imageVector = Icons.Rounded.Refresh,
                                contentDescription = "Refresh",
                                tint = LifeOsColors.TextTertiary,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                    }
                }

                // 3-Tab Subpage Switcher right on top
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    TimeOsSubPage.entries.forEach { page ->
                        val selected = state.activeSubPage == page
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (selected) LifeOsColors.TimeGold.copy(alpha = 0.16f) else LifeOsColors.SurfaceCard,
                            border = BorderStroke(
                                1.dp,
                                if (selected) LifeOsColors.TimeGold else LifeOsColors.BorderSubtle,
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { viewModel.selectSubPage(page) },
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.padding(vertical = 9.dp),
                            ) {
                                Text(
                                    text = page.label,
                                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                    color = if (selected) LifeOsColors.TimeGold else LifeOsColors.TextSecondary,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                )
                            }
                        }
                    }
                }
            }
        }

        if (state.error != null) {
            item {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = LifeOsColors.FieldReportsRose.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, LifeOsColors.FieldReportsRose.copy(alpha = 0.45f)),
                ) {
                    Text(
                        text = state.error!!,
                        style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.FieldReportsRose,
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }
        }

        when (state.activeSubPage) {
            TimeOsSubPage.CHRONOS -> {
                // Animated CS & AI/ML Engineering Telemetry Card
                item {
                    CsMlTelemetryCard(
                        accent = if (state.activeTimer != null) {
                            bucketColor(state.activeTimer!!.bucket)
                        } else {
                            bucketColor(state.selectedBucket)
                        },
                    )
                }

                // Monolith Timer Card
                item {
                    val active = state.activeTimer
                    val activeAccent = if (active != null) bucketColor(active.bucket) else bucketColor(state.selectedBucket)

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = LifeOsColors.SurfaceCard,
                        border = BorderStroke(
                            1.dp,
                            if (active != null) activeAccent.copy(alpha = 0.8f) else LifeOsColors.BorderSubtle,
                        ),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = if (active != null) "ACTIVE · ${active.bucket.uppercase()}" else "STANDBY",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                color = if (active != null) activeAccent else LifeOsColors.TextTertiary,
                                letterSpacing = 1.5.sp,
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            Text(
                                text = formatMonolithDuration(elapsedSeconds),
                                style = MaterialTheme.typography.displayMedium.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 52.sp,
                                ),
                                color = if (active != null) LifeOsColors.TextPrimary else LifeOsColors.TextTertiary,
                                fontWeight = FontWeight.Bold,
                            )

                            if (active != null && state.selectedTargetMinutes > 0) {
                                val targetSec = state.selectedTargetMinutes * 60f
                                val progress = (elapsedSeconds / targetSec).coerceIn(0f, 1f)
                                Spacer(modifier = Modifier.height(10.dp))
                                LinearProgressIndicator(
                                    progress = { progress },
                                    color = activeAccent,
                                    trackColor = LifeOsColors.BorderSubtle,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(4.dp)
                                        .clip(RoundedCornerShape(2.dp)),
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "TARGET ${state.selectedTargetMinutes}M · ${(progress * 100).toInt()}%",
                                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                    color = LifeOsColors.TextSecondary,
                                )
                            }

                            if (active != null) {
                                if (!active.description.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = active.description,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = LifeOsColors.TextSecondary,
                                    )
                                }
                                Spacer(modifier = Modifier.height(18.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    OutlinedButton(
                                        onClick = { viewModel.stopActiveFocus() },
                                        enabled = !state.isSubmitting,
                                        border = BorderStroke(1.dp, LifeOsColors.FieldReportsRose.copy(alpha = 0.75f)),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LifeOsColors.FieldReportsRose),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier
                                            .weight(1.3f)
                                            .height(48.dp),
                                    ) {
                                        Icon(Icons.Rounded.Stop, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Close Session", fontWeight = FontWeight.SemiBold)
                                    }

                                    Button(
                                        onClick = { viewModel.setAodOpen(true) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = activeAccent.copy(alpha = 0.18f),
                                            contentColor = activeAccent,
                                        ),
                                        border = BorderStroke(1.dp, activeAccent.copy(alpha = 0.7f)),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier
                                            .weight(0.9f)
                                            .height(48.dp),
                                    ) {
                                        Icon(Icons.Rounded.Brightness2, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("AOD", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                    }
                                }
                            } else {
                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = "TARGET PRESET",
                                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                    color = LifeOsColors.TextTertiary,
                                    letterSpacing = 1.2.sp,
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    TARGET_PRESETS.forEach { preset ->
                                        SelectChip(
                                            label = if (preset == 0) "OPEN" else "${preset}M",
                                            selected = state.selectedTargetMinutes == preset,
                                            accent = LifeOsColors.TimeGold,
                                            onClick = { viewModel.selectTargetMinutes(preset) },
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                Text(
                                    text = "TIME BUCKET",
                                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                    color = LifeOsColors.TextTertiary,
                                    letterSpacing = 1.2.sp,
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                                ) {
                                    TIME_BUCKETS.forEach { bucket ->
                                        SelectChip(
                                            label = bucket,
                                            selected = state.selectedBucket == bucket,
                                            accent = bucketColor(bucket),
                                            onClick = { viewModel.selectBucket(bucket) },
                                        )
                                    }
                                }

                                if (state.openTasks.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(14.dp))
                                    Text(
                                        text = "LINK TASK (OPTIONAL)",
                                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                        color = LifeOsColors.TextTertiary,
                                        letterSpacing = 1.2.sp,
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                                    ) {
                                        SelectChip(
                                            label = "None",
                                            selected = state.selectedTaskId == null,
                                            accent = LifeOsColors.ProductivityBlue,
                                            onClick = { viewModel.selectTask(null) },
                                        )
                                        state.openTasks.take(8).forEach { task ->
                                            SelectChip(
                                                label = task.title,
                                                selected = state.selectedTaskId == task.id,
                                                accent = LifeOsColors.ProductivityBlue,
                                                onClick = { viewModel.selectTask(task.id) },
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                OutlinedTextField(
                                    value = state.description,
                                    onValueChange = { viewModel.updateDescription(it) },
                                    label = { Text("Session intention (optional)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Button(
                                    onClick = { viewModel.startFocus() },
                                    enabled = !state.isSubmitting,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = activeAccent,
                                        contentColor = LifeOsColors.VoidBlack,
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                ) {
                                    if (state.isSubmitting) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(18.dp),
                                            strokeWidth = 2.dp,
                                            color = LifeOsColors.VoidBlack,
                                        )
                                    } else {
                                        Icon(Icons.Rounded.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Start Focus", fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }

                item {
                    Text(
                        text = "TODAY'S SESSIONS (${state.todayLogs.size})",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextTertiary,
                        letterSpacing = 1.4.sp,
                    )
                }

                if (state.todayLogs.isEmpty()) {
                    item {
                        EmptyBox("No completed sessions logged today. Tap + above for manual entry.")
                    }
                } else {
                    items(state.todayLogs, key = { it.id }) { log ->
                        FocusLogRow(
                            log = log,
                            accent = bucketColor(log.bucket),
                            onDelete = { viewModel.deleteSession(log) },
                        )
                    }
                }
            }

            TimeOsSubPage.STRIP -> {
                item {
                    Interactive24HourStripCard(
                        logs = state.todayLogs,
                        activeTimer = state.activeTimer,
                        bucketColor = ::bucketColor,
                    )
                }

                item {
                    BucketDistributionCard(
                        title = "TODAY'S BUCKET DISTRIBUTION",
                        logs = state.todayLogs,
                        bucketColor = ::bucketColor,
                    )
                }
            }

            TimeOsSubPage.ANALYTICS -> {
                item {
                    HorizonTotalsRow(
                        logs7d = state.logs7d,
                        logs30d = state.logs30d,
                    )
                }

                item {
                    BucketDistributionCard(
                        title = "7-DAY BUCKET ALLOCATION",
                        logs = state.logs7d,
                        bucketColor = ::bucketColor,
                    )
                }

                item {
                    BucketDistributionCard(
                        title = "30-DAY BUCKET ALLOCATION",
                        logs = state.logs30d,
                        bucketColor = ::bucketColor,
                    )
                }

                item {
                    Text(
                        text = "30-DAY HISTORY (${state.logs30d.size})",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextTertiary,
                        letterSpacing = 1.4.sp,
                    )
                }

                if (state.logs30d.isEmpty()) {
                    item { EmptyBox("No sessions recorded in the past 30 days.") }
                } else {
                    items(state.logs30d.take(40), key = { it.id }) { log ->
                        FocusLogRow(
                            log = log,
                            accent = bucketColor(log.bucket),
                            showDate = true,
                            onDelete = { viewModel.deleteSession(log) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CsMlTelemetryCard(accent: Color) {
    var quoteIndex by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(9_000L)
            quoteIndex = (quoteIndex + 1) % CS_ML_TELEMETRY_QUOTES.size
        }
    }
    val infinite = rememberInfiniteTransition(label = "CsMlPulse")
    val pulse by infinite.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "CsMlDotPulse",
    )

    val quote = CS_ML_TELEMETRY_QUOTES[quoteIndex]

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.35f)),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { quoteIndex = (quoteIndex + 1) % CS_ML_TELEMETRY_QUOTES.size },
    ) {
        Box(
            modifier = Modifier.background(
                Brush.horizontalGradient(
                    colors = listOf(
                        accent.copy(alpha = 0.08f * pulse),
                        Color.Transparent,
                    ),
                ),
            ),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Memory,
                        contentDescription = null,
                        tint = accent.copy(alpha = 0.5f + 0.5f * pulse),
                        modifier = Modifier.size(15.dp),
                    )
                    Text(
                        text = quote.tag,
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = accent,
                        letterSpacing = 1.4.sp,
                    )
                }
                Text(
                    text = quote.line,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                    color = LifeOsColors.TextPrimary,
                )
            }
        }
    }
}

private data class StripSegment(
    val log: TimeLogDto,
    val startFraction: Float,
    val endFraction: Float,
    val startHms: String,
    val endHms: String,
    val durationMins: Int,
)

@Composable
private fun Interactive24HourStripCard(
    logs: List<TimeLogDto>,
    activeTimer: TimeLogDto?,
    bucketColor: (String) -> Color,
) {
    val todayIst = IstClock.todayIst()
    val dayStartMs = remember(todayIst) { todayIst.atStartOfDay(IstClock.ZONE_IST).toInstant().toEpochMilli() }
    val dayEndMs = remember(dayStartMs) { dayStartMs + 86_400_000L }
    val fmt = remember { DateTimeFormatter.ofPattern("HH:mm:ss") }

    val segments = remember(logs, activeTimer) {
        val combined = if (activeTimer != null) logs + activeTimer else logs
        combined.mapNotNull { log ->
            val sInstant = runCatching { Instant.parse(log.startTime) }.getOrNull() ?: return@mapNotNull null
            val eInstant = if (log.endTime != null) {
                runCatching { Instant.parse(log.endTime) }.getOrNull() ?: Instant.now()
            } else {
                Instant.now()
            }
            val sMs = sInstant.toEpochMilli().coerceIn(dayStartMs, dayEndMs)
            val eMs = eInstant.toEpochMilli().coerceIn(dayStartMs, dayEndMs)
            if (eMs <= sMs) return@mapNotNull null

            val sFrac = ((sMs - dayStartMs).toFloat() / 86_400_000f).coerceIn(0f, 1f)
            val eFrac = ((eMs - dayStartMs).toFloat() / 86_400_000f).coerceIn(0f, 1f)
            val mins = log.durationMinutes ?: Duration.between(sInstant, eInstant).toMinutes().toInt().coerceAtLeast(1)

            StripSegment(
                log = log,
                startFraction = sFrac,
                endFraction = eFrac,
                startHms = sInstant.atZone(IstClock.ZONE_IST).format(fmt),
                endHms = if (log.endTime == null) "LIVE" else eInstant.atZone(IstClock.ZONE_IST).format(fmt),
                durationMins = mins,
            )
        }
    }

    var selectedSegment by remember(segments) { mutableStateOf<StripSegment?>(segments.lastOrNull()) }

    fun pickSegmentAtFraction(frac: Float) {
        val hit = segments.firstOrNull { frac in it.startFraction..it.endFraction }
            ?: segments.minByOrNull { seg ->
                val mid = (seg.startFraction + seg.endFraction) / 2f
                kotlin.math.abs(mid - frac)
            }
        if (hit != null) selectedSegment = hit
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "24-HOUR TEMPORAL STRIP",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                    letterSpacing = 1.2.sp,
                )
                Text(
                    text = "HOLD & SCRUB BAR",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace, fontSize = 10.sp),
                    color = LifeOsColors.TimeGold,
                )
            }

            // Inspected Session Readout (Storage-bar tooltip)
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = LifeOsColors.SurfaceElevated,
                border = BorderStroke(
                    1.dp,
                    selectedSegment?.let { bucketColor(it.log.bucket).copy(alpha = 0.6f) } ?: LifeOsColors.BorderSubtle,
                ),
                modifier = Modifier.fillMaxWidth(),
            ) {
                val sel = selectedSegment
                if (sel == null) {
                    Text(
                        text = "No sessions recorded on today's 24h timeline yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextTertiary,
                        modifier = Modifier.padding(12.dp),
                    )
                } else {
                    val c = bucketColor(sel.log.bucket)
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(c),
                                )
                                Text(
                                    text = sel.log.bucket.uppercase(),
                                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                                    color = c,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${sel.startHms}  →  ${sel.endHms}",
                                style = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace),
                                color = LifeOsColors.TextPrimary,
                                fontWeight = FontWeight.SemiBold,
                            )
                            if (!sel.log.description.isNullOrBlank()) {
                                Text(
                                    text = sel.log.description,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = LifeOsColors.TextSecondary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                        Text(
                            text = "${sel.durationMins}m",
                            style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Monospace),
                            color = c,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            // Interactive Storage-bar style 24h strip
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(LifeOsColors.VoidBlack)
                    .pointerInput(segments) {
                        detectTapGestures(
                            onPress = { offset ->
                                if (size.width > 0) {
                                    pickSegmentAtFraction((offset.x / size.width).coerceIn(0f, 1f))
                                }
                            },
                        )
                    }
                    .pointerInput(segments) {
                        detectHorizontalDragGestures { change, _ ->
                            change.consume()
                            if (size.width > 0) {
                                pickSegmentAtFraction((change.position.x / size.width).coerceIn(0f, 1f))
                            }
                        }
                    },
            ) {
                drawRoundRect(
                    color = LifeOsColors.SurfaceElevated,
                    cornerRadius = CornerRadius(8.dp.toPx()),
                )

                segments.forEach { seg ->
                    val left = seg.startFraction * size.width
                    val rawWidth = (seg.endFraction - seg.startFraction) * size.width
                    val width = rawWidth.coerceAtLeast(4.dp.toPx())
                    val isSelected = selectedSegment?.log?.id == seg.log.id
                    drawRect(
                        color = bucketColor(seg.log.bucket).copy(alpha = if (isSelected) 1f else 0.72f),
                        topLeft = Offset(left, 0f),
                        size = Size(width, size.height),
                    )
                }

                // Current IST time cursor
                val nowFrac = ((System.currentTimeMillis() - dayStartMs).toFloat() / 86_400_000f).coerceIn(0f, 1f)
                val cursorX = nowFrac * size.width
                drawLine(
                    color = LifeOsColors.HomeWhite,
                    start = Offset(cursorX, 0f),
                    end = Offset(cursorX, size.height),
                    strokeWidth = 1.5.dp.toPx(),
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                listOf("00:00", "06:00", "12:00", "18:00", "24:00").forEach { tick ->
                    Text(
                        text = tick,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                        ),
                        color = LifeOsColors.TextTertiary,
                    )
                }
            }
        }
    }
}

@Composable
private fun HorizonTotalsRow(
    logs7d: List<TimeLogDto>,
    logs30d: List<TimeLogDto>,
) {
    val mins7d = remember(logs7d) { logs7d.sumOf { it.durationMinutes ?: 0 } }
    val mins30d = remember(logs30d) { logs30d.sumOf { it.durationMinutes ?: 0 } }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        HorizonCard(
            label = "7-DAY TOTAL",
            totalMinutes = mins7d,
            avgPerDay = mins7d / 7,
            sessions = logs7d.size,
            modifier = Modifier.weight(1f),
        )
        HorizonCard(
            label = "30-DAY TOTAL",
            totalMinutes = mins30d,
            avgPerDay = mins30d / 30,
            sessions = logs30d.size,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun HorizonCard(
    label: String,
    totalMinutes: Int,
    avgPerDay: Int,
    sessions: Int,
    modifier: Modifier = Modifier,
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TextTertiary,
                letterSpacing = 1.2.sp,
            )
            Text(
                text = formatHoursMins(totalMinutes),
                style = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TimeGold,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "${avgPerDay}m/day · $sessions logs",
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TextSecondary,
            )
        }
    }
}

@Composable
private fun BucketDistributionCard(
    title: String,
    logs: List<TimeLogDto>,
    bucketColor: (String) -> Color,
) {
    val totalMinutes = remember(logs) { logs.sumOf { it.durationMinutes ?: 0 } }
    val grouped = remember(logs) {
        TIME_BUCKETS.map { bucket ->
            bucket to logs.filter { it.bucket == bucket }.sumOf { it.durationMinutes ?: 0 }
        }.filter { it.second > 0 }.sortedByDescending { it.second }
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                    letterSpacing = 1.2.sp,
                )
                Text(
                    text = formatHoursMins(totalMinutes),
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextSecondary,
                )
            }

            if (grouped.isEmpty()) {
                Text(
                    text = "No logged sessions in this window.",
                    style = MaterialTheme.typography.bodySmall,
                    color = LifeOsColors.TextTertiary,
                )
            } else {
                // Stacked proportional color bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp)
                        .clip(RoundedCornerShape(5.dp))
                        .background(LifeOsColors.VoidBlack),
                ) {
                    grouped.forEach { (bucket, mins) ->
                        val weight = (mins.toFloat() / totalMinutes.coerceAtLeast(1).toFloat()).coerceAtLeast(0.02f)
                        Box(
                            modifier = Modifier
                                .weight(weight)
                                .height(10.dp)
                                .background(bucketColor(bucket)),
                        )
                    }
                }

                grouped.forEach { (bucket, mins) ->
                    val pct = if (totalMinutes > 0) ((mins * 100f) / totalMinutes).toInt() else 0
                    val color = bucketColor(bucket)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(color),
                            )
                            Text(bucket, style = MaterialTheme.typography.bodySmall, color = LifeOsColors.TextPrimary)
                        }
                        Text(
                            text = "${mins}m · $pct%",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = color,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FocusLogRow(
    log: TimeLogDto,
    accent: Color,
    showDate: Boolean = false,
    onDelete: () -> Unit,
) {
    val startText = remember(log.startTime, showDate) {
        runCatching {
            val pattern = if (showDate) "dd MMM · HH:mm" else "HH:mm"
            Instant.parse(log.startTime)
                .atZone(IstClock.ZONE_IST)
                .format(DateTimeFormatter.ofPattern(pattern))
        }.getOrDefault("--:--")
    }
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = log.bucket,
                    style = MaterialTheme.typography.bodyMedium,
                    color = LifeOsColors.TextPrimary,
                    fontWeight = FontWeight.Medium,
                )
                if (!log.description.isNullOrBlank()) {
                    Text(
                        text = log.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${log.durationMinutes ?: 0}m",
                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                    color = accent,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = startText,
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                )
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                Icon(
                    imageVector = Icons.Rounded.DeleteOutline,
                    contentDescription = "Delete log",
                    tint = LifeOsColors.TextTertiary,
                    modifier = Modifier.size(16.dp),
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ManualSessionSheet(
    bucketHexMap: Map<String, String>,
    onDismiss: () -> Unit,
    onSubmit: (bucket: String, start: Instant, end: Instant, description: String?) -> Unit,
) {
    var selectedBucket by remember { mutableStateOf(TIME_BUCKETS[0]) }
    var minutesText by remember { mutableStateOf("30") }
    var description by remember { mutableStateOf("") }
    val parsedMinutes = minutesText.toLongOrNull()?.coerceIn(1L, 720L)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = LifeOsColors.SurfaceCard,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                text = "MANUAL EPOCH INJECTION",
                style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TimeGold,
                letterSpacing = 1.4.sp,
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.horizontalScroll(rememberScrollState()),
            ) {
                TIME_BUCKETS.forEach { bucket ->
                    val c = TimeBucketColorStore.parseHexColor(bucketHexMap[bucket] ?: "#3B82F6")
                    SelectChip(
                        label = bucket,
                        selected = selectedBucket == bucket,
                        accent = c,
                        onClick = { selectedBucket = bucket },
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("15", "30", "45", "60", "90").forEach { preset ->
                    SelectChip(
                        label = "${preset}m",
                        selected = minutesText == preset,
                        accent = LifeOsColors.TimeGold,
                        onClick = { minutesText = preset },
                    )
                }
            }

            OutlinedTextField(
                value = minutesText,
                onValueChange = { minutesText = it.filter { ch -> ch.isDigit() }.take(3) },
                label = { Text("Duration (minutes ending now)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("What was accomplished (optional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Button(
                onClick = {
                    if (parsedMinutes != null) {
                        val end = Instant.now()
                        val start = end.minusSeconds(parsedMinutes * 60L)
                        onSubmit(selectedBucket, start, end, description)
                    }
                },
                enabled = parsedMinutes != null,
                colors = ButtonDefaults.buttonColors(
                    containerColor = LifeOsColors.TimeGold,
                    contentColor = LifeOsColors.VoidBlack,
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Text("Inject Record", fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun EmptyBox(text: String) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = LifeOsColors.TextTertiary,
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Composable
private fun SelectChip(
    label: String,
    selected: Boolean,
    accent: Color,
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (selected) accent.copy(alpha = 0.16f) else LifeOsColors.SurfaceElevated,
        border = BorderStroke(1.dp, if (selected) accent else LifeOsColors.BorderSubtle),
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
            color = if (selected) accent else LifeOsColors.TextSecondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
        )
    }
}

private fun formatMonolithDuration(totalSeconds: Long): String {
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        "%02d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%02d:%02d".format(minutes, seconds)
    }
}

private fun formatHoursMins(totalMinutes: Int): String {
    val h = totalMinutes / 60
    val m = totalMinutes % 60
    return if (h > 0) "${h}h ${m}m" else "${m}m"
}
