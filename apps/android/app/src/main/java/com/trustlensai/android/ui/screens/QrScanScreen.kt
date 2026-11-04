package com.trustlensai.android.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.trustlensai.android.core.qr.QrScanner
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.BulletList
import com.trustlensai.android.ui.components.QuietNote
import com.trustlensai.android.ui.components.SectionCard
import kotlinx.coroutines.launch

/**
 * Scanning a payment code.
 *
 * The camera permission is requested **here**, when the user opens this
 * screen — not at launch, and not bundled with anything else. Someone who
 * declines keeps a fully working screen: picking an image from the gallery
 * decodes exactly the same way, and in practice that is the common case
 * because these codes arrive inside messages as screenshots.
 *
 * The decoded contents are shown before anything is sent. A payment code is
 * the one input where a silent upload would be least forgivable: the string
 * names an account and an amount.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QrScanScreen(
    vm: AnalysisViewModel,
    onBack: () -> Unit,
    onAnalysed: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scanned by vm.scanned.collectAsState()

    var hasCamera by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED,
        )
    }
    var permissionRefused by remember { mutableStateOf(false) }
    var decodeFailed by remember { mutableStateOf(false) }
    var rawPayload by remember { mutableStateOf<String?>(null) }

    val askCamera = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        hasCamera = granted
        permissionRefused = !granted
    }

    // The photo picker needs no permission at all — the user chooses the file
    // and the system hands over just that one.
    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            val payload = QrScanner.decodeImage(context, uri)
            if (payload == null) {
                decodeFailed = true
            } else {
                decodeFailed = false
                rawPayload = payload
                vm.onQrDecoded(payload)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scan a payment code") },
                navigationIcon = {
                    IconButton(onClick = {
                        vm.clearScan()
                        onBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            val payload = rawPayload
            if (payload != null) {
                // Decoded. Show what it says, then let the user decide.
                SectionCard("What the code contains") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        val upi = scanned
                        if (upi == null) {
                            Text(
                                "This is not a payment code. It contains:",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Text(payload.take(300), style = MaterialTheme.typography.bodyMedium)
                        } else {
                            BulletList(
                                listOfNotNull(
                                    upi.payeeVpa?.let { "Would be paid to: $it" },
                                    upi.amount?.let { "Amount: ${upi.currency ?: "INR"} $it" },
                                    upi.payeeName?.let { "The code calls them “$it”, which no bank has checked." },
                                    "Type of request: ${upi.mode}",
                                ),
                            )
                            if (upi.userWouldPay) {
                                Text(
                                    "Scanning a code never brings money in. If you continue, this would take money out.",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.error,
                                )
                            }
                        }
                        Text(
                            "Nothing has been sent anywhere yet, and TrustLens cannot make a payment.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                Button(
                    onClick = {
                        vm.analyse(text = null, qrPayload = payload)
                        onAnalysed()
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Check this code")
                }
                OutlinedButton(
                    onClick = {
                        rawPayload = null
                        vm.clearScan()
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Scan something else")
                }
                return@Column
            }

            if (hasCamera) {
                Text("Point the camera at the code.", style = MaterialTheme.typography.bodyLarge)
                CameraPreview(
                    onPayload = { decoded ->
                        rawPayload = decoded
                        vm.onQrDecoded(decoded)
                    },
                    modifier = Modifier.fillMaxWidth().height(320.dp),
                )
            } else {
                QuietNote(
                    if (permissionRefused) {
                        "Camera access was declined, which is fine — choosing a screenshot below works exactly the same way, and most of these codes arrive as images anyway."
                    } else {
                        "TrustLens needs the camera only while this screen is open, and only to read the code. No photo is kept and no image is uploaded."
                    },
                )
                if (!permissionRefused) {
                    Button(
                        onClick = { askCamera.launch(Manifest.permission.CAMERA) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Allow the camera")
                    }
                }
            }

            OutlinedButton(
                onClick = {
                    pickImage.launch(
                        androidx.activity.result.PickVisualMediaRequest(
                            ActivityResultContracts.PickVisualMedia.ImageOnly,
                        ),
                    )
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Choose a screenshot instead")
            }

            if (decodeFailed) {
                QuietNote("No code could be read in that image. Try a clearer screenshot, or crop it to the code.")
            }

            Spacer(Modifier.height(8.dp))
            Text(
                "A code on its own is not proof of a scam. Plenty of genuine shops use them. " +
                    "What matters is which direction the money moves and who is being paid.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** The live preview, bound to the composable's lifecycle. */
@Composable
private fun CameraPreview(onPayload: (String) -> Unit, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }

    DisposableEffect(Unit) {
        val providerFuture = ProcessCameraProvider.getInstance(context)
        val executor = ContextCompat.getMainExecutor(context)
        var provider: ProcessCameraProvider? = null

        providerFuture.addListener({
            provider = providerFuture.get()
            val preview = Preview.Builder().build().also {
                it.surfaceProvider = previewView.surfaceProvider
            }
            val analysis = ImageAnalysis.Builder()
                // Dropping frames is correct here: one good decode is enough,
                // and queueing them would add latency for no benefit.
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { it.setAnalyzer(executor, QrScanner.analyser(executor, onPayload)) }

            runCatching {
                provider?.unbindAll()
                provider?.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            // Releasing the camera when the screen goes away is what keeps the
            // permission honest: it is in use only while this screen is open.
            runCatching { provider?.unbindAll() }
        }
    }

    Box(modifier) {
        AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
    }
}
