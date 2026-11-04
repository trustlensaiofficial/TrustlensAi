package com.trustlensai.android.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trustlensai.android.core.consent.ConsentStore
import com.trustlensai.android.core.session.SessionState
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.BulletList
import com.trustlensai.android.ui.components.SectionCard

/**
 * Settings, which is mostly consent.
 *
 * The capability list is rendered from the server's own answer, and only
 * where a capability is *not* available: silence means working. There is
 * deliberately no aggregate status badge — capabilities differ per platform
 * and per grant, and one green tick would hide exactly what a user needs.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    vm: AnalysisViewModel,
    onBack: () -> Unit,
    onOpenSignIn: () -> Unit,
) {
    val consent by vm.consent.collectAsState()
    val capabilities by vm.capabilities.collectAsState()
    val session by vm.session.collectAsState()

    LaunchedEffect(Unit) { vm.loadCapabilities() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // The account section leads, because it is the only thing on this
            // screen whose state someone might not already know.
            SectionCard("Account") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    when (val s = session) {
                        is SessionState.SignedIn -> {
                            Text(
                                s.email?.let { "Signed in as $it" } ?: "Signed in",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Text(
                                "Your saved cases follow this account. Signing out leaves them on the server and removes them from this phone.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            OutlinedButton(onClick = vm::signOut, modifier = Modifier.fillMaxWidth()) {
                                Text("Sign out")
                            }
                        }
                        SessionState.Unconfigured -> Text(
                            "Sign-in is not available in this build. Everything else works.",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        else -> {
                            Text(
                                "You are using TrustLens without an account, which is fine — checking a message, reading a payment code and the recovery plan all work this way.",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            OutlinedButton(onClick = onOpenSignIn, modifier = Modifier.fillMaxWidth()) {
                                Text("Sign in to save cases")
                            }
                        }
                    }
                }
            }

            SectionCard("What may leave this phone") {
                Column {
                    Toggle(
                        "Open suspicious links from our server",
                        "The site sees our address, not yours. It can still serve us something different from what it serves you.",
                        consent.liveChecks,
                        vm::setLiveChecks,
                    )
                    Toggle(
                        "Let an AI read the message",
                        "Sends the text to a model provider. Its reading is labelled as interpretation and is never treated as fact.",
                        consent.cloudAi,
                        vm::setCloudAi,
                    )
                    Toggle(
                        "Keep a copy against my account",
                        "Without this, reports stay on this phone only.",
                        consent.accountSync,
                        vm::setAccountSync,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Agreed against disclosure version ${ConsentStore.POLICY_VERSION}. " +
                            "If that wording changes, we will ask again.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            OutlinedButton(onClick = vm::revokeAll, modifier = Modifier.fillMaxWidth()) {
                Text("Turn all of these off")
            }

            // Only what is NOT available. Silence means working.
            val notAvailable = capabilities.filter { it.state != "available" }
            if (notAvailable.isNotEmpty()) {
                SectionCard("What this app cannot do here") {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        for (cap in notAvailable) {
                            Column {
                                Text(
                                    cap.key.replace('_', ' '),
                                    style = MaterialTheme.typography.labelLarge,
                                )
                                cap.reason?.let {
                                    Text(
                                        it,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                // The exact platform API, so the claim is
                                // checkable rather than taken on trust.
                                cap.mechanism?.let {
                                    Text(
                                        "Mechanism: $it",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                if (cap.limits.isNotEmpty()) {
                                    Spacer(Modifier.height(4.dp))
                                    BulletList(cap.limits)
                                }
                            }
                        }
                    }
                }
            }

            SectionCard("Never asked for") {
                BulletList(
                    listOf(
                        "Your UPI PIN, an OTP, a password or a card number. Not anywhere in this app, for any reason.",
                        "Your SMS inbox, your call log or your contacts list.",
                        "Your location, your microphone or your screen.",
                    ),
                )
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun Toggle(title: String, detail: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.labelLarge)
            Text(
                detail,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(1.dp))
        Switch(checked = checked, onCheckedChange = onChange)
    }
}
