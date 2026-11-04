package com.trustlensai.android.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

/**
 * Severity colours are defined once, here, and are the only place a verdict
 * acquires a colour.
 *
 * Deliberately no green anywhere. There is no "safe" assessment level, so
 * there is no colour for one — a green badge is the single most misleading
 * thing this interface could show, and omitting the colour makes it
 * impossible to add by accident.
 */
private val Ink = Color(0xFF0B1221)
private val Paper = Color(0xFFF7F8FB)
private val Accent = Color(0xFF3C6FD4)
private val AccentDark = Color(0xFF6AA6FF)

val SeverityCritical = Color(0xFFB3261E)
val SeverityHigh = Color(0xFFC2410C)
val SeverityMedium = Color(0xFF9A6700)
val SeverityLow = Color(0xFF5B6478)
/** For "no signals matched" — neutral, never reassuring. */
val SeverityNone = Color(0xFF5B6478)

private val LightColors = lightColorScheme(
    primary = Accent,
    onPrimary = Color.White,
    background = Paper,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE9ECF3),
    onSurfaceVariant = Color(0xFF414B60),
    error = SeverityCritical,
)

private val DarkColors = darkColorScheme(
    primary = AccentDark,
    onPrimary = Ink,
    background = Ink,
    onBackground = Color(0xFFE8EBF2),
    surface = Color(0xFF141C2E),
    onSurface = Color(0xFFE8EBF2),
    surfaceVariant = Color(0xFF1E2941),
    onSurfaceVariant = Color(0xFFB4BECF),
    error = Color(0xFFFF8A80),
)

private val TrustLensTypography = Typography(
    // The verdict. Large because it is read under stress, and the one thing
    // someone must be able to take in at a glance.
    headlineLarge = TextStyle(fontSize = 28.sp, lineHeight = 34.sp, fontWeight = FontWeight.SemiBold),
    headlineSmall = TextStyle(fontSize = 20.sp, lineHeight = 26.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 16.sp, lineHeight = 22.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 21.sp),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Medium),
    labelSmall = TextStyle(fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.Medium),
)

/** The colour for a severity word from the API. Unknown values stay neutral. */
fun severityColor(severity: String?): Color = when (severity?.lowercase()) {
    "critical" -> SeverityCritical
    "high" -> SeverityHigh
    "medium" -> SeverityMedium
    "low" -> SeverityLow
    else -> SeverityNone
}

/**
 * The colour for an assessment level.
 *
 * `no_signals_detected` is neutral grey, never green: our checks not matching
 * is not a verification, and the colour must not say otherwise.
 */
fun levelColor(level: String?): Color = when (level?.lowercase()) {
    "high_risk" -> SeverityCritical
    "elevated_risk" -> SeverityHigh
    "some_signals" -> SeverityMedium
    else -> SeverityNone
}

@Composable
fun TrustLensTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    val view = LocalContext.current

    if (view is Activity) {
        SideEffect {
            WindowCompat.getInsetsController(view.window, view.window.decorView)
                .isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(colorScheme = colors, typography = TrustLensTypography, content = content)
}
