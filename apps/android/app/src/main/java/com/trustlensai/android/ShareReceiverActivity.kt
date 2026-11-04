package com.trustlensai.android

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trustlensai.android.core.share.ShareExtractor
import com.trustlensai.android.core.share.SharedPayload
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.AnalysisViewModelFactory
import com.trustlensai.android.ui.screens.SharePreviewScreen
import com.trustlensai.android.ui.theme.TrustLensTheme

/**
 * Receives a share from another app.
 *
 * **Nothing is sent anywhere on arrival.** The shared content is shown to the
 * user first and only leaves the phone when they tap to check it. Silently
 * uploading a private message the moment someone taps a share target would be
 * indefensible, however convenient.
 *
 * What arrives is whatever the source app chose to put in the intent — which
 * for a messaging app is usually one message rather than the conversation, and
 * may be a caption without its image or an image without its caption. The
 * preview reports anything that could not be used rather than dropping it
 * quietly, because a confident verdict on half of what someone sent is the
 * worst outcome this screen can produce.
 */
class ShareReceiverActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val payload = readIntent(intent)
        val app = application as TrustLensApplication

        setContent {
            TrustLensTheme {
                val vm: AnalysisViewModel = viewModel(factory = AnalysisViewModelFactory(app))
                SharePreviewScreen(
                    payload = payload,
                    vm = vm,
                    onDismiss = { finish() },
                )
            }
        }
    }

    /**
     * Reads what Android actually handed over.
     *
     * The MIME type and size lookups are passed into the pure extractor rather
     * than performed inside it, which is what makes every rule in
     * `ShareExtractor` testable on the JVM without a device.
     */
    private fun readIntent(intent: Intent?): SharedPayload {
        if (intent == null) return SharedPayload()

        val text = when (intent.action) {
            // PROCESS_TEXT is a text selection inside another app.
            Intent.ACTION_PROCESS_TEXT -> intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
            else -> intent.getStringExtra(Intent.EXTRA_TEXT)
        }
        val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT)

        val uris: List<Uri> = when (intent.action) {
            Intent.ACTION_SEND ->
                listOfNotNull(intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java))
            Intent.ACTION_SEND_MULTIPLE ->
                intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java) ?: emptyList()
            else -> emptyList()
        }

        return ShareExtractor.build(
            text = text,
            subject = subject,
            uris = uris.map { it.toString() },
            mimeTypeOf = { raw -> runCatching { contentResolver.getType(Uri.parse(raw)) }.getOrNull() },
            sizeOf = { raw -> sizeOf(Uri.parse(raw)) },
        )
    }

    /** Size in bytes, or null when the provider does not report one. */
    private fun sizeOf(uri: Uri): Long? = runCatching {
        contentResolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (index >= 0 && cursor.moveToFirst() && !cursor.isNull(index)) cursor.getLong(index) else null
        }
    }.getOrNull()
}
