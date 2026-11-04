package com.trustlensai.android.ui.screens

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.trustlensai.android.core.session.SessionManager
import com.trustlensai.android.ui.components.BulletList
import com.trustlensai.android.ui.components.QuietNote
import com.trustlensai.android.ui.components.SectionCard

/**
 * Sign-in.
 *
 * Never a gate. Everything that matters most — analysing a message, reading a
 * payment code, the whole recovery plan — works with no account at all, and
 * this screen says so plainly rather than implying the product is locked.
 * An account adds saved cases across devices and nothing else.
 *
 * Google only. There is no password field anywhere in this app, so there is
 * no password of ours to leak, reuse or phish. A passkey button is
 * deliberately absent rather than present-and-inert: offering a control that
 * does nothing is worse than not offering it.
 */
@Composable
fun SignInScreen(
    configured: Boolean,
    busy: Boolean,
    error: String?,
    authorizeUrl: () -> String?,
    onContinueWithoutAccount: () -> Unit,
) {
    val context = LocalContext.current

    Scaffold(containerColor = MaterialTheme.colorScheme.background) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Save your investigations", style = MaterialTheme.typography.headlineSmall)
            Text(
                "An account keeps your cases across devices. Everything else works without one.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            SectionCard("What an account changes") {
                BulletList(
                    listOf(
                        "Your saved cases follow you to a new phone.",
                        "Nothing else. Checking a message, reading a payment code and the full recovery plan all work signed out.",
                        "You can delete your account and every case with it.",
                    ),
                )
            }

            if (!configured) {
                // Honest about the cause rather than a generic failure.
                QuietNote(
                    "Sign-in is not available in this build: no Supabase configuration was supplied " +
                        "at build time. Every other part of TrustLens works.",
                )
            } else {
                Button(
                    onClick = {
                        val url = authorizeUrl() ?: return@Button
                        // A Custom Tab, not a WebView: the address bar stays
                        // visible and the page runs in the browser's own
                        // sandbox, so this app never sees the Google password.
                        CustomTabsIntent.Builder()
                            .setShowTitle(true)
                            .build()
                            .launchUrl(context, Uri.parse(url))
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    if (busy) {
                        CircularProgressIndicator(
                            Modifier.height(19.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                    } else {
                        Text("Continue with Google")
                    }
                }
            }

            if (error != null) QuietNote(error)

            OutlinedButton(
                onClick = onContinueWithoutAccount,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Continue without an account")
            }

            Spacer(Modifier.height(8.dp))
            Text(
                "TrustLens will never ask for your UPI PIN, an OTP, a password or a card number — " +
                    "not here, and not anywhere else in the app.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
        }
    }
}
