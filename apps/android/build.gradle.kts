// Root build file. Plugins are declared here without applying them, so each
// module opts in to what it actually uses.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
