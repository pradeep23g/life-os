package com.lifeos.companion.ui.habits

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Healing
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.HabitStreakBreakDto
import com.lifeos.companion.data.repository.HabitWithTodayStatus
import com.lifeos.companion.ui.theme.LifeOsColors

@Composable
fun HabitsScreen(
    modifier: Modifier = Modifier,
    viewModel: HabitsViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var showCreateSheet by remember { mutableStateOf(false) }
    var breakToHeal by remember { mutableStateOf<HabitStreakBreakDto?>(null) }

    if (showCreateSheet) {
        CreateHabitSheet(
            onDismiss = { showCreateSheet = false },
            onCreate = { title, type, target, unit ->
                viewModel.createHabit(title, type, target, unit)
                showCreateSheet = false
            },
        )
    }

    breakToHeal?.let { item ->
        var reason by remember(item.id) { mutableStateOf("") }
        val habitTitle = state.habits.firstOrNull { it.habit.id == item.habitId }?.habit?.title ?: "Habit"
        AlertDialog(
            onDismissRequest = { breakToHeal = null },
            containerColor = LifeOsColors.SurfaceElevated,
            title = {
                Text(
                    text = "Heal Streak Break",
                    style = MaterialTheme.typography.titleMedium,
                    color = LifeOsColors.TextPrimary,
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "$habitTitle · ${item.breakDate}\n${state.healSummary.healsRemaining} of 5 monthly heals remaining.",
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextSecondary,
                    )
                    OutlinedTextField(
                        value = reason,
                        onValueChange = { reason = it },
                        label = { Text("Reason (optional)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.healBreak(item, reason)
                        breakToHeal = null
                    },
                    enabled = state.healSummary.healsRemaining > 0 && !state.isHealing,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = LifeOsColors.MindPurple,
                        contentColor = LifeOsColors.VoidBlack,
                    ),
                ) {
                    Text("Use 1 Heal")
                }
            },
            dismissButton = {
                TextButton(onClick = { breakToHeal = null }) {
                    Text("Cancel", color = LifeOsColors.TextSecondary)
                }
            },
        )
    }

    val doneCount = state.habits.count { it.isDone }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(LifeOsColors.VoidBlack)
            .statusBarsPadding(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 104.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = "MIND OS · $doneCount/${state.habits.size} COMPLETE",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.MindPurple,
                        letterSpacing = 1.6.sp,
                    )
                    Text(
                        text = "Habit Rhythm",
                        style = MaterialTheme.typography.headlineSmall,
                        color = LifeOsColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (state.pendingOutboxCount > 0) {
                        Surface(
                            shape = CircleShape,
                            color = LifeOsColors.TimeGold.copy(alpha = 0.14f),
                            border = BorderStroke(1.dp, LifeOsColors.TimeGold.copy(alpha = 0.45f)),
                        ) {
                            Text(
                                text = "${state.pendingOutboxCount} SYNC",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace, fontSize = 10.sp),
                                color = LifeOsColors.TimeGold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            )
                        }
                    }
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            imageVector = Icons.Rounded.Refresh,
                            contentDescription = "Refresh",
                            tint = LifeOsColors.TextTertiary,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                    Button(
                        onClick = { showCreateSheet = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = LifeOsColors.MindPurple,
                            contentColor = LifeOsColors.VoidBlack,
                        ),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("New", fontWeight = FontWeight.SemiBold)
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

        // Unhealed Streak Breaks Card (if any)
        if (state.healSummary.unhealedBreaks.isNotEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = LifeOsColors.SurfaceCard,
                    border = BorderStroke(1.dp, LifeOsColors.TimeGold.copy(alpha = 0.5f)),
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
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(Icons.Rounded.Healing, contentDescription = null, tint = LifeOsColors.TimeGold, modifier = Modifier.size(16.dp))
                                Text(
                                    text = "UNHEALED STREAK BREAKS",
                                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                    color = LifeOsColors.TimeGold,
                                    letterSpacing = 1.2.sp,
                                )
                            }
                            Text(
                                text = "${state.healSummary.healsRemaining}/5 HEALS",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                color = LifeOsColors.TextSecondary,
                            )
                        }
                        state.healSummary.unhealedBreaks.take(3).forEach { brk ->
                            val habitTitle = state.habits.firstOrNull { it.habit.id == brk.habitId }?.habit?.title ?: "Habit"
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable { breakToHeal = brk }
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = "$habitTitle · ${brk.breakDate}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = LifeOsColors.TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f),
                                )
                                Text(
                                    text = "HEAL",
                                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                    color = LifeOsColors.MindPurple,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                    }
                }
            }
        }

        if (state.habits.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = LifeOsColors.SurfaceCard,
                    border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "No habits yet. Tap New to establish a daily discipline.",
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextTertiary,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
        } else {
            items(state.habits, key = { it.habit.id }) { item ->
                HabitRowCard(
                    item = item,
                    onToggleBinary = { viewModel.toggleBinary(item) },
                    onAdjustTarget = { delta -> viewModel.adjustTarget(item, delta) },
                    onDelete = { viewModel.deleteHabit(item.habit.id) },
                )
            }
        }
    }
}

@Composable
private fun HabitRowCard(
    item: HabitWithTodayStatus,
    onToggleBinary: () -> Unit,
    onAdjustTarget: (Int) -> Unit,
    onDelete: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(
            1.dp,
            if (item.isDone) LifeOsColors.MindPurple.copy(alpha = 0.55f) else LifeOsColors.BorderSubtle,
        ),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier
                .clickable(enabled = item.habit.habitType == "binary", onClick = onToggleBinary)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (item.habit.habitType == "binary") {
                Icon(
                    imageVector = if (item.isDone) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = if (item.isDone) LifeOsColors.MindPurple else LifeOsColors.TextTertiary,
                    modifier = Modifier.size(22.dp),
                )
                Spacer(modifier = Modifier.width(12.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.habit.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = LifeOsColors.TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (item.habit.habitType == "target") {
                    val unitSuffix = item.habit.unit?.let { " $it" } ?: ""
                    Text(
                        text = "${item.todayValue} / ${item.habit.targetValue}$unitSuffix",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = if (item.isDone) LifeOsColors.MindPurple else LifeOsColors.TextSecondary,
                    )
                }
            }

            if (item.habit.habitType == "target") {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = { onAdjustTarget(-1) }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Rounded.Remove, contentDescription = "Decrease", tint = LifeOsColors.TextSecondary, modifier = Modifier.size(16.dp))
                    }
                    IconButton(onClick = { onAdjustTarget(1) }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Rounded.Add, contentDescription = "Increase", tint = LifeOsColors.MindPurple, modifier = Modifier.size(16.dp))
                    }
                }
            }

            IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                Icon(
                    imageVector = Icons.Rounded.DeleteOutline,
                    contentDescription = "Delete habit",
                    tint = LifeOsColors.TextTertiary,
                    modifier = Modifier.size(17.dp),
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateHabitSheet(
    onDismiss: () -> Unit,
    onCreate: (title: String, habitType: String, targetValue: Int, unit: String?) -> Unit,
) {
    var title by remember { mutableStateOf("") }
    var habitType by remember { mutableStateOf("binary") }
    var targetText by remember { mutableStateOf("2") }
    var unitText by remember { mutableStateOf("") }

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
                text = "NEW DAILY HABIT",
                style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.MindPurple,
                letterSpacing = 1.4.sp,
            )

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Habit title") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("binary" to "Binary (Check)", "target" to "Target (Count)").forEach { (type, label) ->
                    val selected = habitType == type
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (selected) LifeOsColors.MindPurple.copy(alpha = 0.18f) else LifeOsColors.SurfaceElevated,
                        border = BorderStroke(1.dp, if (selected) LifeOsColors.MindPurple else LifeOsColors.BorderSubtle),
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { habitType = type },
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = if (selected) LifeOsColors.MindPurple else LifeOsColors.TextSecondary,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        )
                    }
                }
            }

            if (habitType == "target") {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = targetText,
                        onValueChange = { targetText = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Target") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        value = unitText,
                        onValueChange = { unitText = it },
                        label = { Text("Unit (e.g. L, pages)") },
                        singleLine = true,
                        modifier = Modifier.weight(1.4f),
                    )
                }
            }

            Button(
                onClick = {
                    val target = targetText.toIntOrNull()?.coerceAtLeast(1) ?: 1
                    onCreate(title, habitType, target, unitText)
                },
                enabled = title.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = LifeOsColors.MindPurple,
                    contentColor = LifeOsColors.VoidBlack,
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Text("Create Habit", fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
