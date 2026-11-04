package com.trustlensai.android.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trustlensai.android.core.net.OfficialChannel
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.ACTION_STATE_LABELS
import com.trustlensai.android.ui.components.QuietNote
import com.trustlensai.android.ui.components.SectionCard

/**
 * Incident response.
 *
 * Needs no account. Someone whose money left ten minutes ago must not meet a
 * sign-in screen, and the endpoint behind this is unauthenticated for exactly
 * that reason.
 *
 * The urgent channel — 1930 — renders **above** the step list, not inside it.
 * Someone whose money has just gone should not have to scroll past advice to
 * find a phone number.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentScreen(vm: AnalysisViewModel, onBack: () -> Unit) {
    val plan by vm.plan.collectAsState()
    val uriHandler = LocalUriHandler.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("What already happened") },
                navigationIcon = {
                    IconButton(onClick = {
                        vm.clearPlan()
                        onBack()
                    }) {
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
            val current = plan
            if (current == null) {
                Text(
                    "Tell us the furthest thing you did. The advice changes a great deal depending on it.",
                    style = MaterialTheme.typography.bodyLarge,
                )
                // Mildest first, so the list does not open on the worst case.
                for ((state, label) in ACTION_STATE_LABELS) {
                    OutlinedButton(
                        onClick = { vm.loadRecoveryPlan(state) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(label)
                    }
                }
                Spacer(Modifier.height(20.dp))
                return@Column
            }

            Text(current.title, style = MaterialTheme.typography.headlineSmall)
            if (current.summary.isNotBlank()) {
                Text(current.summary, style = MaterialTheme.typography.bodyMedium)
            }

            // Urgent channels first, before any step.
            val urgent = current.officialChannels.filter { it.urgent }
            if (urgent.isNotEmpty()) {
                SectionCard("Do this first", accent = MaterialTheme.colorScheme.error) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        for (channel in urgent) ChannelBlock(channel) { url -> uriHandler.openUri(url) }
                    }
                }
            }

            if (current.steps.isNotEmpty()) {
                SectionCard("Then, in this order") {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        for (step in current.steps) {
                            Column {
                                Text(
                                    "${step.order}. ${step.action}",
                                    style = MaterialTheme.typography.labelLarge,
                                )
                                if (step.why.isNotBlank()) {
                                    Text(
                                        step.why,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }
                }
            }

            val other = current.officialChannels.filterNot { it.urgent }
            if (other.isNotEmpty()) {
                SectionCard("Where to report it") {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        for (channel in other) ChannelBlock(channel) { url -> uriHandler.openUri(url) }
                    }
                }
            }

            // Mandatory. Recovery is never promised.
            if (current.disclaimer.isNotBlank()) QuietNote(current.disclaimer)

            Button(onClick = { vm.clearPlan() }, modifier = Modifier.fillMaxWidth()) {
                Text("Choose something else")
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ChannelBlock(channel: OfficialChannel, onOpen: (String) -> Unit) {
    Column {
        Text(channel.name, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
        Text(channel.contact, style = MaterialTheme.typography.bodyLarge)
        if (channel.useWhen.isNotBlank()) {
            // Verbatim: the backend decides which channel applies, and
            // re-wording it here could send someone to the wrong agency.
            Text(
                channel.useWhen,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        channel.url?.let { url ->
            Spacer(Modifier.height(4.dp))
            OutlinedButton(onClick = { onOpen(url) }) { Text("Open ${channel.contact}") }
        }
    }
}
