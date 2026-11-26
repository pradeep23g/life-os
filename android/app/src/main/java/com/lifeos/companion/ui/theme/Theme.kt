package com.lifeos.companion.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.lifeos.companion.util.IstClock
import java.time.ZonedDateTime

object LifeOsColors {
    // True-Black OLED Palette (UI_SYSTEM.md & WINTER_ARC_DESIGN_SYSTEM.md)
    val VoidBlack = Color(0xFF000000)
    val SurfaceCard = Color(0xFF0A0A0A)
    val SurfaceElevated = Color(0xFF141414)
    val BorderSubtle = Color(0xFF222222)
    val BorderEmphasized = Color(0xFF333333)

    val TextPrimary = Color(0xFFF5F5F5)
    val TextSecondary = Color(0xFFA1A1AA)
    val TextTertiary = Color(0xFF71717A)

    // Module Signature Accents (UI_SYSTEM.md Section 4)
    val HomeWhite = Color(0xFFFFFFFF)
    val WinterArcCyan = Color(0xFF22D3EE)
    val ProfileSlate = Color(0xFFE2E8F0)
    val FieldReportsRose = Color(0xFFF43F5E)
    val MindPurple = Color(0xFFA855F7)
    val ProductivityBlue = Color(0xFF3B82F6)
    val LearningAmber = Color(0xFFEAB308)
    val FitnessRed = Color(0xFFEF4444)
    val TimeGold = Color(0xFFF59E0B)
    val FinanceEmerald = Color(0xFF10B981)
}

enum class CircadianMode(
    val label: String,
    val accent: Color,
    val prompt: String,
) {
    DAWN("DAWN", Color(0xFFF59E0B), "Set today's non-negotiable intention."),
    DAY("DAY", Color(0xFF3B82F6), "Protect deep focus. Execute in order."),
    DUSK("DUSK", Color(0xFFA855F7), "Wind down execution. Audit today's signal."),
    MIDNIGHT("MIDNIGHT", Color(0xFF22D3EE), "Quiet closure. Log reflection before rest.");

    companion object {
        fun currentIst(): CircadianMode {
            return when (ZonedDateTime.now(IstClock.ZONE_IST).hour) {
                in 5..7 -> DAWN
                in 8..16 -> DAY
                in 17..20 -> DUSK
                else -> MIDNIGHT
            }
        }
    }
}

private val LifeOsOledScheme = darkColorScheme(
    primary = LifeOsColors.TimeGold,
    onPrimary = LifeOsColors.VoidBlack,
    secondary = LifeOsColors.ProductivityBlue,
    onSecondary = LifeOsColors.VoidBlack,
    tertiary = LifeOsColors.MindPurple,
    background = LifeOsColors.VoidBlack,
    onBackground = LifeOsColors.TextPrimary,
    surface = LifeOsColors.SurfaceCard,
    onSurface = LifeOsColors.TextPrimary,
    surfaceVariant = LifeOsColors.SurfaceElevated,
    onSurfaceVariant = LifeOsColors.TextSecondary,
    outline = LifeOsColors.BorderSubtle,
    error = LifeOsColors.FieldReportsRose,
)

@Composable
fun LifeOsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LifeOsOledScheme,
        content = content,
    )
}
