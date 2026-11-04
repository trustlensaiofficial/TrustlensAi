package com.trustlensai.android.core.net

import retrofit2.Response

/**
 * Every outcome a screen has to render, as a value rather than an exception.
 *
 * `docs/FRONTEND_HANDOFF.md` §2 lists eleven states a screen must handle, and
 * most of them are not errors. The two that matter most here:
 *
 *  - **Degraded is not a failure.** A report whose AI commentary is missing is
 *    still complete, so it arrives as `Success` carrying a note, never as an
 *    error. Showing an error there would hide a perfectly good report.
 *  - **RateLimited carries its own countdown**, because "try again later" with
 *    no number is useless to someone mid-scam.
 */
sealed interface ApiResult<out T> {
    data class Success<T>(val value: T) : ApiResult<T>

    /** 400 — a field problem the user can fix. */
    data class Invalid(val message: String, val validValues: List<String> = emptyList()) : ApiResult<Nothing>

    /** 401 — cases need an account; analysis and recovery plans do not. */
    data class Unauthorized(val message: String, val note: String? = null) : ApiResult<Nothing>

    /** 404 — "not yours or not here", never "deleted". */
    data object NotFound : ApiResult<Nothing>

    data class RateLimited(val retryAfterSeconds: Int, val message: String) : ApiResult<Nothing>

    /** 503 — a named dependency is down. Say which, and what still works. */
    data class Unavailable(val reason: String) : ApiResult<Nothing>

    /** No network at all. Distinct from a server that answered badly. */
    data object Offline : ApiResult<Nothing>

    data class Failed(val message: String) : ApiResult<Nothing>
}

/**
 * Maps a Retrofit response onto the states above.
 *
 * Error bodies are parsed for the server's own wording where possible: the
 * backend writes messages intended for a reader, and replacing them with a
 * generic string loses the only useful part.
 */
fun <T> Response<T>.toApiResult(): ApiResult<T> {
    if (isSuccessful) {
        val body = body()
        return if (body != null) {
            ApiResult.Success(body)
        } else {
            // A 204 on a typed call is a contract mismatch, not a user problem.
            @Suppress("UNCHECKED_CAST")
            if (code() == 204) ApiResult.Success(Unit as T) else ApiResult.Failed("The server returned an empty body.")
        }
    }

    val error = runCatching {
        errorBody()?.string()?.let { NetworkModule.json.decodeFromString<ApiError>(it) }
    }.getOrNull()
    val message = error?.error ?: "The request failed."

    return when (code()) {
        400 -> ApiResult.Invalid(message, error?.validValues ?: emptyList())
        401 -> ApiResult.Unauthorized(message, error?.note)
        404 -> ApiResult.NotFound
        429 -> {
            val retry = headers()["Retry-After"]?.toIntOrNull() ?: 60
            ApiResult.RateLimited(retry, message)
        }
        503 -> ApiResult.Unavailable(message)
        else -> ApiResult.Failed(message)
    }
}
