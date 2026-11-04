/*
 * Raise the Kotlin Gradle plugin above AGP's default.
 *
 * AGP 9.5 ships with KGP 2.2.10 for built-in Kotlin, and will silently keep
 * using it unless told otherwise. That is too old for this dependency set:
 * Supabase 3.9.0 requires kotlin-stdlib 2.4.21 and kotlinx-serialization
 * 1.12.0 carries Kotlin 2.4.0 metadata, while a 2.2 compiler reads metadata
 * only up to 2.3.0. Leaving it at the default failed every file with
 * "Class 'kotlin.Unit' was compiled with an incompatible version of Kotlin".
 *
 * This buildscript classpath is the documented way to upgrade KGP under
 * built-in Kotlin. KSP is pinned alongside it because AGP otherwise forces KSP
 * back to the version matching its own KGP.
 */
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${libs.versions.kotlin.get()}")
    }
}

// Root build file. Plugins are declared here without applying them, so each
// module opts in to what it actually uses. There is deliberately no
// kotlin-android plugin: AGP 9 compiles Kotlin itself.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
