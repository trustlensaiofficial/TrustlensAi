package ai.trustlens.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val BG=Color(0xFF070B1A); private val PANEL=Color(0xFF111E3A)
private val CYAN=Color(0xFF35D9FF); private val BLUE=Color(0xFF397BFF)
private val VIOLET=Color(0xFF9875FF); private val AMBER=Color(0xFFFFB84D)
private val TEXT=Color(0xFFF4F8FF); private val MUTED=Color(0xFF9BAFCB)

class MainActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);setContent{TrustLensApp()}}
}
private enum class Page { Home, Investigate, Cases, Insights, Settings }

@Composable private fun TrustLensApp(){
 var dark by rememberSaveable{mutableStateOf(true)}
 var page by rememberSaveable{mutableStateOf(Page.Home)}
 var menu by rememberSaveable{mutableStateOf(false)}
 var help by rememberSaveable{mutableStateOf(false)}
 var input by rememberSaveable{mutableStateOf("")}
 var prepared by rememberSaveable{mutableStateOf(false)}
 val bg=if(dark) BG else Color(0xFFF2F6FC)
 val fg=if(dark) TEXT else Color(0xFF101A2C)
 val muted=if(dark) MUTED else Color(0xFF53647C)
 val surface=if(dark) PANEL else Color.White
 MaterialTheme(colorScheme=if(dark) darkColorScheme(primary=CYAN,secondary=VIOLET,tertiary=AMBER,background=BG,surface=PANEL,onSurface=TEXT,onBackground=TEXT) else lightColorScheme(primary=Color(0xFF007F9E),secondary=Color(0xFF6650B8),background=Color(0xFFF2F6FC),surface=Color.White,onSurface=Color(0xFF101A2C),onBackground=Color(0xFF101A2C))){
  Box(Modifier.fillMaxSize().background(bg)){
   Box(Modifier.fillMaxWidth().height(300.dp).background(Brush.radialGradient(listOf(if(dark) Color(0x3335D9FF) else Color(0x2235D9FF),Color.Transparent))))
   Scaffold(containerColor=Color.Transparent,bottomBar={
    NavigationBar(containerColor=surface){
     val entries=listOf(Page.Home to Icons.Outlined.Home,Page.Investigate to Icons.Outlined.Search,Page.Cases to Icons.Outlined.FolderOpen,Page.Insights to Icons.Outlined.Insights,Page.Settings to Icons.Outlined.Settings)
     entries.forEach{(p,ic)->NavigationBarItem(selected=page==p,onClick={page=p;prepared=false},icon={Icon(ic,p.name)},label={Text(p.name,fontSize=10.sp)},colors=NavigationBarItemDefaults.colors(selectedIconColor=CYAN,selectedTextColor=CYAN,indicatorColor=Color(0x2235D9FF),unselectedIconColor=muted,unselectedTextColor=muted))}
    }
   },floatingActionButton={
    Column(horizontalAlignment=Alignment.End,verticalArrangement=Arrangement.spacedBy(10.dp)){
     AnimatedVisibility(menu,enter=fadeIn(tween(180))+scaleIn(tween(260)),exit=fadeOut(tween(120))){
      Column(horizontalAlignment=Alignment.End,verticalArrangement=Arrangement.spacedBy(8.dp)){
       FloatingActionChip(onClick={page=Page.Investigate;menu=false},label={Text("Analyse a message")},leadingIcon={Icon(Icons.Outlined.Message,null)})
       FloatingActionChip(onClick={page=Page.Investigate;input="https://";menu=false},label={Text("Check a link")},leadingIcon={Icon(Icons.Outlined.Link,null)})
       FloatingActionChip(onClick={help=true;menu=false},label={Text("How it works")},leadingIcon={Icon(Icons.Outlined.AutoAwesome,null)})
      }
     }
     FloatingActionButton(onClick={menu=!menu},containerColor=CYAN,contentColor=BG,modifier=Modifier.size(62.dp).semantics{contentDescription="Open investigation actions"}){
      Icon(if(menu) Icons.Outlined.Close else Icons.Outlined.CenterFocusStrong,null,modifier=Modifier.size(29.dp))
     }
    }
   }){pad->
    Column(Modifier.fillMaxSize().padding(pad)){
     Row(Modifier.fillMaxWidth().padding(horizontal=20.dp,vertical=13.dp),verticalAlignment=Alignment.CenterVertically){
      Box(Modifier.size(42.dp).clip(RoundedCornerShape(14.dp)).background(Brush.linearGradient(listOf(CYAN,BLUE,VIOLET))),contentAlignment=Alignment.Center){Icon(Icons.Outlined.CenterFocusStrong,null,tint=BG)}
      Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text("TrustLens AI",color=fg,fontWeight=FontWeight.Bold,fontSize=18.sp);Text("PAUSE · VERIFY · THEN ACT",color=muted,fontSize=9.sp,letterSpacing=1.sp)}
      IconButton(onClick={help=true}){Icon(Icons.Outlined.HelpOutline,"Help",tint=muted)}
      IconButton(onClick={dark=!dark}){Icon(if(dark)Icons.Outlined.LightMode else Icons.Outlined.DarkMode,"Toggle theme",tint=CYAN)}
     }
     when(page){
      Page.Home->LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(20.dp),verticalArrangement=Arrangement.spacedBy(15.dp)){
       item{Text("YOUR DIGITAL\nSAFETY, IN FOCUS.",color=fg,fontSize=30.sp,lineHeight=35.sp,fontWeight=FontWeight.Bold);Text("Understand the evidence before you act.",color=muted)}
       item{Glass(surface){Text("Start an investigation",color=fg,fontSize=20.sp,fontWeight=FontWeight.SemiBold);Text("Messages · links · payment requests",color=muted,fontSize=13.sp);Spacer(Modifier.height(15.dp));Button(onClick={page=Page.Investigate},colors=ButtonDefaults.buttonColors(containerColor=CYAN,contentColor=BG)){Icon(Icons.Outlined.CenterFocusStrong,null);Spacer(Modifier.width(8.dp));Text("Open TrustLens")}}}
       item{Heading("INVESTIGATE","Choose what to check",muted)}
       item{Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Tile("Message",Icons.Outlined.Sms,CYAN,Modifier.weight(1f)){page=Page.Investigate};Tile("Website",Icons.Outlined.Language,VIOLET,Modifier.weight(1f)){page=Page.Investigate};Tile("Payment",Icons.Outlined.Payments,AMBER,Modifier.weight(1f)){page=Page.Investigate}}}
       item{Heading("HOW IT WORKS","Evidence over guesswork",muted)}
       item{Glass(surface){Step("01","Spot warning signs","See the exact words or behaviour that triggered a finding.",fg,muted);Step("02","Inspect what was checked","Understand evidence, sources and checks that did not run.",fg,muted);Step("03","Know your next step","Get practical actions based on what happened.",fg,muted)}}
       item{Glass(surface){Text("Investigation history",color=fg,fontWeight=FontWeight.SemiBold);Text("Saved reports appear here after secure account storage is connected.",color=muted,fontSize=12.sp);TextButton(onClick={page=Page.Cases}){Text("View cases",color=CYAN)}}}
      }
      Page.Investigate->LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(20.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){
       item{Text("Investigate",color=fg,fontSize=28.sp,fontWeight=FontWeight.Bold);Text("Paste a message, link or payment request. Remove OTPs, passwords and personal details first.",color=muted,fontSize=13.sp)}
       item{Glass(surface){Text("WHAT WOULD YOU LIKE TO CHECK?",color=muted,fontSize=10.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold);Spacer(Modifier.height(12.dp));Box(Modifier.fillMaxWidth().heightIn(min=170.dp).clip(RoundedCornerShape(15.dp)).background(Color(0x181A2C48)).border(1.dp,Color(0x5535D9FF),RoundedCornerShape(15.dp)).padding(13.dp)){if(input.isEmpty())Text("Paste suspicious message or URL here…",color=muted);BasicTextField(input,{input=it;prepared=false},Modifier.fillMaxWidth().heightIn(min=145.dp),textStyle=androidx.compose.ui.text.TextStyle(color=fg,fontSize=15.sp,lineHeight=22.sp),cursorBrush=SolidColor(CYAN))};Spacer(Modifier.height(13.dp));Button(onClick={prepared=true},enabled=input.isNotBlank(),modifier=Modifier.fillMaxWidth().height(50.dp),colors=ButtonDefaults.buttonColors(containerColor=CYAN,contentColor=BG)){Icon(Icons.Outlined.Search,null);Spacer(Modifier.width(8.dp));Text("Prepare analysis")};Text("This UI foundation does not transmit your text.",color=muted,fontSize=11.sp)}
       if(prepared)item{Glass(surface){Text("Backend connection pending",color=AMBER,fontWeight=FontWeight.Bold);Spacer(Modifier.height(7.dp));Text("Your input is ready, but a verified Android analysis endpoint has not yet been connected. No scam verdict has been generated.",color=fg,fontSize=13.sp);Text("Next: connect the existing TrustLens analysis route and render its real findings, evidence and unknowns.",color=muted,fontSize=12.sp)}}
      }
      Page.Cases->Column(Modifier.fillMaxSize().padding(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text("Case history",color=fg,fontSize=28.sp,fontWeight=FontWeight.Bold);Glass(surface){Icon(Icons.Outlined.FolderOpen,null,tint=CYAN,modifier=Modifier.size(34.dp));Text("No connected reports yet",color=fg,fontWeight=FontWeight.SemiBold);Text("Saved cases will appear here when authenticated report storage is connected. No sample cases are fabricated.",color=muted,fontSize=13.sp)}}
      Page.Insights->LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("Insights",color=fg,fontSize=28.sp,fontWeight=FontWeight.Bold)};item{Glass(surface){Text("Recognise common pressure tactics",color=fg,fontWeight=FontWeight.SemiBold);Text("Urgency, impersonation, OTP/UPI PIN requests, remote-access apps and unusual payment instructions.",color=muted,fontSize=13.sp)}};item{Glass(surface){Step("01","Urgency and fear","Scammers pressure you to act before you can verify.",fg,muted);Step("02","OTP and UPI PIN requests","Never share authentication secrets with someone claiming to help.",fg,muted);Step("03","Remote-access apps","Do not install remote-control apps at a stranger’s request.",fg,muted)}}}
      Page.Settings->Column(Modifier.fillMaxSize().padding(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text("Settings",color=fg,fontSize=28.sp,fontWeight=FontWeight.Bold);Glass(surface){Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("Appearance",color=fg,fontWeight=FontWeight.SemiBold);Text(if(dark)"Dark cinematic theme" else "Light theme",color=muted,fontSize=12.sp)};Switch(dark,{dark=it})}};Glass(surface){Text("Privacy by design",color=fg,fontWeight=FontWeight.SemiBold);Text("No notification, SMS, contacts, call-log or accessibility access is requested. You choose what content to paste.",color=muted,fontSize=13.sp)};Glass(surface){Text("TrustLens AI · Android",color=fg,fontWeight=FontWeight.SemiBold);Text("Native UI foundation · backend integration pending",color=muted,fontSize=12.sp)}}
     }
    }
   }
   if(help)AlertDialog(onDismissRequest={help=false},containerColor=surface,title={Text("Your investigation companion",color=fg)},text={Text("TrustLens separates deterministic findings, retrieved evidence and AI interpretation. It also explains what was not checked and what to do next. It does not certify a message or payment as safe.",color=muted)},confirmButton={TextButton(onClick={help=false}){Text("Got it")}})
  }
 }
}

@Composable private fun Glass(surface:Color,content:@Composable ColumnScope.()->Unit){
 val shape=RoundedCornerShape(22.dp)
 Column(Modifier.fillMaxWidth().clip(shape).background(Brush.linearGradient(listOf(surface.copy(alpha=.97f),surface.copy(alpha=.82f),Color(0x2235D9FF)))).border(BorderStroke(1.dp,Brush.linearGradient(listOf(Color(0x6635D9FF),Color(0x229875FF)))),shape).padding(17.dp),content=content)
}
@Composable private fun Heading(k:String,t:String,m:Color){Column{Text(k,color=CYAN,fontSize=10.sp,letterSpacing=1.sp,fontWeight=FontWeight.Bold);Text(t,color=m,fontSize=15.sp)}}
@Composable private fun Step(n:String,t:String,d:String,fg:Color,m:Color){Row(Modifier.padding(vertical=7.dp),verticalAlignment=Alignment.Top){Text(n,color=CYAN,fontWeight=FontWeight.Bold);Spacer(Modifier.width(12.dp));Column{Text(t,color=fg,fontWeight=FontWeight.SemiBold);Text(d,color=m,fontSize=12.sp,lineHeight=17.sp)}}}
@Composable private fun Tile(t:String,ic:androidx.compose.ui.graphics.vector.ImageVector,c:Color,mod:Modifier,onClick:()->Unit){Column(mod.clip(RoundedCornerShape(18.dp)).background(PANEL.copy(alpha=.8f)).border(1.dp,Color(0x3335D9FF),RoundedCornerShape(18.dp)).clickable(onClick=onClick).padding(13.dp)){Icon(ic,null,tint=c,modifier=Modifier.size(24.dp));Spacer(Modifier.height(8.dp));Text(t,color=MaterialTheme.colorScheme.onSurface,fontWeight=FontWeight.SemiBold,fontSize=12.sp)}}
