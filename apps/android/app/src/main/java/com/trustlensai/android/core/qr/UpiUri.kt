package com.trustlensai.android.core.qr

/**
 * Reads a `upi://` deep link so the app can show the user what a scanned code
 * actually contains, before anything is sent anywhere.
 *
 * **This does not decide risk.** That is the server's job, and deliberately
 * so: if this app judged a payment instruction independently then a backend
 * fix for a false positive would never reach an installed copy, and the two
 * could disagree on screen. See `docs/FRONTEND_HANDOFF.md` §1.
 *
 * What it is for is the confirmation step. Someone pointing a camera at a
 * sticker in a shop deserves to see "this would pay ₹2,499 to refunds@okaxis"
 * before a single byte leaves the phone — and that sentence requires parsing,
 * not analysis.
 *
 * It also never initiates, approves or cancels a payment, and never asks for
 * a PIN. There is no code path here that could.
 */
data class UpiUri(
    /** pay | collect | mandate */
    val mode: String,
    /** The address that would be credited. */
    val payeeVpa: String?,
    /**
     * The display name inside the URI.
     *
     * Chosen by whoever created the code, verified by nobody. Rendered as a
     * quoted claim and never as an identity — "State Bank Of India" in this
     * field means only that someone typed it.
     */
    val payeeName: String?,
    val amount: String?,
    val currency: String?,
    val note: String?,
    /** The raw string, so the server reads exactly what the camera saw. */
    val raw: String,
) {
    /** True when the mechanism would debit the reader. */
    val userWouldPay: Boolean
        get() = mode == "pay" || mode == "collect" || mode == "mandate"
}

object UpiParser {

    private val PATTERN = Regex(
        """\bupi://(pay|collect|mandate)\?([^\s"'<>]+)""",
        RegexOption.IGNORE_CASE,
    )

    /**
     * Parses a scanned payload.
     *
     * Returns null rather than guessing when the scheme is absent — a
     * half-read payment instruction is worse than none, because the reader
     * would act on it.
     */
    fun parse(payload: String?): UpiUri? {
        if (payload.isNullOrBlank()) return null
        val match = PATTERN.find(payload) ?: return null
        val mode = match.groupValues.getOrNull(1)?.lowercase() ?: return null
        val query = match.groupValues.getOrNull(2) ?: return null

        val params = parseQuery(query)
        fun get(key: String): String? = params[key]?.takeIf { it.isNotBlank() }

        return UpiUri(
            mode = mode,
            payeeVpa = get("pa"),
            payeeName = get("pn"),
            amount = get("am"),
            // A UPI amount without a currency is rupees in practice, but only
            // say so when an amount was actually present.
            currency = get("cu") ?: get("am")?.let { "INR" },
            note = get("tn"),
            raw = match.value,
        )
    }

    /** True for any payload worth sending for analysis as a payment code. */
    fun looksLikePayment(payload: String?): Boolean = parse(payload) != null

    /**
     * Splits a query string without java.net.URI, which rejects some real UPI
     * codes outright — unencoded spaces in a payee name are common in the wild,
     * and a parser that throws there would leave the user with nothing.
     */
    private fun parseQuery(query: String): Map<String, String> {
        val out = LinkedHashMap<String, String>()
        for (pair in query.split('&')) {
            if (pair.isEmpty()) continue
            val eq = pair.indexOf('=')
            if (eq <= 0) continue
            val key = pair.substring(0, eq).lowercase()
            val value = pair.substring(eq + 1)
            // First occurrence wins: a duplicated parameter is a known trick
            // for showing one amount and sending another.
            if (!out.containsKey(key)) out[key] = decode(value)
        }
        return out
    }

    /** Percent-decoding, tolerant of a stray `%` that is not an escape. */
    private fun decode(value: String): String {
        if (!value.contains('%') && !value.contains('+')) return value
        val sb = StringBuilder(value.length)
        var i = 0
        while (i < value.length) {
            val c = value[i]
            when {
                c == '+' -> {
                    sb.append(' ')
                    i += 1
                }
                c == '%' && i + 2 < value.length -> {
                    val hex = value.substring(i + 1, i + 3)
                    val byte = hex.toIntOrNull(16)
                    if (byte != null) {
                        sb.append(byte.toChar())
                        i += 3
                    } else {
                        sb.append(c)
                        i += 1
                    }
                }
                else -> {
                    sb.append(c)
                    i += 1
                }
            }
        }
        return sb.toString()
    }
}
