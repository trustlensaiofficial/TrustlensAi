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
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trustlensai.android.ui.AnalysisUiState
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.QuietNote
import com.trustlensai.android.ui.components.SectionCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    vm: AnalysisViewModel,
    onOpenReport: () -> Unit,
    onOpenIncident: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val consent by vm.consent.collectAsState()
    var input by remember { mutableStateOf("") }

    // Navigate once a report exists, rather than guessing when it will.
    LaunchedEffect(state) {
        if (state is AnalysisUiState.Loaded) onOpenReport()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("TrustLens") },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = "Settings")
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
            Text(
                "Paste the message you are unsure about.",
                style = MaterialTheme.typography.bodyLarge,
            )

            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                modifier = Modifier.fillMaxWidth().height(170.dp),
                label = { Text("Message, or a link") },
                placeholder = { Text("Paste it here") },
                supportingText = {
                    Text("You can also share a message to TrustLens from any app.")
                },
            )

            SectionCard("Before you check") {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    ConsentRow(
                        title = "Open the link from our server",
                        detail = "Checks where a link actually goes. The site sees our address, not yours.",
                        checked = consent.liveChecks,
                        onChange = vm::setLiveChecks,
                    )
                    ConsentRow(
                        title = "Let an AI read the message",
                        detail = "Sends the text to a model provider. The fixed rules work without this.",
                        checked = consent.cloudAi,
                        onChange = vm::setCloudAi,
                    )
                    if (consent.isMinimal) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Both are off, so nothing but the text you paste leaves this phone.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            Button(
                onClick = { vm.analyse(input) },
                enabled = input.isNotBlank() && state !is AnalysisUiState.Loading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state is AnalysisUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.height(18.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(Modifier.height(1.dp))
                    Text("  Checking…")
                } else {
                    Text("Check this message")
                }
            }

            OutlinedButton(onClick = onOpenIncident, modifier = Modifier.fillMaxWidth()) {
                Text("Something already happened")
            }

            // Every non-happy state is rendered, and each says what to do.
            when (val s = state) {
                is AnalysisUiState.Invalid -> QuietNote(s.message)
                is AnalysisUiState.RateLimited ->
                    QuietNote("Too many checks just now. Try again in ${s.retryAfterSeconds} seconds.")
                is AnalysisUiState.Unavailable -> QuietNote(s.reason)
                AnalysisUiState.Offline -> QuietNote(
                    "This phone is offline, so a new check cannot run. Reports you already have are still readable.",
                )
                is AnalysisUiState.Failed -> QuietNote(s.message)
                else -> Unit
            }

            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun ConsentRow(
    title: String,
    detail: String,
    checked: Boolean,
    onChange: (Boolean) -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 6.dp),
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
