package com.lifeos.companion.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.ui.navigation.LifeOsRoute
import com.lifeos.companion.ui.navigation.routeIcon
import com.lifeos.companion.ui.theme.LifeOsColors
import kotlinx.coroutines.launch

@Composable
fun ModulePlaceholderScreen(
    route: LifeOsRoute,
    userEmail: String?,
    onBackHome: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(scrollState)
            .padding(start = 24.dp, end = 24.dp, top = 32.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = routeIcon(route),
            contentDescription = route.label,
            tint = route.accent,
            modifier = Modifier.size(48.dp),
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = route.label.uppercase(),
            style = MaterialTheme.typography.titleMedium,
            color = route.accent,
            letterSpacing = 2.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(modifier = Modifier.height(10.dp))
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = LifeOsColors.SurfaceCard,
            border = BorderStroke(1.dp, LifeOsColors.BorderSubtle),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = if (route.isV1Ready) {
                        "Dedicated ${route.label} surface scheduled for Phase G3 (with Room + WorkManager Hybrid Outbox)."
                    } else {
                        "${route.label} is scheduled for Wave 2 (Phase H)."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = LifeOsColors.TextSecondary,
                    textAlign = TextAlign.Center,
                )
                if (route == LifeOsRoute.PROFILE && userEmail != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Signed in as $userEmail",
                        style = MaterialTheme.typography.labelMedium,
                        color = LifeOsColors.TextPrimary,
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedButton(
                        onClick = {
                            scope.launch { SupabaseClientProvider.auth.signOut() }
                        },
                    ) {
                        Text("Sign Out", color = LifeOsColors.FieldReportsRose)
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = onBackHome,
            colors = ButtonDefaults.buttonColors(
                containerColor = LifeOsColors.TimeGold,
                contentColor = LifeOsColors.VoidBlack,
            ),
        ) {
            Text("Back to Home", fontWeight = FontWeight.SemiBold)
        }
    }
}
