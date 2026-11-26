package com.lifeos.companion.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.HabitWithTodayStatus
import com.lifeos.companion.ui.navigation.LifeOsRoute
import com.lifeos.companion.ui.theme.CircadianMode
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.util.IstClock
import kotlinx.coroutines.delay
import java.time.Duration
import java.time.Instant
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    onNavigate: (LifeOsRoute) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HomeViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val istNow = remember { ZonedDateTime.now(IstClock.ZONE_IST) }
    val circadian = remember { CircadianMode.currentIst() }
    val dateLabel = remember { istNow.format(DateTimeFormatter.ofPattern("EEE · dd MMM")) }

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
                    text = "A ${existing.bucket} session is already active (possibly from Web). Take over and stop the previous session, or resume it here?",
                    style = MaterialTheme.typography.bodySmall,
                    color = LifeOsColors.TextSecondary,
                )
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.resolveConflictTakeOver() },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = LifeOsColors.TimeGold,
                        contentColor = LifeOsColors.VoidBlack,
                    ),
                ) {
                    Text("Take Over")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.resolveConflictResumeExisting() }) {
                    Text("Resume Existing", color = LifeOsColors.TextPrimary)
                }
            },
        )
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(LifeOsColors.VoidBlack)
            .statusBarsPadding(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 104.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Editorial Masthead (3-Tier Typography: Mono telemetry + Sans title + Serif directive)
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
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
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(circadian.accent),
                        )
                        Text(
                            text = "${circadian.label} · $dateLabel IST".uppercase(),
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextSecondary,
                            letterSpacing = 1.5.sp,
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        if (state.pendingOutboxCount > 0) {
                            Surface(
                                shape = CircleShape,
                                color = LifeOsColors.TimeGold.copy(alpha = 0.14f),
                                border = BorderStroke(1.dp, LifeOsColors.TimeGold.copy(alpha = 0.5f)),
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .clickable { viewModel.flushOutbox() },
                            ) {
                                Text(
                                    text = "${state.pendingOutboxCount} QUEUED",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp,
                                    ),
                                    color = LifeOsColors.TimeGold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                )
                            }
                        }
                        IconButton(
                            onClick = { viewModel.refresh() },
                            modifier = Modifier.size(32.dp),
                        ) {
                            if (state.isRefreshing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 1.8.dp,
                                    color = circadian.accent,
                                )
                            } else {
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

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "The Porch",
                    style = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.SansSerif),
                    color = LifeOsColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )

                Text(
                    text = circadian.prompt,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                    color = LifeOsColors.TextSecondary,
                )
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

        if (state.isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = LifeOsColors.TimeGold, strokeWidth = 2.dp)
                }
            }
        } else {
            // 1. Live Focus Timer Banner (Time OS Gold)
            item {
                FocusTimerBanner(
                    activeTimer = state.activeTimer,
                    todayFocusMinutes = state.todayFocusMinutes,
                    onStart = { viewModel.startQuickFocus() },
                    onStop = { viewModel.stopActiveFocus() },
                    onOpenFocus = { onNavigate(LifeOsRoute.FOCUS) },
                )
            }

            // 2. Today's Habits Card (Mind OS Purple)
            item {
                TodayHabitsCard(
                    habits = state.habits,
                    onToggleHabit = { viewModel.toggleHabit(it) },
                    onOpenHabits = { onNavigate(LifeOsRoute.HABITS) },
                )
            }

            // 3. Today's Tasks Card (Productivity Hub Blue)
            item {
                TodayTasksCard(
                    tasks = state.pendingTasks,
                    onToggleTask = { viewModel.toggleTask(it) },
                    onOpenTasks = { onNavigate(LifeOsRoute.TASKS) },
                )
            }

            // 4. Quick Journal CTA (Mind OS Purple / Serif prompt)
            item {
                QuickJournalCtaCard(
                    loggedToday = state.journalLoggedToday,
                    onOpenJournal = { onNavigate(LifeOsRoute.JOURNAL) },
                )
            }
        }
    }
}

@Composable
private fun FocusTimerBanner(
    activeTimer: TimeLogDto?,
    todayFocusMinutes: Int,
    onStart: () -> Unit,
    onStop: () -> Unit,
    onOpenFocus: () -> Unit,
) {
    var elapsedSeconds by remember(activeTimer?.id) { mutableLongStateOf(0L) }

    LaunchedEffect(activeTimer?.id, activeTimer?.startTime) {
        if (activeTimer == null) {
            elapsedSeconds = 0L
            return@LaunchedEffect
        }
        val start = runCatching { Instant.parse(activeTimer.startTime) }.getOrElse { Instant.now() }
        while (true) {
            elapsedSeconds = Duration.between(start, Instant.now()).seconds.coerceAtLeast(0L)
            delay(1000L)
        }
    }

    val isRunning = activeTimer != null
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(
            width = 1.dp,
            color = if (isRunning) LifeOsColors.TimeGold.copy(alpha = 0.7f) else LifeOsColors.BorderSubtle,
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onOpenFocus),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Timer,
                        contentDescription = null,
                        tint = LifeOsColors.TimeGold,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        text = if (isRunning) "CHRONOS · ${activeTimer!!.bucket.uppercase()}" else "CHRONOS · IDLE",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = if (isRunning) LifeOsColors.TimeGold else LifeOsColors.TextTertiary,
                        letterSpacing = 1.2.sp,
                    )
                }
                Text(
                    text = "${todayFocusMinutes}M TODAY",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    if (isRunning) {
                        Text(
                            text = formatDuration(elapsedSeconds),
                            style = MaterialTheme.typography.headlineLarge.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextPrimary,
                            fontWeight = FontWeight.Bold,
                        )
                        if (!activeTimer?.description.isNullOrBlank()) {
                            Text(
                                text = activeTimer!!.description!!,
                                style = MaterialTheme.typography.bodySmall,
                                color = LifeOsColors.TextSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    } else {
                        Text(
                            text = "00:00",
                            style = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextTertiary,
                            fontWeight = FontWeight.Medium,
                        )
                        Text(
                            text = "Start Deep Work session",
                            style = MaterialTheme.typography.bodySmall,
                            color = LifeOsColors.TextSecondary,
                        )
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                if (isRunning) {
                    OutlinedButton(
                        onClick = onStop,
                        border = BorderStroke(1.dp, LifeOsColors.FieldReportsRose.copy(alpha = 0.7f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LifeOsColors.FieldReportsRose),
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Icon(Icons.Rounded.Stop, contentDescription = "Stop", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Stop", fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Button(
                        onClick = onStart,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = LifeOsColors.TimeGold,
                            contentColor = LifeOsColors.VoidBlack,
                        ),
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Icon(Icons.Rounded.PlayArrow, contentDescription = "Start", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Focus", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun TodayHabitsCard(
    habits: List<HabitWithTodayStatus>,
    onToggleHabit: (HabitWithTodayStatus) -> Unit,
    onOpenHabits: () -> Unit,
) {
    val completedCount = habits.count { it.isDone }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            SectionHeader(
                title = "MIND · HABITS",
                badge = "$completedCount/${habits.size}",
                accent = LifeOsColors.MindPurple,
                onActionClick = onOpenHabits,
            )

            Spacer(modifier = Modifier.height(10.dp))

            if (habits.isEmpty()) {
                Text(
                    text = "No active habits configured.",
                    style = MaterialTheme.typography.bodySmall,
                    color = LifeOsColors.TextTertiary,
                )
            } else {
                habits.take(5).forEachIndexed { index, item ->
                    if (index > 0) {
                        HorizontalDivider(color = LifeOsColors.BorderSubtle.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onToggleHabit(item) }
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = if (item.isDone) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                            contentDescription = null,
                            tint = if (item.isDone) LifeOsColors.MindPurple else LifeOsColors.TextTertiary,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = item.habit.title,
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (item.isDone) LifeOsColors.TextTertiary else LifeOsColors.TextPrimary,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        if (item.habit.habitType == "target") {
                            Text(
                                text = "${item.todayValue}/${item.habit.targetValue}",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                color = LifeOsColors.TextSecondary,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TodayTasksCard(
    tasks: List<TaskDto>,
    onToggleTask: (TaskDto) -> Unit,
    onOpenTasks: () -> Unit,
) {
    val todayIst = remember { IstClock.todayIstString() }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            SectionHeader(
                title = "EXECUTION · TASKS",
                badge = "${tasks.size} OPEN",
                accent = LifeOsColors.ProductivityBlue,
                onActionClick = onOpenTasks,
            )

            Spacer(modifier = Modifier.height(10.dp))

            if (tasks.isEmpty()) {
                Text(
                    text = "Execution ledger clear.",
                    style = MaterialTheme.typography.bodySmall,
                    color = LifeOsColors.TextTertiary,
                )
            } else {
                tasks.take(5).forEachIndexed { index, task ->
                    if (index > 0) {
                        HorizontalDivider(color = LifeOsColors.BorderSubtle.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                    val isOverdue = task.deadlineType == "specific_date" &&
                        task.deadlineDate != null &&
                        task.deadlineDate < todayIst
                    val isToday = task.deadlineType == "same_day" || task.deadlineDate == todayIst

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onToggleTask(task) }
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.RadioButtonUnchecked,
                            contentDescription = "Complete task",
                            tint = if (isOverdue) LifeOsColors.FieldReportsRose else LifeOsColors.ProductivityBlue,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = task.title,
                            style = MaterialTheme.typography.bodyMedium,
                            color = LifeOsColors.TextPrimary,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        if (isOverdue || isToday) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isOverdue) "OVERDUE" else "TODAY",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                color = if (isOverdue) LifeOsColors.FieldReportsRose else LifeOsColors.TimeGold,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickJournalCtaCard(
    loggedToday: Boolean,
    onOpenJournal: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(
            width = 1.dp,
            color = if (loggedToday) {
                LifeOsColors.FinanceEmerald.copy(alpha = 0.4f)
            } else {
                LifeOsColors.MindPurple.copy(alpha = 0.5f)
            },
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onOpenJournal),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Rounded.EditNote,
                contentDescription = null,
                tint = if (loggedToday) LifeOsColors.FinanceEmerald else LifeOsColors.MindPurple,
                modifier = Modifier.size(22.dp),
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (loggedToday) "Journal Logged" else "Daily Reflection",
                    style = MaterialTheme.typography.titleSmall,
                    color = LifeOsColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = if (loggedToday) {
                        "Today's reflection recorded. Tap to append."
                    } else {
                        "What moved the needle today?"
                    },
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                    color = LifeOsColors.TextSecondary,
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                contentDescription = null,
                tint = LifeOsColors.TextTertiary,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    badge: String,
    accent: Color,
    onActionClick: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
            color = LifeOsColors.TextTertiary,
            letterSpacing = 1.4.sp,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .clickable(onClick = onActionClick)
                .padding(horizontal = 6.dp, vertical = 2.dp),
        ) {
            Text(
                text = badge,
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = accent,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                contentDescription = "Open",
                tint = accent,
                modifier = Modifier.size(13.dp),
            )
        }
    }
}

private fun formatDuration(totalSeconds: Long): String {
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        "%02d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%02d:%02d".format(minutes, seconds)
    }
}
