package com.trustlensai.android.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.trustlensai.android.core.consent.ConsentState
import com.trustlensai.android.core.consent.ConsentStore
import com.trustlensai.android.core.net.AnalysisRequest
import com.trustlensai.android.core.net.ApiResult
import com.trustlensai.android.core.net.Capability
import com.trustlensai.android.core.net.RecoveryPlan
import com.trustlensai.android.core.net.RecoveryPlanRequest
import com.trustlensai.android.core.net.Report
import com.trustlensai.android.core.net.TrustLensApi
import com.trustlensai.android.core.net.toApiResult
import com.trustlensai.android.core.qr.UpiParser
import com.trustlensai.android.core.qr.UpiUri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.IOException

/**
 * The states a screen must be able to render.
 *
 * `Degraded` is not in this list on purpose: a report whose AI commentary is
 * missing is still a complete report, so it arrives as `Loaded` carrying a
 * note. Treating it as an error state would hide the rules, the evidence and
 * the next steps, which are the parts that matter.
 */
sealed interface AnalysisUiState {
    data object Idle : AnalysisUiState
    data object Loading : AnalysisUiState
    data class Loaded(val report: Report, val storageNote: String?) : AnalysisUiState
    data class Invalid(val message: String) : AnalysisUiState
    data class RateLimited(val retryAfterSeconds: Int, val message: String) : AnalysisUiState
    data class Unavailable(val reason: String) : AnalysisUiState
    data object Offline : AnalysisUiState
    data class Failed(val message: String) : AnalysisUiState
}

class AnalysisViewModel(
    private val api: TrustLensApi,
    private val consentStore: ConsentStore,
) : ViewModel() {

    private val _state = MutableStateFlow<AnalysisUiState>(AnalysisUiState.Idle)
    val state: StateFlow<AnalysisUiState> = _state.asStateFlow()

    private val _consent = MutableStateFlow(ConsentState())
    val consent: StateFlow<ConsentState> = _consent.asStateFlow()

    private val _capabilities = MutableStateFlow<List<Capability>>(emptyList())
    val capabilities: StateFlow<List<Capability>> = _capabilities.asStateFlow()

    private val _plan = MutableStateFlow<RecoveryPlan?>(null)
    val plan: StateFlow<RecoveryPlan?> = _plan.asStateFlow()

    /** The decoded QR, held so it can be shown before anything is sent. */
    private val _scanned = MutableStateFlow<UpiUri?>(null)
    val scanned: StateFlow<UpiUri?> = _scanned.asStateFlow()

    init {
        viewModelScope.launch {
            consentStore.all.collect { _consent.value = it }
        }
    }

    fun setLiveChecks(value: Boolean) = viewModelScope.launch { consentStore.setLiveChecks(value) }
    fun setCloudAi(value: Boolean) = viewModelScope.launch { consentStore.setCloudAi(value) }
    fun setAccountSync(value: Boolean) = viewModelScope.launch { consentStore.setAccountSync(value) }
    fun completeOnboarding() = viewModelScope.launch { consentStore.setOnboarded(true) }
    fun revokeAll() = viewModelScope.launch { consentStore.revokeAll() }

    fun onQrDecoded(payload: String?) {
        _scanned.value = UpiParser.parse(payload)
    }

    fun clearScan() {
        _scanned.value = null
    }

    fun reset() {
        _state.value = AnalysisUiState.Idle
    }

    /**
     * Runs an analysis.
     *
     * The consent flags are read from the store at call time rather than
     * passed in by a screen, so a stale toggle on a recomposed UI can never
     * send data the user has since switched off.
     */
    fun analyse(text: String?, qrPayload: String? = null, context: String = "generic") {
        val body = text?.trim()
        if (body.isNullOrEmpty() && qrPayload.isNullOrEmpty()) {
            _state.value = AnalysisUiState.Invalid("There is nothing to check yet.")
            return
        }

        _state.value = AnalysisUiState.Loading
        viewModelScope.launch {
            val c = _consent.value
            val result = runCatching {
                api.analyse(
                    AnalysisRequest(
                        text = body,
                        context = context,
                        liveChecks = c.liveChecks,
                        allowCloudAi = c.cloudAi,
                        saveToAccount = c.accountSync,
                        qrPayload = qrPayload,
                    ),
                ).toApiResult()
            }.getOrElse { e ->
                if (e is IOException) ApiResult.Offline else ApiResult.Failed(e.message ?: "The analysis could not be completed.")
            }

            _state.value = when (result) {
                is ApiResult.Success -> AnalysisUiState.Loaded(result.value.report, result.value.storageNote)
                is ApiResult.Invalid -> AnalysisUiState.Invalid(result.message)
                is ApiResult.RateLimited -> AnalysisUiState.RateLimited(result.retryAfterSeconds, result.message)
                is ApiResult.Unavailable -> AnalysisUiState.Unavailable(result.reason)
                ApiResult.Offline -> AnalysisUiState.Offline
                ApiResult.NotFound -> AnalysisUiState.Failed("That is not available.")
                is ApiResult.Unauthorized -> AnalysisUiState.Failed(result.message)
                is ApiResult.Failed -> AnalysisUiState.Failed(result.message)
            }
        }
    }

    /** Fetches the honest per-platform capability list. */
    fun loadCapabilities() {
        viewModelScope.launch {
            val result = runCatching { api.capabilities().toApiResult() }.getOrNull()
            if (result is ApiResult.Success) _capabilities.value = result.value.capabilities
        }
    }

    /**
     * Fetches the plan for what the user says happened.
     *
     * Needs no account: someone whose money left ten minutes ago must not meet
     * a sign-in screen.
     */
    fun loadRecoveryPlan(actionState: String) {
        viewModelScope.launch {
            val result = runCatching { api.recoveryPlan(RecoveryPlanRequest(actionState)).toApiResult() }.getOrNull()
            if (result is ApiResult.Success) _plan.value = result.value.recoveryPlan
        }
    }

    fun clearPlan() {
        _plan.value = null
    }
}
