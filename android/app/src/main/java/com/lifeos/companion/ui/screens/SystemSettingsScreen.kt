package com.lifeos.companion.ui.screens

import android.app.TimePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.rounded.ArrowDropDown
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.RestartAlt
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.ColorUtils
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.data.repository.TimeBucketColorStore
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.notifications.EveningReminderPreferences
import com.lifeos.companion.notifications.EveningReminderReceiver
import com.lifeos.companion.notifications.EveningReminderScheduler
import com.lifeos.companion.notifications.EveningScheduleConfig
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.widgets.WidgetStateSync
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun SystemSettingsScreen(
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val pendingOutbox by OutboxManager.database().dao().observePendingCount().collectAsState(initial = 0)
    val bucketHexMap by TimeBucketColorStore.hexMap.collectAsState()
    var config by remember { mutableStateOf(EveningReminderPreferences.load(context)) }

    var selectedBucket by remember { mutableStateOf(TIME_BUCKETS[0]) }
    var bucketMenuExpanded by remember { mutableStateOf(false) }

    val activeHex = bucketHexMap[selectedBucket] ?: "#3B82F6"
    var hue by remember(selectedBucket, activeHex) {
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(TimeBucketColorStore.parseHexColor(activeHex).toArgb(), hsl)
        mutableFloatStateOf(hsl[0])
    }
    var saturation by remember(selectedBucket, activeHex) {
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(TimeBucketColorStore.parseHexColor(activeHex).toArgb(), hsl)
        mutableFloatStateOf(hsl[1])
    }
    var lightness by remember(selectedBucket, activeHex) {
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(TimeBucketColorStore.parseHexColor(activeHex).toArgb(), hsl)
        mutableFloatStateOf(hsl[2].coerceIn(0.18f, 0.82f))
    }
    var hexInput by remember(selectedBucket, activeHex) { mutableStateOf(activeHex) }
    var colorSaveStatus by remember { mutableStateOf<String?>(null) }
    var isSavingColor by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        TimeBucketColorStore.refreshFromRemote(context)
    }

    fun updateSlidersFromHex(hex: String) {
        if (!TimeBucketColorStore.isValidHex(hex)) return
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(TimeBucketColorStore.parseHexColor(hex).toArgb(), hsl)
        hue = hsl[0]
        saturation = hsl[1]
        lightness = hsl[2]
    }

    fun updateHexFromSliders() {
        val argb = ColorUtils.HSLToColor(floatArrayOf(hue, saturation, lightness))
        hexInput = String.format("#%06X", 0xFFFFFF and argb)
    }

    fun updateSchedule(next: EveningScheduleConfig) {
        config = next
        EveningReminderPreferences.save(context, next)
        EveningReminderScheduler.scheduleAll(context)
    }

    val previewColor = if (TimeBucketColorStore.isValidHex(hexInput)) {
        TimeBucketColorStore.parseHexColor(hexInput)
    } else {
        TimeBucketColorStore.parseHexColor(activeHex)
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(LifeOsColors.VoidBlack)
            .statusBarsPadding(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 104.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Column {
                Text(
                    text = "SYSTEM · CONTROL PLANE",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.HomeWhite,
                    letterSpacing = 1.6.sp,
                )
                Text(
                    text = "System Config",
                    style = MaterialTheme.typography.headlineSmall,
                    color = LifeOsColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        // 1. Time OS Bucket Colors (Synced Android <-> Web via user_settings)
        item {
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Palette,
                                contentDescription = null,
                                tint = previewColor,
                                modifier = Modifier.size(16.dp),
                            )
                            Text(
                                text = "TIME OS BUCKET COLORS",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                color = LifeOsColors.TextTertiary,
                                letterSpacing = 1.2.sp,
                            )
                        }

                        TextButton(
                            onClick = {
                                scope.launch {
                                    isSavingColor = true
                                    colorSaveStatus = null
                                    runCatching { TimeBucketColorStore.resetDefaults(context) }
                                        .onSuccess {
                                            WidgetStateSync.refreshAllFocusWidgetsAsync(context)
                                            colorSaveStatus = "Defaults synced"
                                        }
                                        .onFailure { colorSaveStatus = it.message }
                                    isSavingColor = false
                                }
                            },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        ) {
                            Icon(Icons.Rounded.RestartAlt, contentDescription = null, tint = LifeOsColors.TextSecondary, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Reset", style = MaterialTheme.typography.labelSmall, color = LifeOsColors.TextSecondary)
                        }
                    }

                    // Dropdown / Popup Menu for selecting which bucket to edit
                    Box {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = LifeOsColors.SurfaceElevated,
                            border = BorderStroke(1.dp, previewColor.copy(alpha = 0.55f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { bucketMenuExpanded = true },
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(14.dp)
                                            .clip(CircleShape)
                                            .background(TimeBucketColorStore.parseHexColor(activeHex)),
                                    )
                                    Text(
                                        text = selectedBucket,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = LifeOsColors.TextPrimary,
                                        fontWeight = FontWeight.Medium,
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = activeHex,
                                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                        color = LifeOsColors.TextSecondary,
                                    )
                                    Icon(
                                        imageVector = Icons.Rounded.ArrowDropDown,
                                        contentDescription = "Choose bucket",
                                        tint = LifeOsColors.TextSecondary,
                                    )
                                }
                            }
                        }

                        DropdownMenu(
                            expanded = bucketMenuExpanded,
                            onDismissRequest = { bucketMenuExpanded = false },
                            containerColor = LifeOsColors.SurfaceElevated,
                        ) {
                            TIME_BUCKETS.forEach { bucket ->
                                val hex = bucketHexMap[bucket] ?: "#3B82F6"
                                DropdownMenuItem(
                                    text = {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(12.dp)
                                                    .clip(CircleShape)
                                                    .background(TimeBucketColorStore.parseHexColor(hex)),
                                            )
                                            Text(bucket, color = LifeOsColors.TextPrimary)
                                            Spacer(modifier = Modifier.weight(1f))
                                            Text(
                                                text = hex,
                                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                                                color = LifeOsColors.TextTertiary,
                                            )
                                        }
                                    },
                                    onClick = {
                                        selectedBucket = bucket
                                        bucketMenuExpanded = false
                                        colorSaveStatus = null
                                    },
                                )
                            }
                        }
                    }

                    // Full Custom Input System (HSL Sliders + Direct Hex Input)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(28.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(previewColor)
                            .border(1.dp, LifeOsColors.BorderEmphasized, RoundedCornerShape(8.dp)),
                    )

                    ColorSliderRow(
                        label = "HUE",
                        valueText = "${hue.toInt()}°",
                        value = hue,
                        range = 0f..360f,
                        accent = previewColor,
                        onValueChange = {
                            hue = it
                            updateHexFromSliders()
                        },
                    )
                    ColorSliderRow(
                        label = "SAT",
                        valueText = "${(saturation * 100).toInt()}%",
                        value = saturation,
                        range = 0.1f..1f,
                        accent = previewColor,
                        onValueChange = {
                            saturation = it
                            updateHexFromSliders()
                        },
                    )
                    ColorSliderRow(
                        label = "LUM",
                        valueText = "${(lightness * 100).toInt()}%",
                        value = lightness,
                        range = 0.18f..0.82f,
                        accent = previewColor,
                        onValueChange = {
                            lightness = it
                            updateHexFromSliders()
                        },
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        OutlinedTextField(
                            value = hexInput,
                            onValueChange = { next ->
                                val clean = next.take(7).uppercase()
                                hexInput = clean
                                updateSlidersFromHex(clean)
                            },
                            label = { Text("Hex (#RRGGBB)") },
                            singleLine = true,
                            textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace),
                            modifier = Modifier.weight(1f),
                        )

                        Button(
                            onClick = {
                                scope.launch {
                                    isSavingColor = true
                                    colorSaveStatus = null
                                    runCatching {
                                        TimeBucketColorStore.saveBucketColor(context, selectedBucket, hexInput)
                                    }.onSuccess {
                                        WidgetStateSync.refreshAllFocusWidgetsAsync(context)
                                        colorSaveStatus = "$selectedBucket saved & synced to Web"
                                    }.onFailure { err ->
                                        colorSaveStatus = err.message ?: "Saved locally (cloud sync failed)"
                                    }
                                    isSavingColor = false
                                }
                            },
                            enabled = TimeBucketColorStore.isValidHex(hexInput) && !isSavingColor,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = previewColor,
                                contentColor = LifeOsColors.VoidBlack,
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.height(52.dp),
                        ) {
                            Text(if (isSavingColor) "..." else "Apply", fontWeight = FontWeight.Bold)
                        }
                    }

                    if (colorSaveStatus != null) {
                        Text(
                            text = colorSaveStatus!!,
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.FinanceEmerald,
                        )
                    }
                }
            }
        }

        // 2. Hybrid Outbox Sync
        item {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = LifeOsColors.SurfaceCard,
                border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "HYBRID OUTBOX SYNC",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextTertiary,
                            letterSpacing = 1.2.sp,
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (pendingOutbox == 0) "All mutations synced" else "$pendingOutbox queued mutations",
                            style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                            color = if (pendingOutbox == 0) LifeOsColors.FinanceEmerald else LifeOsColors.TimeGold,
                        )
                    }
                    OutlinedButton(
                        onClick = { OutboxManager.scheduleSyncNow() },
                        border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                        Icon(Icons.Rounded.Sync, contentDescription = null, tint = LifeOsColors.TextPrimary, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Sync Now", style = MaterialTheme.typography.labelSmall, color = LifeOsColors.TextPrimary)
                    }
                }
            }
        }

        // 3. Evening Notifications (IST)
        item {
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
                    Text(
                        text = "EVENING NOTIFICATIONS (IST)",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextTertiary,
                        letterSpacing = 1.2.sp,
                    )

                    SystemScheduleRow(
                        title = "Today's Tasks Check-in",
                        timeLabel = "%02d:%02d IST".format(config.tasksHour, config.tasksMinute),
                        enabled = config.tasksEnabled,
                        accent = LifeOsColors.ProductivityBlue,
                        onToggle = { updateSchedule(config.copy(tasksEnabled = it)) },
                        onPickTime = {
                            TimePickerDialog(
                                context,
                                { _, h, m -> updateSchedule(config.copy(tasksHour = h, tasksMinute = m)) },
                                config.tasksHour,
                                config.tasksMinute,
                                true,
                            ).show()
                        },
                    )

                    HorizontalDivider(color = LifeOsColors.BorderSubtle.copy(alpha = 0.6f), thickness = 0.5.dp)

                    SystemScheduleRow(
                        title = "Daily Journal Closure",
                        timeLabel = "%02d:%02d IST".format(config.journalHour, config.journalMinute),
                        enabled = config.journalEnabled,
                        accent = LifeOsColors.MindPurple,
                        onToggle = { updateSchedule(config.copy(journalEnabled = it)) },
                        onPickTime = {
                            TimePickerDialog(
                                context,
                                { _, h, m -> updateSchedule(config.copy(journalHour = h, journalMinute = m)) },
                                config.journalHour,
                                config.journalMinute,
                                true,
                            ).show()
                        },
                    )

                    HorizontalDivider(color = LifeOsColors.BorderSubtle.copy(alpha = 0.6f), thickness = 0.5.dp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedButton(
                            onClick = {
                                scope.launch(Dispatchers.IO) {
                                    EveningReminderReceiver.showTasksCheckIn(context)
                                }
                            },
                            border = BorderStroke(1.dp, LifeOsColors.ProductivityBlue.copy(alpha = 0.5f)),
                            modifier = Modifier.weight(1f),
                        ) {
                            Icon(Icons.Rounded.NotificationsActive, contentDescription = null, tint = LifeOsColors.ProductivityBlue, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Test Tasks", style = MaterialTheme.typography.labelSmall, color = LifeOsColors.ProductivityBlue)
                        }
                        OutlinedButton(
                            onClick = {
                                scope.launch(Dispatchers.IO) {
                                    EveningReminderReceiver.showJournalCheckIn(context)
                                }
                            },
                            border = BorderStroke(1.dp, LifeOsColors.MindPurple.copy(alpha = 0.5f)),
                            modifier = Modifier.weight(1f),
                        ) {
                            Icon(Icons.Rounded.NotificationsActive, contentDescription = null, tint = LifeOsColors.MindPurple, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Test Journal", style = MaterialTheme.typography.labelSmall, color = LifeOsColors.MindPurple)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ColorSliderRow(
    label: String,
    valueText: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    accent: Color,
    onValueChange: (Float) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
            color = LifeOsColors.TextTertiary,
            modifier = Modifier.width(34.dp),
        )
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = range,
            colors = SliderDefaults.colors(
                thumbColor = accent,
                activeTrackColor = accent,
                inactiveTrackColor = LifeOsColors.BorderSubtle,
            ),
            modifier = Modifier.weight(1f),
        )
        Text(
            text = valueText,
            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
            color = LifeOsColors.TextSecondary,
            modifier = Modifier.width(38.dp),
        )
    }
}

@Composable
private fun SystemScheduleRow(
    title: String,
    timeLabel: String,
    enabled: Boolean,
    accent: Color,
    onToggle: (Boolean) -> Unit,
    onPickTime: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .clickable(onClick = onPickTime),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = LifeOsColors.TextPrimary,
            )
            Text(
                text = "$timeLabel · Tap to change",
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = accent,
            )
        }
        Switch(
            checked = enabled,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(
                checkedThumbColor = LifeOsColors.VoidBlack,
                checkedTrackColor = accent,
            ),
        )
    }
}
