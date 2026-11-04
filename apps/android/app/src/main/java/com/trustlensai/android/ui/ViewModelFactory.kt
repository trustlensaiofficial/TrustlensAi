package com.trustlensai.android.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.trustlensai.android.TrustLensApplication

/** Manual factory, matching the manual wiring in TrustLensApplication. */
@Suppress("UNCHECKED_CAST")
class AnalysisViewModelFactory(private val app: TrustLensApplication) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        require(modelClass.isAssignableFrom(AnalysisViewModel::class.java)) {
            "Unknown ViewModel: ${modelClass.name}"
        }
        return AnalysisViewModel(app.api, app.consent, app.session) as T
    }
}
