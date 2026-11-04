package com.trustlensai.android.core.net

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * The versioned API, exactly as `docs/openapi.yaml` describes it.
 *
 * Everything is `/api/v1`. The unversioned paths still exist as deprecated
 * aliases for the web client, but an installed app must never depend on them —
 * a breaking change to an unversioned path strands every copy already on a
 * phone.
 *
 * `Response<T>` rather than a bare `T` throughout, so a 401, 429 or 503 is a
 * value this app handles rather than an exception it catches. Each of those
 * means something specific to the user and none of them is a crash.
 */
interface TrustLensApi {

    /** Analysis works without an account. The header is sent when there is one. */
    @POST("api/v1/analyses")
    suspend fun analyse(
        @Body body: AnalysisRequest,
        @Header("Authorization") bearer: String? = null,
    ): Response<AnalysisResponse>

    /**
     * What this deployment can actually do, for this platform.
     *
     * The platform header is what makes the answer honest — the server never
     * guesses "android" from a user agent, so a client that does not declare
     * itself is told the web capabilities instead.
     */
    @GET("api/v1/capabilities")
    suspend fun capabilities(
        @Header("X-TrustLens-Platform") platform: String = "android",
    ): Response<CapabilitiesResponse>

    /**
     * Deliberately unauthenticated on the server side.
     *
     * Someone whose money left ten minutes ago must not meet a sign-in screen,
     * so no bearer token is sent or needed.
     */
    @POST("api/v1/recovery-plan")
    suspend fun recoveryPlan(@Body body: RecoveryPlanRequest): Response<RecoveryPlanResponse>

    @GET("api/v1/recovery-plan")
    suspend fun actionStates(): Response<ActionStatesResponse>

    /* Cases need an account. Nothing else in the product does. */

    @POST("api/v1/cases")
    suspend fun createCase(
        @Header("Authorization") bearer: String,
        @Body body: CreateCaseRequest,
    ): Response<CaseEnvelope>

    @GET("api/v1/cases")
    suspend fun listCases(
        @Header("Authorization") bearer: String,
        @Query("limit") limit: Int? = null,
        /** Cursor pagination, never offset. */
        @Query("cursor") cursor: String? = null,
    ): Response<CaseListResponse>

    @GET("api/v1/cases/{caseId}")
    suspend fun getCase(
        @Header("Authorization") bearer: String,
        @Path("caseId") caseId: String,
    ): Response<CaseEnvelope>

    @PATCH("api/v1/cases/{caseId}")
    suspend fun updateCase(
        @Header("Authorization") bearer: String,
        @Path("caseId") caseId: String,
        @Body body: UpdateCaseRequest,
    ): Response<CaseEnvelope>

    @DELETE("api/v1/cases/{caseId}")
    suspend fun deleteCase(
        @Header("Authorization") bearer: String,
        @Path("caseId") caseId: String,
    ): Response<Unit>

    @POST("api/v1/cases/{caseId}/artifacts")
    suspend fun addArtifact(
        @Header("Authorization") bearer: String,
        @Path("caseId") caseId: String,
        @Body body: ArtifactRequest,
    ): Response<ArtifactEnvelope>

    /**
     * Report what the user actually did.
     *
     * `actionState` alone is enough; `kind` defaults to `action_reported`
     * server-side. The case's furthest action only ever moves toward more
     * exposure, so a milder answer given later never produces a milder plan.
     */
    @POST("api/v1/cases/{caseId}/events")
    suspend fun addEvent(
        @Header("Authorization") bearer: String,
        @Path("caseId") caseId: String,
        @Body body: CaseEventRequest,
    ): Response<CaseEventEnvelope>

    @GET("api/v1/cases/{caseId}/recovery-plan")
    suspend fun caseRecoveryPlan(
        @Header("Authorization") bearer: String,
        @Path("caseId") caseId: String,
    ): Response<RecoveryPlanResponse>

    @GET("api/health")
    suspend fun health(): Response<HealthResponse>
}
