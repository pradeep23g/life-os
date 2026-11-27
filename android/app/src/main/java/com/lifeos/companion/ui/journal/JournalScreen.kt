package com.lifeos.companion.ui.journal

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.JournalEntryDto
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.util.IstClock
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

private val MOOD_LABELS = mapOf(
    1 to "Heavy",
    2 to "Low",
    3 to "Steady",
    4 to "Clear",
    5 to "Peak",
)

private val WEEKDAY_HEADERS = listOf("S", "M", "T", "W", "T", "F", "S")

@Composable
fun JournalScreen(
    modifier: Modifier = Modifier,
    viewModel: JournalViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var showCalendar by remember { mutableStateOf(true) }
    var visibleMonth by remember { mutableStateOf(YearMonth.from(IstClock.todayIst())) }
    var selectedDateIst by remember { mutableStateOf<String?>(null) }
    var writeTargetDateIst by remember { mutableStateOf<String?>(null) }

    if (writeTargetDateIst != null) {
        WriteJournalSheet(
            targetDateIst = writeTargetDateIst!!,
            onDismiss = { writeTargetDateIst = null },
            onCommit = { mood, good, learned, brief ->
                viewModel.saveEntry(
                    mood = mood,
                    whatWentGood = good,
                    whatYouLearned = learned,
                    briefAboutDay = brief,
                    entryDateIst = writeTargetDateIst,
                )
                writeTargetDateIst = null
            },
        )
    }

    selectedDateIst?.let { dateKey ->
        DayEntriesDetailSheet(
            dateKey = dateKey,
            entries = state.entriesByDateIst[dateKey].orEmpty(),
            onDismiss = { selectedDateIst = null },
            onWriteForDate = {
                selectedDateIst = null
                writeTargetDateIst = dateKey
            },
            onDeleteEntry = { viewModel.deleteEntry(it) },
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
        // Editorial Header with Calendar toggle + Write Entry button
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "MIND OS · CHRONICLE",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.MindPurple,
                            letterSpacing = 1.6.sp,
                        )
                        Text(
                            text = "Evening Ledger",
                            style = MaterialTheme.typography.headlineSmall.copy(fontFamily = FontFamily.Serif),
                            color = LifeOsColors.TextPrimary,
                            fontWeight = FontWeight.Normal,
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        if (state.pendingOutboxCount > 0) {
                            Surface(
                                shape = CircleShape,
                                color = LifeOsColors.TimeGold.copy(alpha = 0.14f),
                                border = BorderStroke(1.dp, LifeOsColors.TimeGold.copy(alpha = 0.45f)),
                            ) {
                                Text(
                                    text = "${state.pendingOutboxCount} SYNC",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp,
                                    ),
                                    color = LifeOsColors.TimeGold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                )
                            }
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

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(
                        onClick = { showCalendar = !showCalendar },
                        border = BorderStroke(
                            1.dp,
                            if (showCalendar) LifeOsColors.MindPurple.copy(alpha = 0.6f) else LifeOsColors.BorderSubtle,
                        ),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.CalendarMonth,
                            contentDescription = null,
                            tint = if (showCalendar) LifeOsColors.MindPurple else LifeOsColors.TextSecondary,
                            modifier = Modifier.size(16.dp),
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (showCalendar) "Hide Ledger" else "Monthly Ledger",
                            style = MaterialTheme.typography.labelMedium,
                            color = if (showCalendar) LifeOsColors.MindPurple else LifeOsColors.TextSecondary,
                        )
                    }

                    Button(
                        onClick = { writeTargetDateIst = IstClock.todayIstString() },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = LifeOsColors.MindPurple,
                            contentColor = LifeOsColors.VoidBlack,
                        ),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Rounded.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Write Entry", fontWeight = FontWeight.SemiBold)
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

        // Month Horizon Calendar (matching Web JournalPage Month Navigator)
        item {
            AnimatedVisibility(visible = showCalendar) {
                MonthHorizonCalendarCard(
                    month = visibleMonth,
                    entriesByDate = state.entriesByDateIst,
                    onPrevMonth = { visibleMonth = visibleMonth.minusMonths(1) },
                    onNextMonth = { visibleMonth = visibleMonth.plusMonths(1) },
                    onDayClick = { dateKey -> selectedDateIst = dateKey },
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "ARCHIVED REFLECTIONS (${state.entries.size})",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                    letterSpacing = 1.4.sp,
                )
                Text(
                    text = "IST",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextTertiary,
                )
            }
        }

        if (state.entries.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = LifeOsColors.SurfaceCard,
                    border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "The archive is currently unwritten. Tap Write Entry to record a reflection.",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontFamily = FontFamily.Serif,
                            fontStyle = FontStyle.Italic,
                        ),
                        color = LifeOsColors.TextTertiary,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
        } else {
            items(state.entries, key = { it.id }) { entry ->
                JournalHistoryCard(
                    entry = entry,
                    onDelete = { viewModel.deleteEntry(entry.id) },
                )
            }
        }
    }
}

@Composable
private fun MonthHorizonCalendarCard(
    month: YearMonth,
    entriesByDate: Map<String, List<JournalEntryDto>>,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onDayClick: (String) -> Unit,
) {
    val today = remember { IstClock.todayIst() }
    val monthTitle = remember(month) {
        month.format(DateTimeFormatter.ofPattern("MMMM yyyy")).uppercase()
    }
    val gridDays = remember(month) { buildMonthGrid(month) }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "MONTH HORIZON · $monthTitle",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextSecondary,
                    letterSpacing = 1.2.sp,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onPrevMonth, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.KeyboardArrowLeft,
                            contentDescription = "Previous month",
                            tint = LifeOsColors.TextSecondary,
                        )
                    }
                    IconButton(onClick = onNextMonth, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.KeyboardArrowRight,
                            contentDescription = "Next month",
                            tint = LifeOsColors.TextSecondary,
                        )
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth()) {
                WEEKDAY_HEADERS.forEach { dayLetter ->
                    Text(
                        text = dayLetter,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                        ),
                        color = LifeOsColors.TextTertiary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            gridDays.chunked(7).forEach { week ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    week.forEach { date ->
                        if (date == null) {
                            Spacer(modifier = Modifier.weight(1f).aspectRatio(1f))
                        } else {
                            val dateKey = date.toString()
                            val dayEntries = entriesByDate[dateKey].orEmpty()
                            val hasEntry = dayEntries.isNotEmpty()
                            val isToday = date == today

                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = when {
                                    hasEntry -> LifeOsColors.MindPurple.copy(alpha = 0.16f)
                                    isToday -> LifeOsColors.SurfaceElevated
                                    else -> LifeOsColors.VoidBlack
                                },
                                border = BorderStroke(
                                    width = if (isToday || hasEntry) 1.dp else 0.5.dp,
                                    color = when {
                                        hasEntry -> LifeOsColors.MindPurple.copy(alpha = 0.7f)
                                        isToday -> LifeOsColors.TextSecondary
                                        else -> LifeOsColors.BorderSubtle
                                    },
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .aspectRatio(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .clickable { onDayClick(dateKey) },
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxSize(),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                ) {
                                    Text(
                                        text = "${date.dayOfMonth}",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 11.sp,
                                        ),
                                        color = if (hasEntry) LifeOsColors.MindPurple else LifeOsColors.TextPrimary,
                                        fontWeight = if (hasEntry || isToday) FontWeight.Bold else FontWeight.Normal,
                                    )
                                    if (hasEntry) {
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Box(
                                            modifier = Modifier
                                                .size(4.dp)
                                                .clip(CircleShape)
                                                .background(LifeOsColors.MindPurple),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DayEntriesDetailSheet(
    dateKey: String,
    entries: List<JournalEntryDto>,
    onDismiss: () -> Unit,
    onWriteForDate: () -> Unit,
    onDeleteEntry: (String) -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = LifeOsColors.SurfaceCard,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = "CHRONICLE DATE · $dateKey",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.MindPurple,
                        letterSpacing = 1.2.sp,
                    )
                    Text(
                        text = if (entries.isEmpty()) "No entries logged" else "${entries.size} reflection(s)",
                        style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Serif),
                        color = LifeOsColors.TextPrimary,
                    )
                }
                Button(
                    onClick = onWriteForDate,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = LifeOsColors.MindPurple,
                        contentColor = LifeOsColors.VoidBlack,
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                ) {
                    Icon(Icons.Rounded.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Write", fontWeight = FontWeight.SemiBold)
                }
            }

            HorizontalDivider(color = LifeOsColors.BorderSubtle)

            if (entries.isEmpty()) {
                Text(
                    text = "Nothing recorded on $dateKey yet. Tap Write to add a reflection for this day.",
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                    color = LifeOsColors.TextSecondary,
                    modifier = Modifier.padding(vertical = 8.dp),
                )
            } else {
                entries.forEach { entry ->
                    JournalHistoryCard(
                        entry = entry,
                        onDelete = { onDeleteEntry(entry.id) },
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WriteJournalSheet(
    targetDateIst: String,
    onDismiss: () -> Unit,
    onCommit: (mood: Int, good: String, learned: String, brief: String) -> Unit,
) {
    var mood by remember { mutableIntStateOf(3) }
    var briefAboutDay by remember { mutableStateOf("") }
    var whatWentGood by remember { mutableStateOf("") }
    var whatYouLearned by remember { mutableStateOf("") }
    val canSave = briefAboutDay.isNotBlank() || whatWentGood.isNotBlank() || whatYouLearned.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = LifeOsColors.SurfaceCard,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "NEW REFLECTION · $targetDateIst",
                    style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.MindPurple,
                    letterSpacing = 1.3.sp,
                )
                Text(
                    text = "0$mood ${MOOD_LABELS[mood] ?: ""}".uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.TextSecondary,
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                (1..5).forEach { score ->
                    val selected = mood == score
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (selected) LifeOsColors.MindPurple.copy(alpha = 0.22f) else LifeOsColors.SurfaceElevated,
                        border = BorderStroke(
                            1.dp,
                            if (selected) LifeOsColors.MindPurple else LifeOsColors.BorderSubtle,
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { mood = score },
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(vertical = 8.dp),
                        ) {
                            Text(
                                text = "0$score",
                                style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                                color = if (selected) LifeOsColors.MindPurple else LifeOsColors.TextPrimary,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                text = MOOD_LABELS[score] ?: "",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = LifeOsColors.TextSecondary,
                            )
                        }
                    }
                }
            }

            OutlinedTextField(
                value = briefAboutDay,
                onValueChange = { briefAboutDay = it },
                label = { Text("Brief about the day") },
                textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Serif),
                minLines = 2,
                maxLines = 5,
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = whatWentGood,
                onValueChange = { whatWentGood = it },
                label = { Text("What went well") },
                textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Serif),
                minLines = 2,
                maxLines = 4,
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = whatYouLearned,
                onValueChange = { whatYouLearned = it },
                label = { Text("What you learned") },
                textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Serif),
                minLines = 2,
                maxLines = 4,
                modifier = Modifier.fillMaxWidth(),
            )

            Button(
                onClick = { onCommit(mood, whatWentGood, whatYouLearned, briefAboutDay) },
                enabled = canSave,
                colors = ButtonDefaults.buttonColors(
                    containerColor = LifeOsColors.MindPurple,
                    contentColor = LifeOsColors.VoidBlack,
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Text("Commit Reflection", fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun JournalHistoryCard(
    entry: JournalEntryDto,
    onDelete: () -> Unit,
) {
    val dateLabel = remember(entry.createdAt) {
        runCatching {
            Instant.parse(entry.createdAt)
                .atZone(IstClock.ZONE_IST)
                .format(DateTimeFormatter.ofPattern("EEE, dd MMM · HH:mm"))
        }.getOrDefault(entry.createdAt.take(10))
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "$dateLabel · ${MOOD_LABELS[entry.mood] ?: ""} [0${entry.mood}]",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.MindPurple,
                )
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(
                        imageVector = Icons.Rounded.DeleteOutline,
                        contentDescription = "Delete entry",
                        tint = LifeOsColors.TextTertiary,
                        modifier = Modifier.size(16.dp),
                    )
                }
            }

            if (!entry.briefAboutDay.isNullOrBlank()) {
                Text(
                    text = "\u201C${entry.briefAboutDay}\u201D",
                    style = MaterialTheme.typography.bodyLarge.copy(fontFamily = FontFamily.Serif),
                    color = LifeOsColors.TextPrimary,
                )
            }
            if (!entry.whatWentGood.isNullOrBlank()) {
                JournalFieldBlock(label = "CLARITY", body = entry.whatWentGood)
            }
            if (!entry.whatYouLearned.isNullOrBlank()) {
                JournalFieldBlock(label = "DISTILLED", body = entry.whatYouLearned)
            }
        }
    }
}

@Composable
private fun JournalFieldBlock(label: String, body: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace, fontSize = 10.sp),
            color = LifeOsColors.TextTertiary,
        )
        Text(
            text = body,
            style = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Serif),
            color = LifeOsColors.TextSecondary,
        )
    }
}

private fun buildMonthGrid(month: YearMonth): List<LocalDate?> {
    val firstDay = month.atDay(1)
    val leadingBlanks = firstDay.dayOfWeek.value % 7 // Sunday = 0 .. Saturday = 6
    val totalDays = month.lengthOfMonth()
    val cells = mutableListOf<LocalDate?>()
    repeat(leadingBlanks) { cells.add(null) }
    for (d in 1..totalDays) {
        cells.add(month.atDay(d))
    }
    while (cells.size % 7 != 0) {
        cells.add(null)
    }
    return cells
}
