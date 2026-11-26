package com.lifeos.companion.ui.tasks

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.util.IstClock
import java.time.Instant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    onFocusOnTask: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TasksViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var showCreateSheet by remember { mutableStateOf(false) }

    if (showCreateSheet) {
        CreateTaskSheet(
            onDismiss = { showCreateSheet = false },
            onCreate = { title, type, date ->
                viewModel.createTask(title, type, date)
                showCreateSheet = false
            },
        )
    }

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
                        text = "PRODUCTIVITY HUB",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.ProductivityBlue,
                        letterSpacing = 1.6.sp,
                    )
                    Text(
                        text = "Execution Ledger",
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
                            containerColor = LifeOsColors.ProductivityBlue,
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

        // Filter bar
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TaskFilter.entries.forEach { filter ->
                    val selected = state.filter == filter
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (selected) LifeOsColors.ProductivityBlue.copy(alpha = 0.16f) else LifeOsColors.SurfaceCard,
                        border = BorderStroke(
                            1.dp,
                            if (selected) LifeOsColors.ProductivityBlue else LifeOsColors.BorderSubtle,
                        ),
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { viewModel.setFilter(filter) },
                    ) {
                        Text(
                            text = filter.label,
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = if (selected) LifeOsColors.ProductivityBlue else LifeOsColors.TextSecondary,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
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

        if (state.tasks.isEmpty()) {
            item {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = LifeOsColors.SurfaceCard,
                    border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "No tasks in ${state.filter.label}.",
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextTertiary,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
        } else {
            items(state.tasks, key = { it.id }) { task ->
                TaskRowCard(
                    task = task,
                    onToggle = { viewModel.toggleTask(task) },
                    onFocus = { onFocusOnTask(task.id) },
                    onDelete = { viewModel.deleteTask(task.id) },
                )
            }
        }
    }
}

@Composable
private fun TaskRowCard(
    task: TaskDto,
    onToggle: () -> Unit,
    onFocus: () -> Unit,
    onDelete: () -> Unit,
) {
    val todayIst = remember { IstClock.todayIstString() }
    val isOverdue = !task.isCompleted &&
        task.deadlineType == "specific_date" &&
        task.deadlineDate != null &&
        task.deadlineDate < todayIst
    val isToday = !task.isCompleted && (task.deadlineType == "same_day" || task.deadlineDate == todayIst)

    Surface(
        shape = RoundedCornerShape(10.dp),
        color = LifeOsColors.SurfaceCard,
        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier
                .clickable(onClick = onToggle)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = if (task.isCompleted) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                contentDescription = "Toggle task",
                tint = when {
                    task.isCompleted -> LifeOsColors.FinanceEmerald
                    isOverdue -> LifeOsColors.FieldReportsRose
                    else -> LifeOsColors.ProductivityBlue
                },
                modifier = Modifier.size(22.dp),
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (task.isCompleted) LifeOsColors.TextTertiary else LifeOsColors.TextPrimary,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                val meta = when {
                    isOverdue -> "OVERDUE · ${task.deadlineDate}"
                    isToday -> "TODAY"
                    task.deadlineType == "specific_date" && task.deadlineDate != null -> task.deadlineDate
                    else -> null
                }
                if (meta != null) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = meta,
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = when {
                            isOverdue -> LifeOsColors.FieldReportsRose
                            isToday -> LifeOsColors.TimeGold
                            else -> LifeOsColors.TextTertiary
                        },
                    )
                }
            }
            if (!task.isCompleted) {
                IconButton(onClick = onFocus, modifier = Modifier.size(34.dp)) {
                    Icon(
                        imageVector = Icons.Rounded.PlayArrow,
                        contentDescription = "Focus on task",
                        tint = LifeOsColors.TimeGold,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) {
                Icon(
                    imageVector = Icons.Rounded.DeleteOutline,
                    contentDescription = "Delete task",
                    tint = LifeOsColors.TextTertiary,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateTaskSheet(
    onDismiss: () -> Unit,
    onCreate: (title: String, deadlineType: String, deadlineDate: String?) -> Unit,
) {
    var title by remember { mutableStateOf("") }
    var deadlineType by remember { mutableStateOf("same_day") }
    var specificDate by remember { mutableStateOf(IstClock.todayIstString()) }
    var showDatePicker by remember { mutableStateOf(false) }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            specificDate = IstClock.toIstDateString(Instant.ofEpochMilli(millis))
                        }
                        showDatePicker = false
                    },
                ) {
                    Text("Set Date", color = LifeOsColors.ProductivityBlue)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel", color = LifeOsColors.TextSecondary)
                }
            },
        ) {
            DatePicker(state = datePickerState)
        }
    }

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
                text = "NEW EXECUTION TASK",
                style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.ProductivityBlue,
                letterSpacing = 1.4.sp,
            )

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Task title") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    "same_day" to "Today",
                    "specific_date" to "Date",
                    "no_deadline" to "Backlog",
                ).forEach { (type, label) ->
                    val selected = deadlineType == type
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (selected) LifeOsColors.ProductivityBlue.copy(alpha = 0.18f) else LifeOsColors.SurfaceElevated,
                        border = BorderStroke(
                            1.dp,
                            if (selected) LifeOsColors.ProductivityBlue else LifeOsColors.BorderSubtle,
                        ),
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { deadlineType = type },
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = if (selected) LifeOsColors.ProductivityBlue else LifeOsColors.TextSecondary,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        )
                    }
                }
            }

            if (deadlineType == "specific_date") {
                OutlinedButton(
                    onClick = { showDatePicker = true },
                    border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = "Due: $specificDate",
                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextPrimary,
                    )
                }
            }

            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onCreate(title, deadlineType, if (deadlineType == "specific_date") specificDate else null)
                    }
                },
                enabled = title.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = LifeOsColors.ProductivityBlue,
                    contentColor = LifeOsColors.VoidBlack,
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Text("Add Task", fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
