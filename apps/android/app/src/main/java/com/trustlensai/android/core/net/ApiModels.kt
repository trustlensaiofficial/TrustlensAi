package com.trustlensai.android.core.net

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Wire types for the TrustLens API.
 *
 * These mirror `docs/openapi.yaml`, which is the authoritative contract. If
 * these and the contract disagree, these are wrong.
 *
 * Two deliberate choices run through the whole file:
 *
 *  1. **Nothing here computes a verdict.** The client renders
 *     `assessment.level` and `signals[].severity` exactly as the server sends
 *     them. If the backend tightens a rule to kill a false positive and this
 *     app were colouring things independently, the fix would never reach the
 *     user — and the two could disagree on screen, which destroys the whole
 *     argument that findings are traceable.
 *  2. **Unknown fields are ignored, not fatal.** The server will gain fields
 *     before this app ships an update, and an installed app must not start
 *     failing because of that.
 */

/* ------------------------------------------------------------------ request */

@Serializable
data class AnalysisRequest(
    val text: String? = null,
    val kind: String = "auto",
    val context: String = "generic",
    /** Contacts the link from the server. Off unless the user asks for it. */
    val liveChecks: Boolean = false,
    /**
     * Sends the text to a model provider. Off unless the user asks for it.
     *
     * The canonical contract spelling. The server also accepts the legacy
     * capitalised `allowCloudAI`, but a new client should not use it.
     */
    val allowCloudAi: Boolean = false,
    /** Stores a copy against the account. Off unless the user asks for it. */
    val saveToAccount: Boolean = false,
    /**
     * A QR payload decoded on this device. The image itself is never uploaded
     * — only the string the code contained.
     */
    val qrPayload: String? = null,
    val demoSlug: String? = null,
)

/* ----------------------------------------------------------------- response */

@Serializable
data class AnalysisResponse(
    val report: Report,
    /**
     * What actually happened to storage, which is not always what was asked.
     * Rendered verbatim — the app must never imply a report was saved when it
     * was not.
     */
    val storageNote: String? = null,
)

@Serializable
data class Report(
    val id: String,
    val inputKind: String,
    val inputContext: String = "generic",
    val inputPreview: String = "",
    val createdAt: String,
    val assessment: Assessment,
    val signals: List<Signal> = emptyList(),
    val evidence: List<EvidenceRecord> = emptyList(),
    val findings: List<Finding> = emptyList(),
    val uncertainty: Uncertainty = Uncertainty(),
    val checklist: List<ChecklistStep> = emptyList(),
    val positives: List<PositiveIndicator> = emptyList(),
    val questions: List<QuestionToAsk> = emptyList(),
    /**
     * What the content is asking the reader to do with money. Null when
     * nothing financial was found.
     */
    val paymentAction: PaymentAction? = null,
    val model: ModelStatus = ModelStatus(),
    val isDemo: Boolean = false,
    val persisted: Boolean = false,
)

@Serializable
data class Assessment(
    /**
     * One of: high_risk, elevated_risk, some_signals, no_signals_detected,
     * unable_to_assess.
     *
     * There is no "safe" value, by design. `no_signals_detected` means our
     * checks did not match — it is not a reassurance, and must never be
     * rendered as one.
     */
    val level: String,
    val headline: String,
    val summary: String = "",
    /**
     * An ordering aid only. **Never render this as a percentage or a
     * probability** — it is not calibrated, and presenting it as one would be
     * the exact overclaim this product exists to argue against.
     */
    val signalScore: Int = 0,
)

@Serializable
data class Signal(
    val id: String,
    val title: String,
    val category: String,
    /** critical | high | medium | low. Rendered as sent. */
    val severity: String,
    val explanation: String = "",
    val matches: List<SignalMatch> = emptyList(),
)

/**
 * The exact span of input text that caused a rule to fire.
 *
 * The quoted span *is* the evidence. A signal rendered without it loses the
 * product's whole argument, so the report screen always shows `matches[0]`.
 */
@Serializable
data class SignalMatch(
    val text: String,
    val start: Int = 0,
    val end: Int = 0,
    val note: String? = null,
)

@Serializable
data class EvidenceRecord(
    val id: String,
    val source: String,
    val method: String,
    val detail: String,
    val url: String? = null,
    /** observed | unresolved | failed | not_checked */
    val status: String,
    val retrievedAt: String? = null,
)

@Serializable
data class Finding(
    val statement: String,
    /**
     * deterministic | on_device | retrieved | model_inference | user_supplied
     * | assumption.
     *
     * Never blended in the interface: a fixed rule and an AI reading go in
     * separate blocks, because the user's decision depends on knowing which
     * is which.
     */
    val provenance: String,
    val confidence: String? = null,
)

@Serializable
data class Uncertainty(
    val checked: List<String> = emptyList(),
    /** Required, and never hidden when non-empty. */
    val notChecked: List<String> = emptyList(),
    val limits: List<String> = emptyList(),
)

@Serializable
data class ChecklistStep(
    val id: String,
    val action: String,
    val why: String = "",
)

@Serializable
data class PositiveIndicator(val id: String, val title: String, val detail: String = "")

@Serializable
data class QuestionToAsk(val id: String, val question: String, val why: String = "")

@Serializable
data class ModelStatus(
    val used: Boolean = false,
    val provider: String = "none",
    val model: String? = null,
    /**
     * True when the AI layer was unavailable. **Not an error.** The report is
     * still complete — rules, evidence, payment reading and next steps are all
     * there — so the UI shows the whole report plus a quiet note.
     */
    val degraded: Boolean = false,
    val reason: String? = null,
)

/* ----------------------------------------------------------- payment action */

/**
 * What the message is persuading the reader to do with money.
 *
 * The product's most distinctive output and the easiest to render
 * misleadingly. See `docs/FRONTEND_HANDOFF.md` §5.
 */
@Serializable
data class PaymentAction(
    val detected: Boolean = false,
    /**
     * enter_upi_pin | approve_collect | scan_qr | send_money |
     * share_credentials | install_app | none
     */
    val kind: String = "none",
    /** user_pays | user_receives | unclear */
    val direction: String = "unclear",
    val upi: UpiInstruction? = null,
    val explanation: String = "",
    /** Never collapsed by default. This is the honest half of the panel. */
    val unknowns: List<String> = emptyList(),
    /**
     * True when the message promises money coming in while the mechanism
     * takes money out. When this is true it is the headline of the panel.
     */
    val claimContradiction: Boolean = false,
    /** The words that promised money in, for quoting. */
    val claimSpan: SignalMatch? = null,
)

@Serializable
data class UpiInstruction(
    /** The account that would be credited. */
    val payeeVpa: String? = null,
    /**
     * Attacker-controlled. Rendered as a quoted claim, never as a verified
     * party — a scammer can put "State Bank Of India" here and frequently
     * does.
     */
    val payeeName: String? = null,
    val amount: String? = null,
    val currency: String? = null,
    val note: String? = null,
    val mode: String? = null,
)

/* --------------------------------------------------------------- incident */

@Serializable
data class RecoveryPlanResponse(
    val recoveryPlan: RecoveryPlan? = null,
    val note: String? = null,
)

@Serializable
data class RecoveryPlan(
    val actionState: String,
    /** immediate | prompt | routine */
    val urgency: String,
    val title: String,
    val summary: String = "",
    val steps: List<RecoveryStep> = emptyList(),
    val officialChannels: List<OfficialChannel> = emptyList(),
    /** Mandatory. Recovery is never promised, and this must be rendered. */
    val disclaimer: String = "",
)

@Serializable
data class RecoveryStep(val order: Int, val action: String, val why: String = "")

/**
 * India-specific and route-correct.
 *
 * Chakshu is for suspected fraudulent *communications*; 1930 and
 * cybercrime.gov.in are for actual financial cybercrime. They are not
 * interchangeable, and the backend decides which applies — so `useWhen` is
 * rendered verbatim rather than re-worded here.
 */
@Serializable
data class OfficialChannel(
    val name: String,
    val contact: String,
    val url: String? = null,
    val useWhen: String = "",
    /** Rendered above the step list, not inside it. */
    val urgent: Boolean = false,
)

@Serializable
data class ActionStatesResponse(
    val actionStates: List<String> = emptyList(),
    val note: String? = null,
)

/* ------------------------------------------------------------ capabilities */

@Serializable
data class CapabilitiesResponse(
    val platform: String = "android",
    val capabilities: List<Capability> = emptyList(),
    val note: String? = null,
)

@Serializable
data class Capability(
    val key: String,
    /**
     * available | permission_required | unsupported_platform | degraded |
     * paused | unavailable.
     *
     * `available` renders as nothing at all: silence means working. **One
     * global green tick is forbidden** — capabilities differ per platform and
     * per grant, and an aggregate badge hides what the user needs.
     */
    val state: String,
    /** Required whenever state is not `available`. */
    val reason: String? = null,
    /** The exact platform API behind it, or null where there is none. */
    val mechanism: String? = null,
    /** What this specifically cannot see. */
    val limits: List<String> = emptyList(),
    val lastCheckedAt: String? = null,
)

/* ------------------------------------------------------------------ cases */

@Serializable
data class CaseListResponse(
    val cases: List<CaseSummary> = emptyList(),
    /** Cursor pagination, not offset. Pass this back as `cursor`. */
    val nextCursor: String? = null,
)

@Serializable
data class CaseEnvelope(@SerialName("case") val case: CaseDetail)

@Serializable
data class CaseSummary(
    val id: String,
    val title: String = "Untitled case",
    val status: String = "draft",
    val context: String = "generic",
    val createdAt: String? = null,
    val updatedAt: String? = null,
    /**
     * The most exposed action reported, never the most recent one. Someone who
     * transferred money and later says they also opened a link has not become
     * less exposed.
     */
    val furthestAction: String? = null,
    val artifactCount: Int = 0,
    val highestSeverity: String = "none",
)

@Serializable
data class CaseDetail(
    val id: String,
    val title: String = "Untitled case",
    val status: String = "draft",
    val context: String = "generic",
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val furthestAction: String? = null,
    val artifactCount: Int = 0,
    val highestSeverity: String = "none",
    val artifacts: List<CaseArtifact> = emptyList(),
    val events: List<CaseEvent> = emptyList(),
)

@Serializable
data class CaseArtifact(
    val id: String,
    val type: String,
    val text: String? = null,
    val url: String? = null,
    val senderLabel: String? = null,
    val provenance: String = "user_supplied",
    /** A stale result is never presented as a live check. */
    val freshness: String = "unknown",
    val provider: String? = null,
    val retrievedAt: String? = null,
    val redacted: Boolean = false,
    val createdAt: String? = null,
)

@Serializable
data class CaseEvent(
    val id: String,
    val kind: String,
    val actionState: String? = null,
    val detail: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CreateCaseRequest(val title: String? = null, val context: String? = null)

@Serializable
data class CaseEventRequest(
    val kind: String? = null,
    val actionState: String? = null,
    val detail: String? = null,
)

@Serializable
data class ArtifactRequest(
    val type: String,
    val text: String? = null,
    val url: String? = null,
    val senderLabel: String? = null,
)

/* ------------------------------------------------------------------ errors */

@Serializable
data class ApiError(
    val error: String? = null,
    val code: String? = null,
    val note: String? = null,
    /** Returned with a 400 on an unrecognised enum, so a client can recover. */
    val validValues: List<String>? = null,
)

/* -------------------------------------------------- remaining request types */

@Serializable
data class RecoveryPlanRequest(val actionState: String)

@Serializable
data class UpdateCaseRequest(val title: String? = null, val status: String? = null)

@Serializable
data class ArtifactEnvelope(val artifact: CaseArtifact)

/** `POST .../events` returns both the appended event and the moved case. */
@Serializable
data class CaseEventEnvelope(val result: CaseEventResult)

@Serializable
data class CaseEventResult(
    val event: CaseEvent,
    @SerialName("case") val case: CaseSummary,
)

/**
 * What this deployment can honestly say about itself.
 *
 * Every flag here is probed server-side rather than inferred from
 * configuration, so `false` means genuinely not working rather than
 * not-yet-attempted.
 */
@Serializable
data class HealthResponse(
    val ok: Boolean = false,
    val capabilities: HealthCapabilities = HealthCapabilities(),
    val notes: List<String> = emptyList(),
)

@Serializable
data class HealthCapabilities(
    val deterministicRules: Boolean = false,
    val liveUrlChecks: Boolean = false,
    /** True only when the provider actually answered a probe. */
    val contextualAnalysis: Boolean = false,
    val contextualProvider: String? = null,
    val contextualHealth: String? = null,
    val contextualReason: String? = null,
    val reportHistory: Boolean = false,
    /** False means the effective rate limit is higher than configured. */
    val sharedRateLimiting: Boolean = false,
    val rateLimitKeyedTokens: Boolean = false,
    val rateLimitPerMinute: Int = 0,
    val caseStorage: Boolean = false,
)
