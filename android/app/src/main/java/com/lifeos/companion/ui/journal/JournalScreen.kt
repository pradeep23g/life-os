package com.lifeos.companion.ui.journal

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lifeos.companion.data.model.JournalEntryDto
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.util.IstClock
import java.time.Instant
import java.time.format.DateTimeFormatter

private val MOOD_LABELS = mapOf(
    1 to "Heavy",
    2 to "Low",
    3 to "Steady",
    4 to "Clear",
    5 to "Peak",
)

@Composable
fun JournalScreen(
    modifier: Modifier = Modifier,
    viewModel: JournalViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var mood by remember { mutableIntStateOf(3) }
    var whatWentGood by remember { mutableStateOf("") }
    var whatYouLearned by remember { mutableStateOf("") }
    var briefAboutDay by remember { mutableStateOf("") }

    val canSave = whatWentGood.isNotBlank() || whatYouLearned.isNotBlank() || briefAboutDay.isNotBlank()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(LifeOsColors.VoidBlack)
            .statusBarsPadding(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 104.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = "MIND OS · REFLECTION",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.MindPurple,
                        letterSpacing = 1.6.sp,
                    )
                    Text(
                        text = "Evening Ledger",
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

        // Structured 3-Prompt Composer
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
                        Text(
                            text = "MOOD STATE",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.TextTertiary,
                            letterSpacing = 1.2.sp,
                        )
                        Text(
                            text = "$mood/5 · ${MOOD_LABELS[mood] ?: ""}".uppercase(),
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = LifeOsColors.MindPurple,
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
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
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier.padding(vertical = 10.dp),
                                ) {
                                    Text(
                                        text = "$score",
                                        style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
                                        color = if (selected) LifeOsColors.MindPurple else LifeOsColors.TextSecondary,
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    )
                                }
                            }
                        }
                    }

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

                    OutlinedTextField(
                        value = briefAboutDay,
                        onValueChange = { briefAboutDay = it },
                        label = { Text("Brief about the day") },
                        textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Serif),
                        minLines = 2,
                        maxLines = 5,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    Button(
                        onClick = {
                            viewModel.saveEntry(mood, whatWentGood, whatYouLearned, briefAboutDay)
                            whatWentGood = ""
                            whatYouLearned = ""
                            briefAboutDay = ""
                            mood = 3
                        },
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
                }
            }
        }

        item {
            Text(
                text = "CHRONICLE",
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = LifeOsColors.TextTertiary,
                letterSpacing = 1.4.sp,
            )
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
                        text = "No journal entries recorded yet.",
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
                    text = "$dateLabel · MOOD ${entry.mood}/5",
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

            if (!entry.whatWentGood.isNullOrBlank()) {
                JournalFieldBlock(label = "WINS", body = entry.whatWentGood)
            }
            if (!entry.whatYouLearned.isNullOrBlank()) {
                JournalFieldBlock(label = "LEARNED", body = entry.whatYouLearned)
            }
            if (!entry.briefAboutDay.isNullOrBlank()) {
                JournalFieldBlock(label = "BRIEF", body = entry.briefAboutDay)
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
            color = LifeOsColors.TextPrimary,
        )
    }
}
