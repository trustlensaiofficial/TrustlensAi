package com.trustlensai.android.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trustlensai.android.ui.AnalysisUiState
import com.trustlensai.android.ui.AnalysisViewModel
import com.trustlensai.android.ui.components.QuietNote

@Composable
fun HomeScreen(
    vm: AnalysisViewModel,
    onOpenReport: () -> Unit,
    onOpenIncident: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenQr: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val consent by vm.consent.collectAsState()
    var input by remember { mutableStateOf("") }
    var entered by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { entered = true }
    LaunchedEffect(state) { if (state is AnalysisUiState.Loaded) onOpenReport() }

    Scaffold(containerColor = MaterialTheme.colorScheme.background) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Row(Modifier.fillMaxWidth(),verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(42.dp).clip(RoundedCornerShape(14.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFF31D5EE),Color(0xFF8B72FF)))),
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Outlined.Security,null,tint=Color(0xFF051321),modifier=Modifier.size(25.dp)) }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(1.dp)) {
                    Text("TRUSTLENS",style=MaterialTheme.typography.titleMedium,letterSpacing=1.8.sp,fontWeight=FontWeight.Black)
                    Text("PERSONAL THREAT PROTECTION",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant,letterSpacing=1.sp)
                }
                IconButton(onClick=onOpenSettings) { Icon(Icons.Outlined.Settings,contentDescription="Settings") }
            }

            AnimatedVisibility(visible=entered,enter=fadeIn(tween(520))+slideInVertically(tween(520, easing=FastOutSlowInEasing)){it/5}) {
                Column(verticalArrangement=Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                        Box(Modifier.size(7.dp).clip(CircleShape).background(Color(0xFF31D5EE)))
                        Text("YOUR DIGITAL SAFETY, IN ONE PLACE",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.primary,letterSpacing=1.2.sp,fontWeight=FontWeight.Bold)
                    }
                    Text("Pause. Verify.\nThen act.",style=MaterialTheme.typography.headlineLarge)
                    Text("A message feels urgent. TrustLens gives you a moment to understand what it is asking you to do — before you do it.",style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    Card(
                        shape=RoundedCornerShape(26.dp),
                        colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),
                        elevation=CardDefaults.cardElevation(defaultElevation=4.dp),
                    ) {
                        Box(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Color(0xFF0B2437),Color(0xFF142541),Color(0xFF252044)))).padding(18.dp)) {
                            Column(verticalArrangement=Arrangement.spacedBy(10.dp)) {
                                Row(verticalAlignment=Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.Security,null,tint=Color(0xFF31D5EE),modifier=Modifier.size(18.dp))
                                    Spacer(Modifier.width(7.dp))
                                    Text("TRUSTLENS INTELLIGENCE",style=MaterialTheme.typography.labelSmall,color=Color(0xFFB5EFFF),letterSpacing=1.sp)
                                    Spacer(Modifier.weight(1f))
                                    Text("READY",style=MaterialTheme.typography.labelSmall,color=Color(0xFF78D9D2),fontWeight=FontWeight.Bold)
                                }
                                Text("Check before you trust.",style=MaterialTheme.typography.titleLarge,color=Color.White)
                                Text("Messages  ·  Links  ·  QR payment requests",style=MaterialTheme.typography.bodySmall,color=Color(0xFFB8C9DC))
                                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                                    FeaturePill("MESSAGE",Icons.Outlined.Link)
                                    FeaturePill("PAYMENT",Icons.Outlined.Security)
                                    FeaturePill("QR",Icons.Outlined.QrCodeScanner)
                                }
                            }
                        }
                    }
                }
            }

            AnimatedVisibility(visible=entered,enter=fadeIn(tween(650,delayMillis=100))+slideInVertically(tween(650,delayMillis=100)){it/7}) {
                Column(verticalArrangement=Arrangement.spacedBy(10.dp)) {
                    Column(verticalArrangement=Arrangement.spacedBy(4.dp)) {
                        Text("Start an investigation",style=MaterialTheme.typography.titleLarge)
                        Text("Paste the exact message or link. Nothing is checked until you choose.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    OutlinedTextField(
                        value=input,onValueChange={input=it},modifier=Modifier.fillMaxWidth().height(154.dp).animateContentSize(),
                        label={Text("Message, link or payment request")},
                        placeholder={Text("Paste the message here…")},
                        supportingText={Text("You can also share content to TrustLens from another app.")},
                        shape=RoundedCornerShape(18.dp),
                    )
                    Card(colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surfaceVariant),shape=RoundedCornerShape(16.dp)) {
                        Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                            Text("YOUR PRIVACY CONTROLS",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.primary,letterSpacing=1.sp,fontWeight=FontWeight.Bold)
                            ConsentRow("Remote link checks","Only if you allow a remote destination check.",consent.liveChecks,vm::setLiveChecks)
                            ConsentRow("AI explanation","Sends the text to the configured AI provider.",consent.cloudAi,vm::setCloudAi)
                            if(consent.isMinimal) Text("Both options are off. Your pasted text stays on this phone unless you initiate a check.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    Button(
                        onClick={vm.analyse(input)},enabled=input.isNotBlank()&&state !is AnalysisUiState.Loading,
                        modifier=Modifier.fillMaxWidth().height(54.dp),
                        shape=RoundedCornerShape(16.dp),
                        colors=ButtonDefaults.buttonColors(containerColor=MaterialTheme.colorScheme.primary,contentColor=MaterialTheme.colorScheme.onPrimary),
                    ) {
                        if(state is AnalysisUiState.Loading) CircularProgressIndicator(Modifier.size(19.dp),strokeWidth=2.dp,color=MaterialTheme.colorScheme.onPrimary)
                        else { Text("Analyse with TrustLens",fontWeight=FontWeight.Bold);Spacer(Modifier.width(8.dp));Icon(Icons.Outlined.ArrowForward,null) }
                    }
                    when(val s=state) {
                        is AnalysisUiState.Invalid -> QuietNote(s.message)
                        is AnalysisUiState.RateLimited -> QuietNote("Too many checks just now. Try again in ${s.retryAfterSeconds} seconds.")
                        is AnalysisUiState.Unavailable -> QuietNote(s.reason)
                        AnalysisUiState.Offline -> QuietNote("This phone is offline. Existing reports remain available.")
                        is AnalysisUiState.Failed -> QuietNote(s.message)
                        else -> Unit
                    }
                }
            }

            AnimatedVisibility(visible=entered,enter=fadeIn(tween(700,delayMillis=180))+slideInVertically(tween(700,delayMillis=180)){it/8}) {
                Column(verticalArrangement=Arrangement.spacedBy(10.dp)) {
                    // The scanner reads the code on this phone; the image never
                    // leaves it. Separate from the paste field because someone
                    // holding a printed QR has nothing to paste.
                    OutlinedButton(onClick=onOpenQr,modifier=Modifier.fillMaxWidth().height(52.dp),shape=RoundedCornerShape(16.dp)) {
                        Icon(Icons.Outlined.QrCodeScanner,null,tint=MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(8.dp))
                        Text("Scan a payment code")
                    }
                    OutlinedButton(onClick=onOpenIncident,modifier=Modifier.fillMaxWidth().height(52.dp),shape=RoundedCornerShape(16.dp)) {
                        Icon(Icons.Outlined.WarningAmber,null,tint=MaterialTheme.colorScheme.error)
                        Spacer(Modifier.width(8.dp))
                        Text("I already shared money or information")
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun FeaturePill(label:String,icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(Modifier.clip(CircleShape).background(Color.White.copy(alpha=.09f)).padding(horizontal=10.dp,vertical=7.dp),verticalAlignment=Alignment.CenterVertically) {
        Icon(icon,null,tint=Color(0xFF7FE8F5),modifier=Modifier.size(13.dp))
        Spacer(Modifier.width(5.dp))
        Text(label,style=MaterialTheme.typography.labelSmall,color=Color.White)
    }
}
@Composable
private fun ConsentRow(title:String,detail:String,checked:Boolean,onChange:(Boolean)->Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical=3.dp),verticalAlignment=Alignment.CenterVertically) {
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(2.dp)) {
            Text(title,style=MaterialTheme.typography.labelLarge)
            Text(detail,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked=checked,onCheckedChange=onChange)
    }
}
