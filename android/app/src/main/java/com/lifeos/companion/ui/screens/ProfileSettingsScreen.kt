package com.lifeos.companion.ui.screens

import android.app.TimePickerDialog
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.notifications.EveningReminderPreferences
import com.lifeos.companion.notifications.EveningReminderReceiver
import com.lifeos.companion.notifications.EveningReminderScheduler
import com.lifeos.companion.ui.theme.LifeOsColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun ProfileSettingsScreen(
    userEmail: String?,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val pendingOutbox by OutboxManager.database().dao().observePendingCount().collectAsState(initial = 0)
    var config by remember { mutableStateOf(EveningReminderPreferences.load(context)) }

    fun updateConfig(next: com.lifeos.companion.notifications.EveningScheduleConfig) {
        config = next
        EveningReminderPreferences.save(context, next)
        EveningReminderScheduler.scheduleAll(context)
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
                    text = "PROFILE · SYSTEM SETTINGS",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.ProfileSlate,
                    letterSpacing = 1.6.sp,
                )
                Text(
                    text = "Companion Node",
                    style = MaterialTheme.typography.headlineSmall,
                    color = LifeOsColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        // Identity & Outbox Status
        item {
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
                        text = "IDENTITY & SYNC",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextTertiary,
                        letterSpacing = 1.2.sp,
                    )
                    Text(
                        text = userEmail ?: "Authenticated User",
                        style = MaterialTheme.typography.bodyMedium,
                        color = LifeOsColors.TextPrimary,
                    )
                    HorizontalDivider(color = LifeOsColors.BorderSubtle.copy(alpha = 0.6f), thickness = 0.5.dp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text(
                                text = "Hybrid Outbox Queue",
                                style = MaterialTheme.typography.bodySmall,
                                color = LifeOsColors.TextSecondary,
                            )
                            Text(
                                text = if (pendingOutbox == 0) "All changes synced" else "$pendingOutbox mutations pending",
                                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
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
                            Text("Sync", style = MaterialTheme.typography.labelSmall, color = LifeOsColors.TextPrimary)
                        }
                    }
                }
            }
        }

        // Evening Notification Schedule (IST)
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
                        text = "EVENING CHECK-INS (IST)",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextTertiary,
                        letterSpacing = 1.2.sp,
                    )

                    ScheduleRow(
                        title = "Today's Tasks Review",
                        timeLabel = "%02d:%02d IST".format(config.tasksHour, config.tasksMinute),
                        enabled = config.tasksEnabled,
                        accent = LifeOsColors.ProductivityBlue,
                        onToggle = { updateConfig(config.copy(tasksEnabled = it)) },
                        onPickTime = {
                            TimePickerDialog(
                                context,
                                { _, h, m -> updateConfig(config.copy(tasksHour = h, tasksMinute = m)) },
                                config.tasksHour,
                                config.tasksMinute,
                                true,
                            ).show()
                        },
                    )

                    HorizontalDivider(color = LifeOsColors.BorderSubtle.copy(alpha = 0.6f), thickness = 0.5.dp)

                    ScheduleRow(
                        title = "Daily Journal Closure",
                        timeLabel = "%02d:%02d IST".format(config.journalHour, config.journalMinute),
                        enabled = config.journalEnabled,
                        accent = LifeOsColors.MindPurple,
                        onToggle = { updateConfig(config.copy(journalEnabled = it)) },
                        onPickTime = {
                            TimePickerDialog(
                                context,
                                { _, h, m -> updateConfig(config.copy(journalHour = h, journalMinute = m)) },
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

        // Session Termination
        item {
            OutlinedButton(
                onClick = {
                    scope.launch { SupabaseClientProvider.auth.signOut() }
                },
                border = BorderStroke(1.dp, LifeOsColors.FieldReportsRose.copy(alpha = 0.65f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = LifeOsColors.FieldReportsRose),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
            ) {
                Text("Sign Out", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun ScheduleRow(
    title: String,
    timeLabel: String,
    enabled: Boolean,
    accent: androidx.compose.ui.graphics.Color,
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
