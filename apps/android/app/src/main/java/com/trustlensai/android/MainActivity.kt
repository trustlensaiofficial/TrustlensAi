package com.trustlensai.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.AnalysisViewModelFactory
import com.trustlensai.android.ui.TrustLensApp
import com.trustlensai.android.ui.theme.TrustLensTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as TrustLensApplication
        setContent {
            TrustLensTheme {
                val vm: AnalysisViewModel = viewModel(factory = AnalysisViewModelFactory(app))
                TrustLensApp(vm)
            }
        }
    }
}
