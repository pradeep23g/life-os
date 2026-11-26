package com.lifeos.companion

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.ui.auth.AuthScreen
import com.lifeos.companion.ui.focus.FocusScreen
import com.lifeos.companion.ui.habits.HabitsScreen
import com.lifeos.companion.ui.home.HomeScreen
import com.lifeos.companion.ui.journal.JournalScreen
import com.lifeos.companion.ui.navigation.AstrolabeNavigationDock
import com.lifeos.companion.ui.navigation.AstrolabeState
import com.lifeos.companion.ui.navigation.LifeOsRoute
import com.lifeos.companion.ui.navigation.rememberAstrolabeScrollConnection
import com.lifeos.companion.ui.screens.ModulePlaceholderScreen
import com.lifeos.companion.ui.screens.ProfileSettingsScreen
import com.lifeos.companion.ui.tasks.TasksScreen
import com.lifeos.companion.ui.theme.LifeOsColors
import com.lifeos.companion.ui.theme.LifeOsTheme
import io.github.jan.supabase.auth.status.SessionStatus

class MainActivity : FragmentActivity() {
    private var isUnlocked by mutableStateOf(false)
    private var biometricError by mutableStateOf<String?>(null)
    private var pendingDeepLinkRoute by mutableStateOf<LifeOsRoute?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        pendingDeepLinkRoute = resolveDeepLinkRoute(intent?.data)
        triggerBiometricGate()

        setContent {
            LifeOsTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = LifeOsColors.VoidBlack,
                ) {
                    if (!isUnlocked) {
                        BiometricLockGate(
                            error = biometricError,
                            onUnlockClick = { triggerBiometricGate() },
                        )
                    } else {
                        val sessionStatus by SupabaseClientProvider.auth.sessionStatus.collectAsState()
                        when (val status = sessionStatus) {
                            is SessionStatus.Initializing -> {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    CircularProgressIndicator(color = LifeOsColors.TimeGold, strokeWidth = 2.dp)
                                }
                            }
                            is SessionStatus.Authenticated -> {
                                LifeOsCompanionShell(
                                    userEmail = status.session.user?.email,
                                    deepLinkRoute = pendingDeepLinkRoute,
                                    onConsumeDeepLink = { pendingDeepLinkRoute = null },
                                )
                            }
                            else -> {
                                AuthScreen()
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        resolveDeepLinkRoute(intent.data)?.let { target ->
            pendingDeepLinkRoute = target
        }
    }

    private fun resolveDeepLinkRoute(uri: Uri?): LifeOsRoute? {
        if (uri == null || uri.scheme != "lifeos") return null
        return when (uri.host) {
            "tasks" -> LifeOsRoute.TASKS
            "focus" -> LifeOsRoute.FOCUS
            "habits" -> LifeOsRoute.HABITS
            "journal" -> LifeOsRoute.JOURNAL
            "mind" -> when {
                uri.path?.contains("journal") == true -> LifeOsRoute.JOURNAL
                else -> LifeOsRoute.HABITS
            }
            "profile" -> LifeOsRoute.PROFILE
            "home" -> LifeOsRoute.HOME
            else -> null
        }
    }

    private fun requestNotificationsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    REQUEST_NOTIFICATION_PERMISSION,
                )
            }
        }
    }

    private fun triggerBiometricGate() {
        val biometricManager = BiometricManager.from(this)
        val authenticators = BIOMETRIC_STRONG or DEVICE_CREDENTIAL
        if (biometricManager.canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_SUCCESS) {
            isUnlocked = true
            requestNotificationsIfNeeded()
            return
        }

        val executor = ContextCompat.getMainExecutor(this)
        val prompt = BiometricPrompt(
            this,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    biometricError = null
                    isUnlocked = true
                    requestNotificationsIfNeeded()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    biometricError = errString.toString()
                }
            },
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock Life OS")
            .setSubtitle("Authenticate to access your personal intelligence system")
            .setAllowedAuthenticators(authenticators)
            .build()

        prompt.authenticate(promptInfo)
    }

    companion object {
        private const val REQUEST_NOTIFICATION_PERMISSION = 1001
    }
}

@Composable
private fun LifeOsCompanionShell(
    userEmail: String?,
    deepLinkRoute: LifeOsRoute?,
    onConsumeDeepLink: () -> Unit,
) {
    var currentRoute by remember { mutableStateOf(LifeOsRoute.HOME) }
    var astrolabeState by remember { mutableStateOf(AstrolabeState.POPPED_ORB) }
    var preselectedFocusTaskId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(deepLinkRoute) {
        if (deepLinkRoute != null) {
            currentRoute = deepLinkRoute
            astrolabeState = AstrolabeState.POPPED_ORB
            onConsumeDeepLink()
        }
    }

    val scrollConnection = rememberAstrolabeScrollConnection(
        astrolabeState = astrolabeState,
        onStateChange = { astrolabeState = it },
    )

    val contentBlurRadius by animateDpAsState(
        targetValue = if (astrolabeState == AstrolabeState.EXPANDED_OVERLAY) 18.dp else 0.dp,
        animationSpec = tween(durationMillis = 240),
        label = "AstrolabeBackdropBlur",
    )

    if (currentRoute != LifeOsRoute.HOME && astrolabeState != AstrolabeState.EXPANDED_OVERLAY) {
        BackHandler {
            currentRoute = LifeOsRoute.HOME
            astrolabeState = AstrolabeState.POPPED_ORB
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(scrollConnection),
    ) {
        val contentModifier = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && contentBlurRadius > 0.dp) {
            Modifier
                .fillMaxSize()
                .blur(contentBlurRadius)
        } else {
            Modifier.fillMaxSize()
        }

        Box(modifier = contentModifier) {
            when (currentRoute) {
                LifeOsRoute.HOME -> {
                    HomeScreen(
                        onNavigate = { target ->
                            currentRoute = target
                            astrolabeState = AstrolabeState.POPPED_ORB
                        },
                    )
                }
                LifeOsRoute.FOCUS -> {
                    FocusScreen(
                        preselectedTaskId = preselectedFocusTaskId,
                        onClearPreselectedTask = { preselectedFocusTaskId = null },
                    )
                }
                LifeOsRoute.TASKS -> {
                    TasksScreen(
                        onFocusOnTask = { taskId ->
                            preselectedFocusTaskId = taskId
                            currentRoute = LifeOsRoute.FOCUS
                            astrolabeState = AstrolabeState.POPPED_ORB
                        },
                    )
                }
                LifeOsRoute.HABITS -> {
                    HabitsScreen()
                }
                LifeOsRoute.JOURNAL -> {
                    JournalScreen()
                }
                LifeOsRoute.PROFILE -> {
                    ProfileSettingsScreen(userEmail = userEmail)
                }
                else -> {
                    ModulePlaceholderScreen(
                        route = currentRoute,
                        userEmail = userEmail,
                        onBackHome = {
                            currentRoute = LifeOsRoute.HOME
                            astrolabeState = AstrolabeState.POPPED_ORB
                        },
                    )
                }
            }
        }

        AstrolabeNavigationDock(
            currentRoute = currentRoute,
            state = astrolabeState,
            onStateChange = { astrolabeState = it },
            onNavigate = { target -> currentRoute = target },
        )
    }
}

@Composable
private fun BiometricLockGate(
    error: String?,
    onUnlockClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = Icons.Rounded.Lock,
            contentDescription = "Locked",
            tint = LifeOsColors.TimeGold,
            modifier = Modifier.size(40.dp),
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "LIFE OS LOCKED",
            style = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.Monospace),
            color = LifeOsColors.TextPrimary,
            letterSpacing = 2.sp,
            fontWeight = FontWeight.Bold,
        )
        if (error != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = error,
                style = MaterialTheme.typography.bodySmall,
                color = LifeOsColors.FieldReportsRose,
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onUnlockClick,
            colors = ButtonDefaults.buttonColors(
                containerColor = LifeOsColors.TimeGold,
                contentColor = LifeOsColors.VoidBlack,
            ),
        ) {
            Text("Unlock", fontWeight = FontWeight.SemiBold)
        }
    }
}
