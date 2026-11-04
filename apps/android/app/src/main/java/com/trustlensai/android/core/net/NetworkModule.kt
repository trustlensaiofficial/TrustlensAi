package com.trustlensai.android.core.net

import com.trustlensai.android.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * The single HTTP client.
 *
 * Timeouts are generous on read because an analysis with live link checking
 * enabled legitimately takes ten to fifteen seconds — a short timeout would
 * turn a working slow path into a mysterious failure.
 *
 * There is no logging interceptor in release builds. The bodies passing
 * through here are the user's suspicious messages, which routinely contain
 * account fragments and amounts, and logcat is readable by anyone with adb.
 */
object NetworkModule {

    val json: Json = Json {
        // The server will gain fields before this app ships an update. An
        // installed copy must not start failing because of that.
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = false
    }

    private fun client(): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)

        if (BuildConfig.DEBUG) {
            builder.addInterceptor(
                HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC },
            )
        }
        return builder.build()
    }

    fun api(baseUrl: String = BuildConfig.API_BASE_URL): TrustLensApi =
        Retrofit.Builder()
            .baseUrl(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
            .client(client())
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(TrustLensApi::class.java)
}
