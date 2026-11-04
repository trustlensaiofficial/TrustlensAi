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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.trustlensai.android.ui.components.BulletList
import com.trustlensai.android.ui.components.SectionCard

/**
 * The first screen, and deliberately a privacy explanation rather than a
 * feature tour.
 *
 * It says what the app does *not* do, because that is the part people cannot
 * check for themselves and the part competitors overstate. No permission is
 * requested here — each one is asked for at the moment its feature is used.
 */
@Composable
fun OnboardingScreen(onContinue: () -> Unit) {
    Scaffold { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("TrustLens", style = MaterialTheme.typography.headlineLarge)
            Text(
                "Paste a message, a link or a payment code and TrustLens will tell you what it is " +
                    "trying to make you do with your money — which way the money would actually move, " +
                    "which words made it think so, and what it could not check.",
                style = MaterialTheme.typography.bodyLarge,
            )

            SectionCard("What stays on your phone") {
                BulletList(
                    listOf(
                        "Nothing is saved to any server unless you ask for it. Reports stay on this device.",
                        "A QR code is read here, on your phone. The picture is never uploaded — only the text inside the code.",
                        "Suspicious links are not opened unless you switch that on for a check.",
                        "Your message is not sent to any AI unless you switch that on for a check.",
                    ),
                )
            }

            SectionCard("What TrustLens cannot do") {
                BulletList(
                    listOf(
                        "It cannot read your WhatsApp, Telegram or Signal messages. No app on Android can read those for you — you share the ones you want checked.",
                        "It cannot see your bank account, and it cannot tell you whether money has actually moved.",
                        "It cannot confirm that anyone is genuine. It can only tell you what the words and the payment code say.",
                        "It will never ask for your UPI PIN, an OTP, a password or a card number. Not once, for any reason.",
                    ),
                )
            }

            SectionCard("No account needed") {
                Text(
                    "You can check a message right now without signing in. An account only adds saved " +
                        "cases across devices, and you can add one later.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            Spacer(Modifier.height(4.dp))
            Button(onClick = onContinue, modifier = Modifier.fillMaxWidth()) {
                Text("Start checking")
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}
