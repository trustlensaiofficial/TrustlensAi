package com.trustlensai.android.core.share

/**
 * What another app actually handed us.
 *
 * The important word is *actually*. A share from WhatsApp is not the
 * conversation — it is whatever that app chose to put in the intent, which may
 * be one message, a quoted fragment, a caption without its image, or an image
 * without its caption. `docs/PLATFORM_CAPABILITIES.md` is explicit that we
 * analyse only what Android provides, and this type is where that honesty has
 * to start: it records what arrived and what did not, rather than implying a
 * complete capture.
 *
 * Nothing here is uploaded automatically. The share screen shows this to the
 * user first, because silently sending a private message to a server the
 * moment someone taps a share target would be indefensible.
 */
data class SharedPayload(
    /** Text the source app provided, trimmed. Null when it sent none. */
    val text: String? = null,
    /** A subject line, where the source app sets one (commonly email). */
    val subject: String? = null,
    /** Links found in the text, in order, de-duplicated. */
    val urls: List<String> = emptyList(),
    /** Content URIs for images, as strings. Never read until the user agrees. */
    val imageUris: List<String> = emptyList(),
    /**
     * Things the share referenced but we cannot use — an unsupported MIME
     * type, an attachment we were not granted, a file over the size cap.
     *
     * Rendered to the user. A share that silently dropped half of what they
     * sent, and then produced a confident verdict on the remainder, would be
     * the worst possible outcome.
     */
    val skipped: List<String> = emptyList(),
) {
    val hasAnything: Boolean
        get() = !text.isNullOrBlank() || imageUris.isNotEmpty()

    /** The text to analyse: the body, with the subject prepended if present. */
    fun analysableText(): String? {
        val body = text?.trim().orEmpty()
        val subj = subject?.trim().orEmpty()
        return when {
            body.isEmpty() && subj.isEmpty() -> null
            subj.isEmpty() -> body
            body.isEmpty() -> subj
            // The subject often carries the lure ("Your account is blocked"),
            // so it is analysed, but kept distinguishable from the body.
            else -> "$subj\n\n$body"
        }
    }
}

object ShareExtractor {

    /** MIME types the app can do something useful with. */
    private val SUPPORTED_IMAGE = setOf("image/jpeg", "image/png", "image/webp", "image/heic", "image/heif")

    /** Images beyond this are refused rather than silently resized. */
    const val MAX_IMAGE_BYTES: Long = 12L * 1024 * 1024

    private const val MAX_TEXT_CHARS = 20_000

    /**
     * Matches http(s) links.
     *
     * Deliberately conservative: trailing punctuation is excluded so a URL at
     * the end of a sentence does not acquire the full stop, which would make
     * every lookalike-domain comparison wrong.
     */
    private val URL_PATTERN = Regex(
        """https?://[^\s<>"'\\^`{|}]+""",
        RegexOption.IGNORE_CASE,
    )

    private val TRAILING = setOf('.', ',', ';', ':', '!', '?', ')', ']', '}', '"', '\'', '>', '…')

    /**
     * Builds a payload from the parts of an intent.
     *
     * Pure on purpose — no Intent, no ContentResolver — so every rule below is
     * covered by ordinary JVM tests rather than needing a device.
     *
     * @param uris content URIs the intent carried
     * @param mimeTypeOf resolves a URI's MIME type; null when unknown
     * @param sizeOf resolves a URI's size in bytes; null when unknown
     */
    fun build(
        text: String?,
        subject: String? = null,
        uris: List<String> = emptyList(),
        mimeTypeOf: (String) -> String? = { null },
        sizeOf: (String) -> Long? = { null },
    ): SharedPayload {
        val skipped = mutableListOf<String>()

        var body = text?.trim()?.takeIf { it.isNotEmpty() }
        if (body != null && body.length > MAX_TEXT_CHARS) {
            body = body.take(MAX_TEXT_CHARS)
            skipped += "The shared text was longer than $MAX_TEXT_CHARS characters, so only the beginning was kept."
        }

        val images = mutableListOf<String>()
        for (uri in uris) {
            val mime = mimeTypeOf(uri)
            when {
                mime == null -> skipped += "One attachment could not be read, so it was left out."
                !mime.startsWith("image/") ->
                    skipped += "An attachment of type $mime was left out: only images can be analysed."
                mime !in SUPPORTED_IMAGE ->
                    skipped += "An image of type $mime was left out because it cannot be decoded reliably."
                else -> {
                    val size = sizeOf(uri)
                    if (size != null && size > MAX_IMAGE_BYTES) {
                        skipped += "An image of ${size / (1024 * 1024)} MB was left out: the limit is ${MAX_IMAGE_BYTES / (1024 * 1024)} MB."
                    } else {
                        images += uri
                    }
                }
            }
        }

        return SharedPayload(
            text = body,
            subject = subject?.trim()?.takeIf { it.isNotEmpty() },
            urls = extractUrls(listOfNotNull(subject, body).joinToString("\n")),
            imageUris = images,
            skipped = skipped,
        )
    }

    /** Links in shared text, trailing punctuation removed, order preserved. */
    fun extractUrls(text: String?): List<String> {
        if (text.isNullOrBlank()) return emptyList()
        val out = LinkedHashSet<String>()
        for (m in URL_PATTERN.findAll(text)) {
            var url = m.value
            while (url.isNotEmpty() && url.last() in TRAILING) url = url.dropLast(1)
            // An unbalanced closing bracket usually came from the surrounding
            // prose rather than the link.
            if (url.endsWith(")") && !url.contains("(")) url = url.dropLast(1)
            if (url.length > "https://".length) out += url
        }
        return out.toList()
    }
}
