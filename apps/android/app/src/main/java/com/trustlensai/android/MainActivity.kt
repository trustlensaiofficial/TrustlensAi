package com.trustlensai.android

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.ViewModelProvider
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.AnalysisViewModelFactory
import com.trustlensai.android.ui.TrustLensApp
import com.trustlensai.android.ui.theme.TrustLensTheme

class MainActivity : ComponentActivity() {

    private lateinit var viewModel: AnalysisViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as TrustLensApplication

        /*
         * Resolved here rather than with viewModel() inside setContent, so the
         * OAuth redirect can be handled before anything is composed — the
         * browser can return while this activity is being recreated.
         */
        viewModel = ViewModelProvider(this, AnalysisViewModelFactory(app))[AnalysisViewModel::class.java]
        handleAuthRedirect(intent)

        setContent {
            TrustLensTheme {
                TrustLensApp(viewModel)
            }
        }
    }

    /** launchMode is singleTask, so the redirect arrives here, not in onCreate. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAuthRedirect(intent)
    }

    /**
     * Takes the authorisation code off the deep link.
     *
     * Supabase returns an `error_description` instead of a code when the user
     * cancels or the provider refuses, and that is shown rather than swallowed
     * — a sign-in that silently does nothing is the most frustrating possible
     * outcome.
     */
    private fun handleAuthRedirect(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "trustlens" || data.host != "auth-callback") return

        val code = data.getQueryParameter("code")
        if (code != null) {
            viewModel.completeSignIn(code)
            return
        }
        val description = data.getQueryParameter("error_description")
            ?: data.getQueryParameter("error")
        if (description != null) {
            viewModel.reportAuthError(description.replace('+', ' '))
        }
    }
}
