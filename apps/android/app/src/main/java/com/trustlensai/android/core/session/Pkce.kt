package com.trustlensai.android.core.session

import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom

/**
 * PKCE, for the OAuth flow.
 *
 * The authorisation code comes back to the app through a deep link, which any
 * other app on the device could in principle register for. PKCE is what makes
 * that safe: the code is worthless without the verifier, and the verifier
 * never leaves this process.
 *
 * Implemented here rather than taken from the Supabase Kotlin SDK on purpose.
 * The flow is about thirty lines and uses only platform primitives, and doing
 * it directly removes the SDK plus Ktor from the build — which on a phone is
 * a smaller APK and, more usefully, a much smaller surface to reason about on
 * the one code path that holds the user's session.
 */
object Pkce {

    /** RFC 7636 allows 43–128 characters; 64 random bytes lands inside that. */
    fun newVerifier(): String {
        val bytes = ByteArray(64)
        SecureRandom().nextBytes(bytes)
        return bytes.toUrlSafeBase64()
    }

    /**
     * The S256 challenge for a verifier.
     *
     * Only S256 is produced. The `plain` method is permitted by the spec and
     * is pointless — it sends the secret in the request it is supposed to
     * protect.
     */
    fun challengeFor(verifier: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest(verifier.toByteArray(Charsets.US_ASCII))
            .toUrlSafeBase64()

    /** Base64url with no padding, which is what the spec requires. */
    private fun ByteArray.toUrlSafeBase64(): String =
        Base64.encodeToString(this, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
}
