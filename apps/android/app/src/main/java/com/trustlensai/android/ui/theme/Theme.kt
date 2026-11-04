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

// Shared TrustLens brand palette. Keep app/tokens.css in sync with these values.
private val Midnight = Color(0xFF050B16)
private val DeepNavy = Color(0xFF0B1728)
private val PanelNavy = Color(0xFF101F33)
private val Paper = Color(0xFFF4F8FC)
private val Ink = Color(0xFF10243A)
private val Cyan = Color(0xFF31D5EE)
private val Teal = Color(0xFF087F9B)
private val Violet = Color(0xFF8B72FF)

val SeverityCritical = Color(0xFFFF8794)
val SeverityHigh = Color(0xFFC42E42)
val SeverityMedium = Color(0xFFF4C979)
val SeverityLow = Color(0xFF8295A9)
val SeverityNone = Color(0xFF8295A9)

private val LightColors = lightColorScheme(
    primary = Teal, onPrimary = Color.White, secondary = Color(0xFF6555B8),
    tertiary = Color(0xFF087F9B), background = Paper, onBackground = Ink,
    surface = Color.White, onSurface = Ink, surfaceVariant = Color(0xFFEAF1F8),
    onSurfaceVariant = Color(0xFF526A83), outline = Color(0xFFD7E3EF),
    error = Color(0xFFC42E42),
)
private val DarkColors = darkColorScheme(
    primary = Cyan, onPrimary = Midnight, secondary = Violet, tertiary = Cyan,
    background = Midnight, onBackground = Color(0xFFEAF5FF),
    surface = DeepNavy, onSurface = Color(0xFFEAF5FF),
    surfaceVariant = PanelNavy, onSurfaceVariant = Color(0xFFA4BCD2),
    outline = Color(0xFF203650), error = Color(0xFFFF8794),
)
private val TrustLensTypography = Typography(
    headlineLarge = TextStyle(fontSize = 32.sp,lineHeight = 38.sp,fontWeight = FontWeight.Bold,letterSpacing = (-1.2).sp),
    headlineSmall = TextStyle(fontSize = 23.sp,lineHeight = 29.sp,fontWeight = FontWeight.SemiBold,letterSpacing = (-.5).sp),
    titleLarge = TextStyle(fontSize = 20.sp,lineHeight = 26.sp,fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontSize = 16.sp,lineHeight = 22.sp,fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 16.sp,lineHeight = 24.sp),
    bodyMedium = TextStyle(fontSize = 14.sp,lineHeight = 21.sp),
    labelLarge = TextStyle(fontSize = 14.sp,lineHeight = 20.sp,fontWeight = FontWeight.SemiBold),
    labelSmall = TextStyle(fontSize = 12.sp,lineHeight = 16.sp,fontWeight = FontWeight.Medium,letterSpacing = .2.sp),
)

fun severityColor(severity: String?): Color = when (severity?.lowercase()) {
    "critical" -> SeverityCritical
    "high" -> SeverityHigh
    "medium" -> SeverityMedium
    "low" -> SeverityLow
    else -> SeverityNone
}
fun levelColor(level: String?): Color = when (level?.lowercase()) {
    "high_risk" -> Color(0xFFFF8794)
    "elevated_risk" -> Color(0xFFC42E42)
    "some_signals" -> Color(0xFFF4C979)
    else -> SeverityNone
}

@Composable
fun TrustLensTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) DarkColors else LightColors
    val context = LocalContext.current
    if (context is Activity) {
        SideEffect {
            WindowCompat.getInsetsController(context.window,context.window.decorView)
                .isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(context.window,context.window.decorView)
                .isAppearanceLightNavigationBars = !darkTheme
        }
    }
    MaterialTheme(colorScheme = colors,typography = TrustLensTypography,content = content)
}
