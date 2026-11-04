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
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trustlensai.android.core.share.SharedPayload
import com.trustlensai.android.ui.AnalysisUiState
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.BulletList
import com.trustlensai.android.ui.components.QuietNote
import com.trustlensai.android.ui.components.QuotedEvidence
import com.trustlensai.android.ui.components.SectionCard

/**
 * Confirms what a share actually contained, before anything is sent.
 *
 * This screen is the consent step for a share. It exists so that the answer to
 * "what did TrustLens upload?" is always "exactly what you saw here, when you
 * tapped the button".
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SharePreviewScreen(
    payload: SharedPayload,
    vm: AnalysisViewModel,
    onDismiss: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val consent by vm.consent.collectAsState()
    val text = payload.analysableText()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Check this with TrustLens") }) },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (!payload.hasAnything) {
                QuietNote(
                    "The app you shared from did not include any text or image that TrustLens can read. " +
                        "Try copying the message and pasting it instead.",
                )
                OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Close")
                }
                Spacer(Modifier.height(20.dp))
                return@Column
            }

            Text(
                "This is what was shared. Nothing has been sent yet.",
                style = MaterialTheme.typography.bodyLarge,
            )

            if (!text.isNullOrBlank()) {
                SectionCard("The text") { QuotedEvidence(text) }
            }

            if (payload.imageUris.isNotEmpty()) {
                SectionCard("Images") {
                    Text(
                        if (payload.imageUris.size == 1) {
                            "1 image was shared. Image analysis is not available yet, so only the text above will be checked."
                        } else {
                            "${payload.imageUris.size} images were shared. Image analysis is not available yet, so only the text above will be checked."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            if (payload.urls.isNotEmpty()) {
                SectionCard("Links found") {
                    BulletList(payload.urls)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        if (consent.liveChecks) {
                            "These will be opened from our server, not from your phone."
                        } else {
                            "These will not be opened. Their address will be examined without contacting them."
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // Anything dropped is reported, never swallowed.
            if (payload.skipped.isNotEmpty()) {
                SectionCard("Not included") { BulletList(payload.skipped) }
            }

            when (val s = state) {
                is AnalysisUiState.Loading ->
                    CircularProgressIndicator(Modifier.height(24.dp), strokeWidth = 2.dp)
                is AnalysisUiState.Loaded ->
                    ReportBodyForShare(s, onDismiss)
                is AnalysisUiState.Invalid -> QuietNote(s.message)
                is AnalysisUiState.RateLimited ->
                    QuietNote("Too many checks just now. Try again in ${s.retryAfterSeconds} seconds.")
                is AnalysisUiState.Unavailable -> QuietNote(s.reason)
                AnalysisUiState.Offline -> QuietNote("This phone is offline, so the check cannot run yet.")
                is AnalysisUiState.Failed -> QuietNote(s.message)
                AnalysisUiState.Idle -> Unit
            }

            if (state !is AnalysisUiState.Loaded) {
                Button(
                    onClick = { vm.analyse(text) },
                    enabled = !text.isNullOrBlank() && state !is AnalysisUiState.Loading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Check it now")
                }
                OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel")
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

/**
 * The verdict, inline.
 *
 * A share is a one-shot interaction: pushing someone into a navigation stack
 * they did not open would strand them away from the app they were using.
 */
@Composable
private fun ReportBodyForShare(state: AnalysisUiState.Loaded, onDismiss: () -> Unit) {
    val report = state.report
    SectionCard(
        title = report.assessment.headline,
        accent = com.trustlensai.android.ui.theme.levelColor(report.assessment.level),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            report.paymentAction?.takeIf { it.detected }?.let { action ->
                if (action.claimContradiction) {
                    Text(
                        "This takes money out, not in.",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
                if (action.explanation.isNotBlank()) {
                    Text(action.explanation, style = MaterialTheme.typography.bodyMedium)
                }
            }
            if (report.checklist.isNotEmpty()) {
                Text("What to do next", style = MaterialTheme.typography.labelSmall)
                BulletList(report.checklist.map { it.action })
            }
            if (report.uncertainty.notChecked.isNotEmpty()) {
                Text("What was not checked", style = MaterialTheme.typography.labelSmall)
                BulletList(report.uncertainty.notChecked)
            }
            OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("Done")
            }
        }
    }
}
