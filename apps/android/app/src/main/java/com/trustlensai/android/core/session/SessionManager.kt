package com.trustlensai.android.core.session

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.trustlensai.android.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * The signed-in session.
 *
 * Google sign-in goes through Supabase's own OAuth endpoint in a Custom Tab,
 * with PKCE, and the authorisation code returns on a deep link. That route was
 * chosen over native Credential Manager for a practical reason: Credential
 * Manager needs its own Android OAuth client registered against the signing
 * certificate's SHA-1 fingerprint, and there is no release keystore yet. This
 * flow reuses the Google provider already configured in Supabase and the
 * existing callback URL, so the only dashboard change it needs is one
 * redirect entry.
 *
 * Tokens live in `EncryptedSharedPreferences`, backed by a key in the Android
 * Keystore. Not because a refresh token is a password, but because it is a
 * bearer credential for this person's cases, and plain SharedPreferences is
 * readable on a rooted device.
 *
 * What is never stored or sent: a password. There is none — Google OAuth only.
 */
class SessionManager(context: Context) {

    private val appContext = context.applicationContext

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private val prefs: SharedPreferences by lazy {
        val key = MasterKey.Builder(appContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            appContext,
            "trustlens_session",
            key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    private val _state = MutableStateFlow<SessionState>(SessionState.Unknown)
    val state: StateFlow<SessionState> = _state.asStateFlow()

    /** True when Supabase is configured at all. False means sign-in is impossible. */
    val configured: Boolean
        get() = BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_PUBLISHABLE_KEY.isNotBlank()

    companion object {
        /** Matches the intent filter in the manifest. */
        const val REDIRECT_URI = "trustlens://auth-callback"

        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_EXPIRES_AT = "expires_at"
        private const val KEY_EMAIL = "email"
        private const val KEY_VERIFIER = "pkce_verifier"

        /** Refresh this far before expiry, so a request never races the clock. */
        private const val REFRESH_MARGIN_SECONDS = 120L
    }

    /* ------------------------------------------------------------- startup */

    /** Restores a stored session. Called once at launch. */
    fun restore() {
        if (!configured) {
            _state.value = SessionState.Unconfigured
            return
        }
        val refresh = prefs.getString(KEY_REFRESH, null)
        val email = prefs.getString(KEY_EMAIL, null)
        _state.value = if (refresh == null) {
            SessionState.SignedOut
        } else {
            SessionState.SignedIn(email)
        }
    }

    /* --------------------------------------------------------- sign-in flow */

    /**
     * The URL to open in a Custom Tab.
     *
     * The verifier is stored before the browser opens, because the app may be
     * killed while it is in the foreground and the code is useless without it.
     */
    fun buildAuthorizeUrl(): String? {
        if (!configured) return null
        val verifier = Pkce.newVerifier()
        prefs.edit().putString(KEY_VERIFIER, verifier).apply()

        val base = BuildConfig.SUPABASE_URL.trimEnd('/')
        val challenge = Pkce.challengeFor(verifier)
        return "$base/auth/v1/authorize" +
            "?provider=google" +
            "&redirect_to=${encode(REDIRECT_URI)}" +
            "&code_challenge=${encode(challenge)}" +
            "&code_challenge_method=s256"
    }

    /**
     * Exchanges the authorisation code for a session.
     *
     * The verifier is cleared whatever happens: a code exchange is single-use,
     * and keeping a stale verifier around only invites a confusing second
     * failure.
     */
    suspend fun completeSignIn(code: String): Result<Unit> = withContext(Dispatchers.IO) {
        if (!configured) return@withContext Result.failure(IllegalStateException("Supabase is not configured in this build."))
        val verifier = prefs.getString(KEY_VERIFIER, null)
            ?: return@withContext Result.failure(IllegalStateException("This sign-in did not start in this app."))
        prefs.edit().remove(KEY_VERIFIER).apply()

        val body = json.encodeToString(PkceExchange.serializer(), PkceExchange(authCode = code, codeVerifier = verifier))
        post("/auth/v1/token?grant_type=pkce", body).map { persist(it) }
    }

    /* ------------------------------------------------------------- tokens */

    /**
     * A usable access token, refreshing first if it is close to expiry.
     *
     * Returns null rather than throwing when there is no session, because
     * "not signed in" is an ordinary state on every screen that calls this.
     */
    suspend fun accessToken(): String? = withContext(Dispatchers.IO) {
        if (!configured) return@withContext null
        val access = prefs.getString(KEY_ACCESS, null)
        val expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L)
        val now = System.currentTimeMillis() / 1000

        if (access != null && expiresAt - now > REFRESH_MARGIN_SECONDS) return@withContext access

        val refresh = prefs.getString(KEY_REFRESH, null) ?: return@withContext null
        val body = json.encodeToString(RefreshExchange.serializer(), RefreshExchange(refresh))
        post("/auth/v1/token?grant_type=refresh_token", body)
            .fold(
                onSuccess = { persist(it); prefs.getString(KEY_ACCESS, null) },
                onFailure = {
                    /*
                     * A refresh token that the server rejects is finished —
                     * revoked, expired, or rotated. Clearing it turns a silent
                     * loop of 401s into one honest "please sign in again".
                     */
                    if (it is RefreshRejected) clear()
                    null
                },
            )
    }

    /** `Bearer <token>`, or null when there is no session. */
    suspend fun bearer(): String? = accessToken()?.let { "Bearer $it" }

    /* ------------------------------------------------------------ sign-out */

    /**
     * Signs out locally, and tells the server if it can.
     *
     * The local clear happens regardless. A network failure must never leave
     * someone still signed in on a device they are trying to sign out of.
     */
    suspend fun signOut() = withContext(Dispatchers.IO) {
        val access = prefs.getString(KEY_ACCESS, null)
        clear()
        if (access != null && configured) {
            runCatching {
                http.newCall(
                    Request.Builder()
                        .url("${BuildConfig.SUPABASE_URL.trimEnd('/')}/auth/v1/logout")
                        .addHeader("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                        .addHeader("Authorization", "Bearer $access")
                        .post(ByteArray(0).toRequestBody())
                        .build(),
                ).execute().close()
            }
        }
    }

    private fun clear() {
        prefs.edit().clear().apply()
        _state.value = SessionState.SignedOut
    }

    /* ------------------------------------------------------------ internals */

    private fun post(path: String, body: String): Result<TokenResponse> {
        val request = Request.Builder()
            .url("${BuildConfig.SUPABASE_URL.trimEnd('/')}$path")
            .addHeader("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            .addHeader("Content-Type", "application/json")
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()

        return try {
            http.newCall(request).execute().use { response ->
                val text = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    // 400 on a refresh means the token is finished, not that
                    // the network failed. The caller treats those differently.
                    return if (response.code == 400 || response.code == 401) {
                        Result.failure(RefreshRejected(response.code))
                    } else {
                        Result.failure(IOException("Sign-in failed (${response.code})."))
                    }
                }
                Result.success(json.decodeFromString(TokenResponse.serializer(), text))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun persist(token: TokenResponse) {
        val expiresAt = token.expiresAt ?: (System.currentTimeMillis() / 1000 + (token.expiresIn ?: 3600))
        prefs.edit()
            .putString(KEY_ACCESS, token.accessToken)
            .putString(KEY_REFRESH, token.refreshToken)
            .putLong(KEY_EXPIRES_AT, expiresAt)
            .apply()
        token.user?.email?.let { prefs.edit().putString(KEY_EMAIL, it).apply() }
        _state.value = SessionState.SignedIn(token.user?.email ?: prefs.getString(KEY_EMAIL, null))
    }

    private fun encode(value: String): String = java.net.URLEncoder.encode(value, "UTF-8")
}

/** Distinguishes "this token is finished" from "the network failed". */
class RefreshRejected(val code: Int) : IOException("The session was rejected ($code).")

sealed interface SessionState {
    /** Before `restore()` has run. */
    data object Unknown : SessionState

    /** No Supabase configuration in this build, so sign-in cannot be offered. */
    data object Unconfigured : SessionState

    data object SignedOut : SessionState

    data class SignedIn(val email: String?) : SessionState
}

/* ------------------------------------------------------------- wire types */

@Serializable
private data class PkceExchange(
    @SerialName("auth_code") val authCode: String,
    @SerialName("code_verifier") val codeVerifier: String,
)

@Serializable
private data class RefreshExchange(@SerialName("refresh_token") val refreshToken: String)

@Serializable
private data class TokenResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expires_in") val expiresIn: Long? = null,
    @SerialName("expires_at") val expiresAt: Long? = null,
    val user: AuthUser? = null,
)

@Serializable
private data class AuthUser(val id: String? = null, val email: String? = null)
