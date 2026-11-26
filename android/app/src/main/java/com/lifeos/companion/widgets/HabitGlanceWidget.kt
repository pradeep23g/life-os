package com.lifeos.companion.widgets

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.lifeos.companion.MainActivity
import com.lifeos.companion.data.local.CachedHabitEntity
import com.lifeos.companion.data.local.LifeOsDatabase
import com.lifeos.companion.data.model.HabitDto
import com.lifeos.companion.data.repository.HabitWithTodayStatus
import com.lifeos.companion.data.repository.HabitsRepository
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.util.IstClock

private val OledBlack = Color(0xFF000000)
private val OledCard = Color(0xFF0A0A0A)
private val OledBorder = Color(0xFF222222)
private val MindPurple = Color(0xFFA855F7)
private val TextPrimary = Color(0xFFF5F5F5)
private val TextMuted = Color(0xFF71717A)

private val KEY_HABIT_ID = ActionParameters.Key<String>("habit_id")

class HabitGlanceWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = HabitGlanceWidget()
}

class HabitGlanceWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        SupabaseClientProvider.init(context)
        OutboxManager.init(context)
        val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id
        val todayIst = IstClock.todayIstString()
        val habits = if (userId != null) {
            LifeOsDatabase.get(context).dao().getHabitsSnapshot(userId)
        } else {
            emptyList()
        }

        provideContent {
            HabitWidgetContent(
                context = context,
                habits = habits,
                todayIst = todayIst,
                isSignedIn = userId != null,
            )
        }
    }
}

@Composable
private fun HabitWidgetContent(
    context: Context,
    habits: List<CachedHabitEntity>,
    todayIst: String,
    isSignedIn: Boolean,
) {
    val openIntent = Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://habits"), context, MainActivity::class.java)
    val doneCount = habits.count { item ->
        val valToday = if (item.todayLogDate == todayIst) item.todayValue else 0
        if (item.habitType == "target") valToday >= item.targetValue else valToday >= 1
    }

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(OledBorder)
            .cornerRadius(16.dp)
            .padding(1.dp),
    ) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(OledBlack)
                .cornerRadius(15.dp)
                .padding(14.dp),
        ) {
            Row(
                modifier = GlanceModifier
                    .fillMaxWidth()
                    .clickable(actionStartActivity(openIntent)),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "MIND · HABITS",
                    style = TextStyle(
                        color = ColorProvider(MindPurple),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    ),
                    modifier = GlanceModifier.defaultWeight(),
                )
                Text(
                    text = "$doneCount/${habits.size}",
                    style = TextStyle(
                        color = ColorProvider(TextMuted),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
            }

            Spacer(modifier = GlanceModifier.height(8.dp))

            if (!isSignedIn || habits.isEmpty()) {
                Box(
                    modifier = GlanceModifier
                        .fillMaxSize()
                        .clickable(actionStartActivity(openIntent)),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    Text(
                        text = if (!isSignedIn) "Sign in to Life OS to sync habits" else "No active habits yet",
                        style = TextStyle(color = ColorProvider(TextMuted), fontSize = 12.sp),
                    )
                }
            } else {
                habits.take(4).forEach { habit ->
                    val currentVal = if (habit.todayLogDate == todayIst) habit.todayValue else 0
                    val isDone = if (habit.habitType == "target") currentVal >= habit.targetValue else currentVal >= 1
                    Row(
                        modifier = GlanceModifier
                            .fillMaxWidth()
                            .background(OledCard)
                            .cornerRadius(8.dp)
                            .clickable(
                                actionRunCallback<ToggleHabitWidgetAction>(
                                    actionParametersOf(KEY_HABIT_ID to habit.id),
                                ),
                            )
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = GlanceModifier
                                .size(12.dp)
                                .background(if (isDone) MindPurple else OledBorder)
                                .cornerRadius(6.dp),
                        ) {}
                        Spacer(modifier = GlanceModifier.width(8.dp))
                        Text(
                            text = habit.title,
                            maxLines = 1,
                            style = TextStyle(
                                color = ColorProvider(if (isDone) TextMuted else TextPrimary),
                                fontSize = 13.sp,
                            ),
                            modifier = GlanceModifier.defaultWeight(),
                        )
                        if (habit.habitType == "target") {
                            Text(
                                text = "$currentVal/${habit.targetValue}",
                                style = TextStyle(
                                    color = ColorProvider(if (isDone) MindPurple else TextMuted),
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                ),
                            )
                        }
                    }
                    Spacer(modifier = GlanceModifier.height(4.dp))
                }
            }
        }
    }
}

class ToggleHabitWidgetAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val habitId = parameters[KEY_HABIT_ID] ?: return
        SupabaseClientProvider.init(context)
        OutboxManager.init(context)
        val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id ?: return
        val todayIst = IstClock.todayIstString()
        val cached = LifeOsDatabase.get(context).dao().getHabitsSnapshot(userId)
            .firstOrNull { it.id == habitId } ?: return

        val todayVal = if (cached.todayLogDate == todayIst) cached.todayValue else 0
        val nextVal = if (cached.habitType == "target") {
            if (todayVal >= cached.targetValue) 0 else todayVal + 1
        } else {
            if (todayVal >= 1) 0 else 1
        }

        HabitsRepository().setTodayValue(
            HabitWithTodayStatus(
                habit = HabitDto(
                    id = cached.id,
                    userId = cached.userId,
                    title = cached.title,
                    habitType = cached.habitType,
                    targetValue = cached.targetValue,
                    unit = cached.unit,
                    createdAt = cached.createdAt,
                ),
                todayValue = todayVal,
            ),
            nextVal,
        )

        HabitGlanceWidget().update(context, glanceId)
    }
}
