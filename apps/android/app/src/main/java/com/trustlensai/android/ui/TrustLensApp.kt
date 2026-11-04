package com.trustlensai.android.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.trustlensai.android.ui.screens.HomeScreen
import com.trustlensai.android.ui.screens.IncidentScreen
import com.trustlensai.android.ui.screens.OnboardingScreen
import com.trustlensai.android.ui.screens.ReportScreen
import com.trustlensai.android.ui.screens.SettingsScreen

object Routes {
    const val ONBOARDING = "onboarding"
    const val HOME = "home"
    const val REPORT = "report"
    const val INCIDENT = "incident"
    const val SETTINGS = "settings"
}

@Composable
fun TrustLensApp(vm: AnalysisViewModel) {
    val nav = rememberNavController()
    val consent by vm.consent.collectAsState()

    // Onboarding is the privacy explanation, so it leads on a fresh install.
    val start = if (consent.onboarded) Routes.HOME else Routes.ONBOARDING

    NavHost(navController = nav, startDestination = start) {
        composable(Routes.ONBOARDING) {
            OnboardingScreen(
                onContinue = {
                    vm.completeOnboarding()
                    nav.navigate(Routes.HOME) { popUpTo(Routes.ONBOARDING) { inclusive = true } }
                },
            )
        }
        composable(Routes.HOME) {
            HomeScreen(
                vm = vm,
                onOpenReport = { nav.navigate(Routes.REPORT) },
                onOpenIncident = { nav.navigate(Routes.INCIDENT) },
                onOpenSettings = { nav.navigate(Routes.SETTINGS) },
            )
        }
        composable(Routes.REPORT) {
            ReportScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
                onOpenIncident = { nav.navigate(Routes.INCIDENT) },
            )
        }
        composable(Routes.INCIDENT) {
            IncidentScreen(vm = vm, onBack = { nav.popBackStack() })
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(vm = vm, onBack = { nav.popBackStack() })
        }
    }
}
