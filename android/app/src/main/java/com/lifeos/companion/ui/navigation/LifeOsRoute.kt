package com.lifeos.companion.ui.navigation

import androidx.compose.ui.graphics.Color
import com.lifeos.companion.ui.theme.LifeOsColors

enum class LifeOsRoute(
    val route: String,
    val label: String,
    val shortLabel: String,
    val accent: Color,
    val isV1Ready: Boolean,
) {
    HOME("home", "Home", "Home", LifeOsColors.HomeWhite, true),
    FOCUS("focus", "Time OS", "Time OS", LifeOsColors.TimeGold, true),
    TASKS("tasks", "Productivity", "Tasks", LifeOsColors.ProductivityBlue, true),
    HABITS("habits", "Habits", "Habits", LifeOsColors.MindPurple, true),
    JOURNAL("journal", "Journal", "Journal", LifeOsColors.MindPurple, true),
    WINTER_ARC("arc", "Winter Arc", "Arc", LifeOsColors.WinterArcCyan, false),
    FITNESS("fitness", "Fitness OS", "Body", LifeOsColors.FitnessRed, false),
    LEARNING("learning", "Learning OS", "Learn", LifeOsColors.LearningAmber, false),
    FINANCE("finance", "Finance OS", "Spend", LifeOsColors.FinanceEmerald, false),
    REPORTS("reports", "Field Reports", "Report", LifeOsColors.FieldReportsRose, false),
    SYSTEM("system", "System", "System", LifeOsColors.HomeWhite, true),
    PROFILE("profile", "Profile", "Profile", LifeOsColors.ProfileSlate, false),
}
