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
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trustlensai.android.core.net.PaymentAction
import com.trustlensai.android.core.net.Report
import com.trustlensai.android.ui.AnalysisUiState
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.BulletList
import com.trustlensai.android.ui.components.QuietNote
import com.trustlensai.android.ui.components.QuotedEvidence
import com.trustlensai.android.ui.components.SectionCard
import com.trustlensai.android.ui.components.SeverityChip
import com.trustlensai.android.ui.components.levelLabel
import com.trustlensai.android.ui.components.paymentActionLabel
import com.trustlensai.android.ui.components.provenanceLabel
import com.trustlensai.android.ui.theme.levelColor

/**
 * The report.
 *
 * The section order is deliberate and must not be rearranged: it is the order
 * a worried person reads under stress. The verdict first and **static** — no
 * entry animation, because someone mid-scam has to be able to read it the
 * instant it paints. Then what they are being asked to do with their money,
 * which matters more to them than which rules fired. Then the evidence, then
 * what was not checked, then what to do.
 *
 * Nothing on this screen computes a verdict. `assessment.level` and each
 * `signals[].severity` are rendered exactly as the server sent them.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(
    vm: AnalysisViewModel,
    onBack: () -> Unit,
    onOpenIncident: () -> Unit,
) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("What we found") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        val loaded = state as? AnalysisUiState.Loaded
        if (loaded == null) {
            Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                QuietNote("There is no report to show. Check a message first.")
            }
            return@Scaffold
        }

        ReportBody(
            report = loaded.report,
            storageNote = loaded.storageNote,
            onOpenIncident = onOpenIncident,
            modifier = Modifier.fillMaxSize().padding(padding),
        )
    }
}

@Composable
private fun ReportBody(
    report: Report,
    storageNote: String?,
    onOpenIncident: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier.verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        /* 1. The verdict. Largest element, no animation. */
        Column {
            Text(
                levelLabel(report.assessment.level),
                style = MaterialTheme.typography.labelLarge,
                color = levelColor(report.assessment.level),
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(6.dp))
            Text(report.assessment.headline, style = MaterialTheme.typography.headlineSmall)
            if (report.assessment.summary.isNotBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(report.assessment.summary, style = MaterialTheme.typography.bodyMedium)
            }
        }

        /* 2. The payment action, above the signal list. */
        report.paymentAction?.takeIf { it.detected }?.let { PaymentActionPanel(it) }

        /* 3. Warning signs, each with the words that triggered it. */
        if (report.signals.isNotEmpty()) {
            SectionCard("Warning signs", accent = levelColor(report.assessment.level)) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    for (signal in report.signals) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                SeverityChip(signal.severity)
                                Spacer(Modifier.height(1.dp))
                                Text(
                                    "  ${signal.title}",
                                    style = MaterialTheme.typography.labelLarge,
                                )
                            }
                            if (signal.explanation.isNotBlank()) {
                                Spacer(Modifier.height(4.dp))
                                Text(signal.explanation, style = MaterialTheme.typography.bodyMedium)
                            }
                            // The quoted span is the evidence, so it is shown
                            // whenever the server provided one.
                            signal.matches.firstOrNull()?.let {
                                Spacer(Modifier.height(6.dp))
                                QuotedEvidence(it.text)
                            }
                        }
                    }
                }
            }
        }

        /* 4. How each statement was established, grouped by provenance and
              never blended — a fixed rule and an AI reading are different
              kinds of claim. */
        if (report.findings.isNotEmpty()) {
            SectionCard("How this was established") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    for ((provenance, findings) in report.findings.groupBy { it.provenance }) {
                        Column {
                            Text(
                                provenanceLabel(provenance),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(4.dp))
                            BulletList(findings.map { it.statement })
                        }
                    }
                }
            }
        }

        /* 5. Both columns of uncertainty. notChecked is never hidden. */
        if (report.uncertainty.checked.isNotEmpty()) {
            SectionCard("What was checked") { BulletList(report.uncertainty.checked) }
        }
        if (report.uncertainty.notChecked.isNotEmpty()) {
            SectionCard("What was not checked") { BulletList(report.uncertainty.notChecked) }
        }
        if (report.uncertainty.limits.isNotEmpty()) {
            SectionCard("Limits of this method") { BulletList(report.uncertainty.limits) }
        }

        /* 6. Next steps, in the order the server put them. */
        if (report.checklist.isNotEmpty()) {
            SectionCard("What to do next") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    report.checklist.forEachIndexed { i, step ->
                        Column {
                            Text("${i + 1}. ${step.action}", style = MaterialTheme.typography.labelLarge)
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

        // Degraded is not an error: the report above is complete without it.
        if (report.model.degraded && !report.model.reason.isNullOrBlank()) {
            QuietNote(report.model.reason!!)
        }
        // Never imply a report was saved when it was not.
        if (!storageNote.isNullOrBlank()) QuietNote(storageNote)

        OutlinedButton(onClick = onOpenIncident, modifier = Modifier.fillMaxWidth()) {
            Text("I already did something")
        }
        Spacer(Modifier.height(24.dp))
    }
}

/**
 * The payment-action panel.
 *
 * When the message promises money in while the mechanism takes money out,
 * that contradiction is the headline — it is the single most useful sentence
 * the product can offer, and it goes first.
 */
@Composable
private fun PaymentActionPanel(action: PaymentAction) {
    SectionCard(
        title = if (action.claimContradiction) {
            "This takes money out, not in"
        } else {
            paymentActionLabel(action.kind)
        },
        accent = MaterialTheme.colorScheme.error,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (action.claimContradiction) {
                Text(
                    paymentActionLabel(action.kind),
                    style = MaterialTheme.typography.labelLarge,
                )
                action.claimSpan?.let {
                    Text(
                        "The message says money is coming to you:",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    QuotedEvidence(it.text)
                }
            }

            if (action.explanation.isNotBlank()) {
                Text(action.explanation, style = MaterialTheme.typography.bodyMedium)
            }

            action.upi?.let { upi ->
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    upi.payeeVpa?.let {
                        Text("Would be paid to: $it", style = MaterialTheme.typography.bodyMedium)
                    }
                    upi.amount?.let {
                        Text(
                            "Amount: ${upi.currency ?: "INR"} $it",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    // Quoted, because this label is set by whoever made the
                    // request and is verified by nobody.
                    upi.payeeName?.let {
                        Text(
                            "The request calls them “$it”, which no bank has checked.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            // The honest half of the panel, never collapsed.
            if (action.unknowns.isNotEmpty()) {
                Text(
                    "What we cannot tell you",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                BulletList(action.unknowns)
            }
        }
    }
}
