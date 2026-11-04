package com.trustlensai.android.ui.components

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.trustlensai.android.ui.theme.severityColor

@Composable
fun SectionCard(
    title: String,
    modifier: Modifier = Modifier,
    accent: Color? = null,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth().animateContentSize(),
        shape = RoundedCornerShape(22.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = .72f)),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp, pressedElevation = 5.dp),
    ) {
        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
            if (accent != null) Spacer(Modifier.width(4.dp).fillMaxHeight().background(accent))
            Column(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(9.dp)) {
                Text(title,style=MaterialTheme.typography.titleMedium,color=MaterialTheme.colorScheme.onSurface)
                content()
            }
        }
    }
}

@Composable
fun SeverityChip(severity: String, modifier: Modifier = Modifier) {
    val color = severityColor(severity)
    Text(
        text=severity.uppercase(),
        style=MaterialTheme.typography.labelSmall,
        color=color,
        fontWeight=FontWeight.Bold,
        modifier=modifier.clip(RoundedCornerShape(50))
            .background(color.copy(alpha=.13f))
            .padding(horizontal=11.dp,vertical=6.dp),
    )
}

@Composable
fun QuotedEvidence(text: String, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth().height(IntrinsicSize.Min)
        .clip(RoundedCornerShape(14.dp)).background(MaterialTheme.colorScheme.surfaceVariant)
        .padding(12.dp)) {
        Spacer(Modifier.width(3.dp).fillMaxHeight().background(MaterialTheme.colorScheme.primary))
        Spacer(Modifier.width(10.dp))
        Text("“$text”",style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun BulletList(items: List<String>, modifier: Modifier = Modifier) {
    Column(modifier,verticalArrangement=Arrangement.spacedBy(8.dp)) {
        for(item in items) Row(verticalAlignment=Alignment.Top) {
            Text("•  ",style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.primary)
            Text(item,style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun QuietNote(text: String, modifier: Modifier = Modifier) {
    Text(text,style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant,
        modifier=modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant).padding(14.dp))
}

fun provenanceLabel(provenance: String): String = when(provenance) {
    "deterministic" -> "Fixed rule"
    "on_device" -> "Checked on your device"
    "retrieved" -> "Checked"
    "model_inference" -> "AI reading"
    "user_supplied" -> "You told us"
    "assumption" -> "Unverified assumption"
    else -> provenance
}
fun levelLabel(level: String): String = when(level) {
    "high_risk" -> "Strong warning signs"
    "elevated_risk" -> "Serious warning signs"
    "some_signals" -> "Some warning signs"
    "no_signals_detected" -> "No warning signs matched"
    "unable_to_assess" -> "Not enough to assess"
    else -> level
}
fun paymentActionLabel(kind: String): String = when(kind) {
    "enter_upi_pin" -> "You are being asked to enter your UPI PIN"
    "approve_collect" -> "You are being asked to approve a payment request"
    "scan_qr" -> "You are being asked to scan a payment code"
    "send_money" -> "You are being asked to send money"
    "share_credentials" -> "You are being asked for a code or card detail"
    "install_app" -> "You are being asked to install an app"
    else -> "No payment action identified"
}
val ACTION_STATE_LABELS: List<Pair<String,String>> = listOf(
    "received_only" to "I only received it",
    "opened_link" to "I opened the link",
    "scanned_qr_only" to "I scanned a code but did not pay",
    "installed_app" to "I installed an app they asked for",
    "entered_credentials" to "I entered a username and password",
    "shared_identity_documents" to "I shared identity documents",
    "shared_screen" to "I shared my screen",
    "shared_otp_or_pin" to "I shared an OTP or PIN",
    "granted_remote_access" to "I gave them remote access",
    "entered_upi_pin" to "I entered my UPI PIN",
    "approved_payment_request" to "I approved a payment request",
    "transferred_money" to "I sent money",
)
