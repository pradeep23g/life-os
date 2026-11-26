package com.lifeos.companion.ui.focus

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.util.IstClock
import kotlinx.coroutines.delay
import java.time.Duration
import java.time.Instant
import java.time.format.DateTimeFormatter

private val TARGET_PRESETS = listOf(0, 25, 50, 90)

@Composable
fun FocusScreen(
    preselectedTaskId: String?,
    onClearPreselectedTask: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: FocusViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(preselectedTaskId) {
        if (preselectedTaskId != null) {
            viewModel.applyPreselectedTask(preselectedTaskId)
            onClearPreselectedTask()
        }
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
        // Header
        item {
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
                        text = "Focus Engine",
                        style = MaterialTheme.typography.headlineSmall,
                        color = LifeOsColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${totalTodayMinutes}M TODAY",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextSecondary,
                    )
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            imageVector = Icons.Rounded.Refresh,
                            contentDescription = "Refresh",
                            tint = LifeOsColors.TextTertiary,
                            modifier = Modifier.size(18.dp),
                        )
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

        // Monolith Timer Card
        item {
            val active = state.activeTimer
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = LifeOsColors.SurfaceCard,
                border = BorderStroke(
                    1.dp,
                    if (active != null) LifeOsColors.TimeGold.copy(alpha = 0.75f) else LifeOsColors.BorderSubtle,
                ),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = if (active != null) "ACTIVE · ${active.bucket.uppercase()}" else "STANDBY",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = if (active != null) LifeOsColors.TimeGold else LifeOsColors.TextTertiary,
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
                            color = LifeOsColors.TimeGold,
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
                        OutlinedButton(
                            onClick = { viewModel.stopActiveFocus() },
                            enabled = !state.isSubmitting,
                            border = BorderStroke(1.dp, LifeOsColors.FieldReportsRose.copy(alpha = 0.75f)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = LifeOsColors.FieldReportsRose),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                        ) {
                            Icon(Icons.Rounded.Stop, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Close Focus Session", fontWeight = FontWeight.SemiBold)
                        }
                    } else {
                        Spacer(modifier = Modifier.height(16.dp))

                        // Target Presets
                        Text(
                            text = "TARGET PRESET",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextTertiary,
                            letterSpacing = 1.2.sp,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TARGET_PRESETS.forEach { preset ->
                                val selected = state.selectedTargetMinutes == preset
                                SelectChip(
                                    label = if (preset == 0) "OPEN" else "${preset}M",
                                    selected = selected,
                                    accent = LifeOsColors.TimeGold,
                                    onClick = { viewModel.selectTargetMinutes(preset) },
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Bucket selector
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
                                    accent = LifeOsColors.TimeGold,
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
                                containerColor = LifeOsColors.TimeGold,
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

        // Today's Bucket Distribution
        if (state.todayLogs.isNotEmpty()) {
            item {
                BucketBreakdownCard(logs = state.todayLogs, totalMinutes = totalTodayMinutes)
            }
        }

        // Today's Completed Logs
        item {
            Text(
                text = "TODAY'S SESSIONS",
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TextTertiary,
                letterSpacing = 1.4.sp,
            )
        }

        if (state.todayLogs.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = LifeOsColors.SurfaceCard,
                    border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "No completed sessions logged today.",
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextTertiary,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
        } else {
            items(state.todayLogs, key = { it.id }) { log ->
                FocusLogRow(log = log)
            }
        }
    }
}

@Composable
private fun BucketBreakdownCard(logs: List<TimeLogDto>, totalMinutes: Int) {
    val grouped = remember(logs) {
        TIME_BUCKETS.map { bucket ->
            bucket to logs.filter { it.bucket == bucket }.sumOf { it.durationMinutes ?: 0 }
        }.filter { it.second > 0 }
    }
    if (grouped.isEmpty()) return

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
            Text(
                text = "BUCKET ALLOCATION",
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TextTertiary,
                letterSpacing = 1.2.sp,
            )
            grouped.forEach { (bucket, mins) ->
                val ratio = if (totalMinutes > 0) mins.toFloat() / totalMinutes.toFloat() else 0f
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(bucket, style = MaterialTheme.typography.bodySmall, color = LifeOsColors.TextPrimary)
                        Text(
                            text = "${mins}m",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TimeGold,
                        )
                    }
                    LinearProgressIndicator(
                        progress = { ratio },
                        color = LifeOsColors.TimeGold,
                        trackColor = LifeOsColors.BorderSubtle,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(3.dp)
                            .clip(RoundedCornerShape(2.dp)),
                    )
                }
            }
        }
    }
}

@Composable
private fun FocusLogRow(log: TimeLogDto) {
    val startText = remember(log.startTime) {
        runCatching {
            Instant.parse(log.startTime)
                .atZone(IstClock.ZONE_IST)
                .format(DateTimeFormatter.ofPattern("HH:mm"))
        }.getOrDefault("--:--")
    }
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
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
                    color = LifeOsColors.TimeGold,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = startText,
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                )
            }
        }
    }
}

@Composable
private fun SelectChip(
    label: String,
    selected: Boolean,
    accent: androidx.compose.ui.graphics.Color,
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
