package com.trustlensai.android.core.consent

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

/**
 * Per-capability consent, stored on the device.
 *
 * Everything that sends data anywhere is **off until the person turns it on**,
 * and each switch is independent — declining cloud AI must not disable the
 * deterministic rules, because those are the product.
 *
 * The defaults below are not a UX preference. They are the product's privacy
 * position expressed in code: a fresh install analyses text locally against
 * the server's fixed rules and contacts nothing else.
 *
 * Server-side consent receipts (`consent_receipts`, versioned and append-only)
 * are the durable record for a signed-in user. This store is what the app
 * needs before any account exists.
 */
class ConsentStore(private val context: Context) {

    companion object {
        /** Contacts a suspicious link from the server. */
        private val LIVE_CHECKS = booleanPreferencesKey("consent_live_checks")

        /** Sends the message text to a model provider. */
        private val CLOUD_AI = booleanPreferencesKey("consent_cloud_ai")

        /** Stores a copy of the report against the account. */
        private val ACCOUNT_SYNC = booleanPreferencesKey("consent_account_sync")

        /** Whether the first-run privacy explanation has been seen. */
        private val ONBOARDED = booleanPreferencesKey("onboarded")

        /**
         * The disclosure wording these answers were given against.
         *
         * Bumping this means consent is asked again, because consent to older
         * wording is not consent to newer wording. The server-side receipt
         * records the same value.
         */
        const val POLICY_VERSION = "2026-11-04"
    }

    private val Context.dataStore by preferencesDataStore(name = "trustlens_consent")

    /** Reads fall back to the defaults if the store is unreadable. */
    private fun <T> read(selector: (Preferences) -> T): Flow<T> =
        context.dataStore.data.catch { emit(emptyPreferences()) }.map(selector)

    val liveChecks: Flow<Boolean> = read { it[LIVE_CHECKS] ?: false }
    val cloudAi: Flow<Boolean> = read { it[CLOUD_AI] ?: false }
    val accountSync: Flow<Boolean> = read { it[ACCOUNT_SYNC] ?: false }
    val onboarded: Flow<Boolean> = read { it[ONBOARDED] ?: false }

    val all: Flow<ConsentState> = read {
        ConsentState(
            liveChecks = it[LIVE_CHECKS] ?: false,
            cloudAi = it[CLOUD_AI] ?: false,
            accountSync = it[ACCOUNT_SYNC] ?: false,
            onboarded = it[ONBOARDED] ?: false,
        )
    }

    suspend fun setLiveChecks(value: Boolean) = context.dataStore.edit { it[LIVE_CHECKS] = value }
    suspend fun setCloudAi(value: Boolean) = context.dataStore.edit { it[CLOUD_AI] = value }
    suspend fun setAccountSync(value: Boolean) = context.dataStore.edit { it[ACCOUNT_SYNC] = value }
    suspend fun setOnboarded(value: Boolean) = context.dataStore.edit { it[ONBOARDED] = value }

    /**
     * Withdraws everything at once.
     *
     * A single, findable way back to the default state. Someone who has
     * changed their mind should not have to hunt through a settings list.
     */
    suspend fun revokeAll() = context.dataStore.edit {
        it[LIVE_CHECKS] = false
        it[CLOUD_AI] = false
        it[ACCOUNT_SYNC] = false
    }
}

/** The whole consent position, for a screen that renders all of it at once. */
data class ConsentState(
    val liveChecks: Boolean = false,
    val cloudAi: Boolean = false,
    val accountSync: Boolean = false,
    val onboarded: Boolean = false,
) {
    /** True when nothing leaves the device beyond the text being analysed. */
    val isMinimal: Boolean get() = !liveChecks && !cloudAi && !accountSync
}
