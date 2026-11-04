import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

/**
 * Build configuration, read from a local file or the environment.
 *
 * Nothing secret belongs in this app. The Supabase publishable key is already
 * public — it ships in the web bundle and is safe in an APK, because row-level
 * security is what protects the data, not the obscurity of that key. The
 * service-role key must NEVER appear here, and there is deliberately no field
 * for one: privileged work stays on the server.
 */
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

fun config(name: String, default: String): String =
    (localProps.getProperty(name) ?: System.getenv(name) ?: default)

android {
    namespace = "com.trustlensai.android"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "com.trustlensai.android"
        minSdk = libs.versions.minSdk.get().toInt()
        targetSdk = libs.versions.targetSdk.get().toInt()
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "API_BASE_URL", "\"${config("TRUSTLENS_API_BASE_URL", "https://trustlensai-u2r6.vercel.app/")}\"")
        buildConfigField("String", "SUPABASE_URL", "\"${config("SUPABASE_URL", "")}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${config("SUPABASE_PUBLISHABLE_KEY", "")}\"")
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            /*
             * No signing config. Release signing needs a keystore, and a
             * keystore must never be committed — so a release build is
             * configured by whoever holds the key, not here.
             */
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    // Under built-in Kotlin, kotlin.compilerOptions.jvmTarget defaults to
    // compileOptions.targetCompatibility above, so it is not set separately.

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += setOf(
            "/META-INF/{AL2.0,LGPL2.1}",
            "/META-INF/DEPENDENCIES",
            "/META-INF/INDEX.LIST",
        )
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }

    lint {
        // A lint error should fail the build rather than scroll past in a log.
        warningsAsErrors = false
        abortOnError = true
        disable += setOf("GradleDependency") // handled by the pinned catalogue
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    debugImplementation(libs.androidx.compose.ui.tooling)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.security.crypto)
    // Custom Tabs: a suspicious link opens in the browser's own sandbox with
    // the address bar visible, never inside a WebView we control.
    implementation(libs.androidx.browser)

    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    // On-device barcode decoding. The image never leaves the phone.
    implementation(libs.mlkit.barcode.scanning)

    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    debugImplementation(libs.okhttp.logging)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.mockk)

    androidTestImplementation(libs.androidx.test.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
