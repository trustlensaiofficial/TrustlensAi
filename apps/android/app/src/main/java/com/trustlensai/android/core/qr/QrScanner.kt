package com.trustlensai.android.core.qr

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * On-device barcode decoding.
 *
 * Everything here runs on the phone. ML Kit's barcode model is bundled, so no
 * image and no frame ever leaves the device — only the decoded string, and
 * only once the user has seen it and asked for a check. That is the whole
 * reason to decode locally rather than uploading a photo.
 *
 * Deliberately limited to QR and Data Matrix. A product barcode on a packet of
 * biscuits is not a payment instruction, and scanning for every format would
 * mean more false triggers for no benefit.
 */
object QrScanner {

    private val options = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_DATA_MATRIX)
        .build()

    fun newScanner(): BarcodeScanner = BarcodeScanning.getClient(options)

    /**
     * Decodes an image the user picked, rather than a camera frame.
     *
     * Offered alongside the camera because the camera permission is the one
     * people are most reluctant to grant — and a screenshot of a QR code is
     * the common case anyway, since these arrive inside messages.
     */
    suspend fun decodeImage(context: Context, uri: Uri): String? {
        val scanner = newScanner()
        return try {
            val image = InputImage.fromFilePath(context, uri)
            awaitBarcodes(scanner, image).firstPayload()
        } catch (_: Exception) {
            // An unreadable image is a null result, not a crash. The caller
            // tells the user it could not be read.
            null
        } finally {
            scanner.close()
        }
    }

    /**
     * An analyser for the live camera preview.
     *
     * `onPayload` fires at most once: the scanner is closed and further frames
     * ignored after the first decode, so a code held in frame does not fire
     * forty times a second and race the navigation.
     */
    @OptIn(ExperimentalGetImage::class)
    fun analyser(executor: Executor, onPayload: (String) -> Unit): ImageAnalysis.Analyzer {
        val scanner = newScanner()
        var done = false

        return ImageAnalysis.Analyzer { proxy: ImageProxy ->
            if (done) {
                proxy.close()
                return@Analyzer
            }
            val media = proxy.image
            if (media == null) {
                proxy.close()
                return@Analyzer
            }
            val image = InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees)
            scanner.process(image)
                .addOnSuccessListener(executor) { barcodes ->
                    val payload = barcodes.firstPayload()
                    if (payload != null && !done) {
                        done = true
                        scanner.close()
                        onPayload(payload)
                    }
                }
                .addOnCompleteListener(executor) { proxy.close() }
        }
    }

    private fun List<Barcode>.firstPayload(): String? =
        firstNotNullOfOrNull { it.rawValue?.takeIf { v -> v.isNotBlank() } }

    private suspend fun awaitBarcodes(scanner: BarcodeScanner, image: InputImage): List<Barcode> =
        suspendCancellableCoroutine { cont ->
            scanner.process(image)
                .addOnSuccessListener { cont.resume(it) }
                .addOnFailureListener { cont.resumeWithException(it) }
        }
}
