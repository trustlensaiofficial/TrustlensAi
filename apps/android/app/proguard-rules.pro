# kotlinx.serialization keeps its serializers through reflection on the
# companion, so the generated members must survive shrinking.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.trustlensai.android.**$$serializer { *; }
-keepclassmembers class com.trustlensai.android.** {
    *** Companion;
}
-keepclasseswithmembers class com.trustlensai.android.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Retrofit interfaces are implemented at runtime by a proxy.
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-if interface * { @retrofit2.http.* public *** *(...); }
-keep,allowoptimization,allowshrinking,allowobfuscation class <1>

# OkHttp ships optional platform hooks that are absent on Android.
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
