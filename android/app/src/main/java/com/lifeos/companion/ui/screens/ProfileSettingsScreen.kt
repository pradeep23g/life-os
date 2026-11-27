package com.lifeos.companion.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.ui.theme.LifeOsColors
import kotlinx.coroutines.launch

@Composable
fun ProfileSettingsScreen(
    userEmail: String?,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

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
                    text = "PROFILE · IDENTITY",
                    style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                    color = LifeOsColors.ProfileSlate,
                    letterSpacing = 1.6.sp,
                )
                Text(
                    text = "Chronicle Identity",
                    style = MaterialTheme.typography.headlineSmall,
                    color = LifeOsColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        item {
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
                    Text(
                        text = "AUTHENTICATED ACCOUNT",
                        style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                        color = LifeOsColors.TextTertiary,
                        letterSpacing = 1.2.sp,
                    )
                    Text(
                        text = userEmail ?: "Authenticated User",
                        style = MaterialTheme.typography.bodyMedium,
                        color = LifeOsColors.TextPrimary,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Bucket colors, notifications, and sync controls have moved to the System orb.",
                        style = MaterialTheme.typography.bodySmall,
                        color = LifeOsColors.TextSecondary,
                    )
                }
            }
        }

        item {
            OutlinedButton(
                onClick = {
                    scope.launch { SupabaseClientProvider.signOutAndClear(context) }
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
