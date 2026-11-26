package com.lifeos.companion.ui.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.MenuBook
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.AcUnit
import androidx.compose.material.icons.rounded.CheckCircleOutline
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Hub
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.SelfImprovement
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.companion.ui.theme.LifeOsColors
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

enum class AstrolabeState {
    COLLAPSED_PILL,
    POPPED_ORB,
    EXPANDED_OVERLAY,
}

private val ORBIT_1_NODES = listOf(
    LifeOsRoute.FOCUS,
    LifeOsRoute.TASKS,
    LifeOsRoute.HABITS,
    LifeOsRoute.JOURNAL,
    LifeOsRoute.WINTER_ARC,
    LifeOsRoute.FITNESS,
)

private val ORBIT_2_NODES = listOf(
    LifeOsRoute.LEARNING,
    LifeOsRoute.FINANCE,
    LifeOsRoute.REPORTS,
    LifeOsRoute.SYSTEM,
    LifeOsRoute.PROFILE,
)

fun routeIcon(route: LifeOsRoute): ImageVector = when (route) {
    LifeOsRoute.HOME -> Icons.Rounded.Home
    LifeOsRoute.FOCUS -> Icons.Rounded.Timer
    LifeOsRoute.TASKS -> Icons.Rounded.CheckCircleOutline
    LifeOsRoute.HABITS -> Icons.Rounded.SelfImprovement
    LifeOsRoute.JOURNAL -> Icons.Rounded.EditNote
    LifeOsRoute.WINTER_ARC -> Icons.Rounded.AcUnit
    LifeOsRoute.FITNESS -> Icons.Rounded.FitnessCenter
    LifeOsRoute.LEARNING -> Icons.AutoMirrored.Rounded.MenuBook
    LifeOsRoute.FINANCE -> Icons.Rounded.AccountBalanceWallet
    LifeOsRoute.REPORTS -> Icons.Rounded.Description
    LifeOsRoute.SYSTEM -> Icons.Rounded.Hub
    LifeOsRoute.PROFILE -> Icons.Rounded.Person
}

@Composable
fun rememberAstrolabeScrollConnection(
    astrolabeState: AstrolabeState,
    onStateChange: (AstrolabeState) -> Unit,
): NestedScrollConnection = remember(astrolabeState, onStateChange) {
    object : NestedScrollConnection {
        override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
            if (astrolabeState == AstrolabeState.EXPANDED_OVERLAY) return Offset.Zero
            if (available.y < -12f && astrolabeState == AstrolabeState.POPPED_ORB) {
                onStateChange(AstrolabeState.COLLAPSED_PILL)
            } else if (available.y > 12f && astrolabeState == AstrolabeState.COLLAPSED_PILL) {
                onStateChange(AstrolabeState.POPPED_ORB)
            }
            return Offset.Zero
        }
    }
}

@Composable
fun AstrolabeNavigationDock(
    currentRoute: LifeOsRoute,
    state: AstrolabeState,
    onStateChange: (AstrolabeState) -> Unit,
    onNavigate: (LifeOsRoute) -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val isExpanded = state == AstrolabeState.EXPANDED_OVERLAY
    val isCollapsed = state == AstrolabeState.COLLAPSED_PILL

    if (isExpanded) {
        BackHandler { onStateChange(AstrolabeState.POPPED_ORB) }
    }

    // Fluid Pill <-> Orb continuous morph animations (no swap/swipe cut)
    val morphSpring = spring<androidx.compose.ui.unit.Dp>(
        dampingRatio = 0.76f,
        stiffness = Spring.StiffnessMediumLow,
    )
    val orbWidth by animateDpAsState(
        targetValue = if (isCollapsed) 58.dp else 60.dp,
        animationSpec = morphSpring,
        label = "AstrolabeWidth",
    )
    val orbHeight by animateDpAsState(
        targetValue = if (isCollapsed) 16.dp else 60.dp,
        animationSpec = morphSpring,
        label = "AstrolabeHeight",
    )
    val iconAlpha by animateFloatAsState(
        targetValue = if (isCollapsed) 0f else 1f,
        animationSpec = tween(durationMillis = if (isCollapsed) 110 else 220),
        label = "AstrolabeIconAlpha",
    )
    val pillIndicatorAlpha by animateFloatAsState(
        targetValue = if (isCollapsed) 0.9f else 0f,
        animationSpec = tween(durationMillis = 160),
        label = "AstrolabePillDotAlpha",
    )
    val backdropAlpha by animateFloatAsState(
        targetValue = if (isExpanded) 1f else 0f,
        animationSpec = tween(durationMillis = 260),
        label = "AstrolabeBackdropAlpha",
    )
    val activeAccent = if (isExpanded) LifeOsColors.HomeWhite else currentRoute.accent
    val orbBorderColor by animateColorAsState(
        targetValue = when {
            isExpanded -> LifeOsColors.HomeWhite.copy(alpha = 0.85f)
            isCollapsed -> LifeOsColors.BorderEmphasized.copy(alpha = 0.9f)
            else -> activeAccent.copy(alpha = 0.72f)
        },
        animationSpec = tween(durationMillis = 220),
        label = "AstrolabeBorderColor",
    )

    val density = LocalDensity.current
    val innerRadiusPx = with(density) { 142.dp.toPx() }
    val outerRadiusPx = with(density) { 230.dp.toPx() }

    Box(modifier = modifier.fillMaxSize()) {
        // Scrim (backdrop blur itself is applied on the underlying content in MainActivity)
        if (backdropAlpha > 0.01f) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .alpha(backdropAlpha)
                    .background(LifeOsColors.VoidBlack.copy(alpha = 0.72f))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        enabled = isExpanded,
                        onClick = { onStateChange(AstrolabeState.POPPED_ORB) },
                    ),
            )
        }

        // Bottom-center Anchor: Concentric guide rings + Emerging orbital nodes + Morphing Pill <-> Orb
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 16.dp)
                .drawBehind {
                    if (backdropAlpha > 0.01f) {
                        val anchor = Offset(size.width / 2f, size.height / 2f)
                        drawCircle(
                            color = LifeOsColors.BorderEmphasized.copy(alpha = 0.45f * backdropAlpha),
                            radius = innerRadiusPx,
                            center = anchor,
                            style = Stroke(width = 1.5f),
                        )
                        drawCircle(
                            color = LifeOsColors.BorderSubtle.copy(alpha = 0.75f * backdropAlpha),
                            radius = outerRadiusPx,
                            center = anchor,
                            style = Stroke(
                                width = 1.5f,
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 10f), 0f),
                            ),
                        )
                    }
                },
        ) {
            // Orbit 1: Fluidly emerges from main orb (0,0) into inner upper semicircle (-160 deg to -20 deg)
            ORBIT_1_NODES.forEachIndexed { index, route ->
                val angleDeg = -160.0 + (140.0 * index / (ORBIT_1_NODES.size - 1))
                val angleRad = Math.toRadians(angleDeg)
                val targetX = (innerRadiusPx * cos(angleRad)).roundToInt()
                val targetY = (innerRadiusPx * sin(angleRad)).roundToInt()

                EmergingOrbitalNode(
                    route = route,
                    isExpanded = isExpanded,
                    isActive = currentRoute == route,
                    targetX = targetX,
                    targetY = targetY,
                    delayMillis = index * 24,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onNavigate(route)
                        onStateChange(AstrolabeState.POPPED_ORB)
                    },
                )
            }

            // Orbit 2: Fluidly emerges from main orb (0,0) into outer upper semicircle (-134 deg to -46 deg)
            ORBIT_2_NODES.forEachIndexed { index, route ->
                val angleDeg = -134.0 + (88.0 * index / (ORBIT_2_NODES.size - 1))
                val angleRad = Math.toRadians(angleDeg)
                val targetX = (outerRadiusPx * cos(angleRad)).roundToInt()
                val targetY = (outerRadiusPx * sin(angleRad)).roundToInt()

                EmergingOrbitalNode(
                    route = route,
                    isExpanded = isExpanded,
                    isActive = currentRoute == route,
                    targetX = targetX,
                    targetY = targetY,
                    delayMillis = 90 + index * 24,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onNavigate(route)
                        onStateChange(AstrolabeState.POPPED_ORB)
                    },
                )
            }

            // Main Morphing Control: State 1 (Collapsed Pill) <-> State 2 (Single Orb) <-> State 3 (Center Home Hub)
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(width = orbWidth, height = orbHeight)
                    .clip(CircleShape)
                    .background(
                        if (isCollapsed) {
                            LifeOsColors.SurfaceCard.copy(alpha = 0.88f)
                        } else {
                            LifeOsColors.SurfaceCard.copy(alpha = 0.96f)
                        },
                    )
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                activeAccent.copy(alpha = if (isCollapsed) 0.12f else 0.22f),
                                Color.Transparent,
                            ),
                        ),
                    )
                    .border(
                        width = if (isCollapsed) 1.dp else 1.5.dp,
                        color = orbBorderColor,
                        shape = CircleShape,
                    )
                    .clickable {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        when (state) {
                            AstrolabeState.COLLAPSED_PILL -> onStateChange(AstrolabeState.POPPED_ORB)
                            AstrolabeState.POPPED_ORB -> onStateChange(AstrolabeState.EXPANDED_OVERLAY)
                            AstrolabeState.EXPANDED_OVERLAY -> {
                                if (currentRoute != LifeOsRoute.HOME) {
                                    onNavigate(LifeOsRoute.HOME)
                                }
                                onStateChange(AstrolabeState.POPPED_ORB)
                            }
                        }
                    },
            ) {
                // Collapsed pill subtle solar filament
                if (pillIndicatorAlpha > 0.01f) {
                    Box(
                        modifier = Modifier
                            .width(20.dp)
                            .height(3.dp)
                            .alpha(pillIndicatorAlpha)
                            .clip(CircleShape)
                            .background(currentRoute.accent.copy(alpha = 0.85f)),
                    )
                }

                // Popped orb / Expanded hub icon
                if (iconAlpha > 0.01f) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(44.dp)
                            .alpha(iconAlpha)
                            .clip(CircleShape)
                            .border(
                                width = 0.75.dp,
                                color = activeAccent.copy(alpha = 0.28f),
                                shape = CircleShape,
                            ),
                    ) {
                        Icon(
                            imageVector = when {
                                isExpanded -> Icons.Rounded.Home
                                currentRoute == LifeOsRoute.HOME -> Icons.Rounded.Hub
                                else -> routeIcon(currentRoute)
                            },
                            contentDescription = if (isExpanded) "Home" else "Astrolabe",
                            tint = activeAccent,
                            modifier = Modifier.size(22.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EmergingOrbitalNode(
    route: LifeOsRoute,
    isExpanded: Boolean,
    isActive: Boolean,
    targetX: Int,
    targetY: Int,
    delayMillis: Int,
    onClick: () -> Unit,
) {
    val progress by animateFloatAsState(
        targetValue = if (isExpanded) 1f else 0f,
        animationSpec = spring(
            dampingRatio = 0.72f,
            stiffness = if (isExpanded) 280f else 420f,
        ),
        label = "OrbProgress_${route.route}",
    )
    val delayedAlpha by animateFloatAsState(
        targetValue = if (isExpanded) 1f else 0f,
        animationSpec = tween(
            durationMillis = if (isExpanded) 220 else 120,
            delayMillis = if (isExpanded) delayMillis else 0,
        ),
        label = "OrbAlpha_${route.route}",
    )

    if (progress <= 0.02f && delayedAlpha <= 0.02f) return

    val currentX = (targetX * progress).roundToInt()
    val currentY = (targetY * progress).roundToInt()

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .offset { IntOffset(currentX, currentY) }
            .scale(0.3f + 0.7f * progress)
            .alpha(delayedAlpha)
            .width(66.dp)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                enabled = isExpanded,
                onClick = onClick,
            ),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(46.dp)
                .clip(CircleShape)
                .background(
                    if (isActive) route.accent else LifeOsColors.SurfaceCard.copy(alpha = 0.94f),
                )
                .border(
                    width = if (isActive) 1.5.dp else 1.dp,
                    color = if (isActive) route.accent else route.accent.copy(alpha = 0.45f),
                    shape = CircleShape,
                ),
        ) {
            Icon(
                imageVector = routeIcon(route),
                contentDescription = route.label,
                tint = if (isActive) LifeOsColors.VoidBlack else route.accent,
                modifier = Modifier.size(20.dp),
            )
        }
        Spacer(modifier = Modifier.height(3.dp))
        Text(
            text = route.shortLabel,
            style = MaterialTheme.typography.labelSmall.copy(
                fontFamily = FontFamily.SansSerif,
                fontSize = 10.sp,
            ),
            color = if (isActive) route.accent else LifeOsColors.TextSecondary,
            fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
        )
    }
}
