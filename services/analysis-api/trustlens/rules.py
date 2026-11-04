"""Deterministic warning-sign rules.

A port of the TypeScript engine in ``lib/analysis``. The patterns are the
substance of the product, so they are kept as data here rather than being
scattered through control flow: each rule carries its own identifier,
severity, plain-language explanation and the patterns that trigger it.

Two properties matter more than coverage:

* Every match records the **exact span** that fired it. A report that says
  "this looks like a scam" is useless; one that quotes the eight words that
  caused it lets the reader judge for themselves.
* A rule must require a **demand**, not a mention. "Share your OTP" is a
  scam; "I got the OTP for the train booking" is a Tuesday. Firing on the
  second teaches people to ignore the first.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable, Literal

Severity = Literal["critical", "high", "medium", "low"]
Context = Literal["generic", "bank_scam", "job_offer", "invoice", "proposal", "website"]

CONTEXTS: tuple[Context, ...] = (
    "generic", "bank_scam", "job_offer", "invoice", "proposal", "website",
)


@dataclass(frozen=True)
class Match:
    """One span of text that triggered a rule."""

    text: str
    start: int
    end: int

    def as_dict(self) -> dict:
        return {"text": self.text, "start": self.start, "end": self.end}


@dataclass(frozen=True)
class Signal:
    """A rule that fired, with the evidence for it."""

    id: str
    title: str
    category: str
    severity: Severity
    explanation: str
    matches: list[Match]

    def as_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "severity": self.severity,
            "explanation": self.explanation,
            "provenance": "deterministic",
            "matches": [m.as_dict() for m in self.matches],
        }


@dataclass(frozen=True)
class Rule:
    id: str
    title: str
    category: str
    severity: Severity
    explanation: str
    patterns: list[re.Pattern[str]]
    # Empty means the rule applies whatever the user said they were holding.
    contexts: frozenset[str] = field(default_factory=frozenset)


def _p(*sources: str) -> list[re.Pattern[str]]:
    return [re.compile(s, re.IGNORECASE) for s in sources]


# --------------------------------------------------------------------------
# Generic rules — these apply to any text
# --------------------------------------------------------------------------

GENERIC: list[Rule] = [
    Rule(
        id="credentials.request",
        title="Request for a one-time code, PIN or password",
        category="credentials",
        severity="critical",
        explanation=(
            "No bank, platform or official will ever ask for your OTP, PIN, CVV or password. "
            "Anyone asking is trying to complete a login or a payment as you."
        ),
        # Note the shape: a demand verb within a short window of the noun.
        # Matching the bare word "OTP" would fire on ordinary conversation.
        patterns=_p(
            r"\b(share|send|provide|enter|confirm|forward|give|tell\s+(me|us)|read(\s+\w+)?\s+out|reply\s+with)\b[^.!?]{0,30}?\b(otp|one[-\s]?time\s+(password|code|pin)|verification\s+code|security\s+code|passcode|password|pin|cvv)\b",
            r"\b(otp|one[-\s]?time\s+(password|code|pin)|verification\s+code|security\s+code)\b[^.!?]{0,30}?\b(share|send|provide|enter|forward|tell\s+(me|us)|read(\s+\w+)?\s+out|reply\s+with)\b",
            r"\b(share|send|provide|enter|confirm|give)\b[^.!?]{0,30}?\b(card\s+number|cvv|expiry\s+date|card\s+details)\b",
        ),
    ),
    Rule(
        id="urgency.deadline",
        title="Artificial deadline",
        category="urgency",
        severity="medium",
        explanation=(
            "Pressure to act immediately exists to stop you checking with anyone else. "
            "A genuine organisation will wait while you verify."
        ),
        patterns=_p(
            r"\b(within|in)\s+\d+\s*(minutes?|hours?|hrs?)\b",
            r"\b(immediately|urgently|right\s+now|at\s+once|without\s+delay)\b",
            r"\b(today|tonight)\s+(only|itself)\b",
            r"\b(last|final)\s+(chance|warning|notice|reminder)\b",
        ),
    ),
    Rule(
        id="threat.account_action",
        title="Threat to block, suspend or close an account",
        category="threat",
        severity="high",
        explanation=(
            "A threat of losing access is used to produce panic. Real institutions notify you "
            "through their own app or by post, and give you time."
        ),
        patterns=_p(
            r"\b(account|card|service)\s+(will\s+be\s+)?(block|blocked|suspend|suspended|clos\w+|frozen|deactivat\w+|terminat\w+)\b",
            r"\b(block|suspend|freeze|deactivate|close)\w*\s+(your\s+)?(account|card)\b",
            r"\b(permanently|immediately)\s+(blocked|suspended|closed)\b",
        ),
    ),
    Rule(
        id="payment.transfer_demand",
        title="Request to send money or make a payment",
        category="payment",
        severity="high",
        explanation=(
            "A payment request arriving in a message you did not expect. Transfers are "
            "effectively irreversible, so verify through a channel you already trust."
        ),
        patterns=_p(
            r"\b(transfer|send|pay|deposit|remit)\b[^.!?]{0,25}?\b(rs\.?|inr|₹|\d{3,})\b",
            r"\b(safe|secure)\s+account\b",
            r"\b(processing|registration|clearance|verification|refundable)\s+(fee|charge|amount|deposit)\b",
            r"\bupi\s+(pin|id|collect|request)\b",
        ),
    ),
    Rule(
        id="channel.remote_access",
        title="Request to install an app or share your screen",
        category="channel",
        severity="critical",
        explanation=(
            "Screen-sharing and remote-support tools hand over everything you can see, "
            "including balances and one-time codes. No genuine support process needs this."
        ),
        patterns=_p(
            r"\b(anydesk|teamviewer|quicksupport|airdroid|screen\s*shar\w*|remote\s+(access|desktop|support))\b",
            r"\b(install|download)\b[^.!?]{0,25}?\b(app|application|apk)\b",
        ),
    ),
    Rule(
        id="impersonation.authority",
        title="Claims to be a bank, the police or a government body",
        category="impersonation",
        severity="high",
        explanation=(
            "Anyone can claim an identity in a message; the claim is not evidence. Real "
            "officials do not demand payments or codes over chat."
        ),
        patterns=_p(
            r"\b(cyber\s*crime|police|income\s+tax|customs|enforcement\s+directorate|cbi|trai)\b",
            r"\b(digital\s+arrest|arrest\s+warrant|non[-\s]?bailable)\b",
            r"\bthis\s+is\s+(from\s+)?(your\s+)?(bank|hdfc|sbi|icici|axis|paytm|phonepe|google\s*pay)\b",
        ),
    ),
    Rule(
        id="link.suspicious",
        title="Link that does not go where it appears to",
        category="link",
        severity="high",
        explanation=(
            "A link combined with urgency is how credential-stealing pages are delivered. "
            "Open your bank through its own app instead."
        ),
        patterns=_p(
            r"https?://[^\s]*\.(xyz|top|tk|ml|ga|cf|gq|buzz|click|link|work|rest)\b",
            r"https?://(bit\.ly|tinyurl|t\.co|is\.gd|goo\.gl|rb\.gy|cutt\.ly)/\S+",
            r"https?://[^\s]*(hdfc|sbi|icici|axis|paytm|phonepe|gpay|kotak)[^\s]*\.(?!(com|in|co\.in)\b)[a-z]{2,}",
        ),
    ),
    Rule(
        id="lure.unexpected_gain",
        title="Unexpected money, prize or refund",
        category="lure",
        severity="medium",
        explanation=(
            "An unexpected windfall is the oldest opening there is. It exists to make the "
            "request that follows feel reasonable."
        ),
        patterns=_p(
            r"\b(you\s+have\s+)?(won|winner|lottery|lucky\s+draw|prize|jackpot)\b",
            r"\b(refund|cashback|reward|bonus)\s+(of\s+)?(rs\.?|inr|₹)?\s*\d+",
            r"\b(claim|collect)\s+your\s+(prize|reward|refund|amount)\b",
        ),
    ),
    Rule(
        id="secrecy.do_not_tell",
        title="Told to keep it secret",
        category="secrecy",
        severity="critical",
        explanation=(
            "Isolation is the mechanism of the scam. Being told not to tell your family or "
            "your bank exists only to stop someone talking you out of it."
        ),
        patterns=_p(
            r"\b(do\s*n[o']?t|don't|never)\s+(tell|inform|discuss|share\s+with|disclose)\b[^.!?]{0,30}?\b(anyone|family|friends?|bank|police|wife|husband)\b",
            r"\b(keep|maintain)\s+(this\s+)?(confidential|secret|private)\b",
            r"\b(stay|remain)\s+on\s+(the\s+)?(call|line)\b",
        ),
    ),
]

# --------------------------------------------------------------------------
# Context rules — only when the user says what they are holding
# --------------------------------------------------------------------------

CONTEXTUAL: list[Rule] = [
    Rule(
        id="bank.kyc_pretext",
        title="KYC or verification pretext",
        category="credentials",
        severity="high",
        explanation=(
            "\"Complete your KYC\" framing makes data collection feel procedural. Real KYC is "
            "something you start from the bank's own app or a branch."
        ),
        patterns=_p(
            r"\b(kyc|know\s+your\s+customer)\b",
            r"\b(re[-\s]?verify|revalidate|update)\s+(your\s+)?(account|details|documents|pan|aadhaar)\b",
        ),
        contexts=frozenset({"bank_scam", "generic"}),
    ),
    Rule(
        id="bank.fake_support",
        title="A customer-care number supplied in the message",
        category="impersonation",
        severity="high",
        explanation=(
            "A number inside the message is the scammer's own. Use the number printed on your "
            "card or inside the bank's official app."
        ),
        patterns=_p(
            r"\b(call|contact|dial|reach)\b[^.!?]{0,25}?\b(\+?91[\s-]?)?[6-9]\d{9}\b",
            r"\b(customer\s*care|helpline|toll\s*free|support)\s*(number|no\.?)?\s*[:\-]?\s*(\+?91)?[\s-]?[6-9]\d{9}\b",
        ),
        contexts=frozenset({"bank_scam", "generic"}),
    ),
    Rule(
        id="job.upfront_fee",
        title="Payment required before the job starts",
        category="payment",
        severity="critical",
        explanation=(
            "A real employer pays you. Charges for registration, training, equipment or a "
            "security deposit are the scam itself, not a condition of the job."
        ),
        patterns=_p(
            r"\b(registration|training|onboarding|processing|security|refundable)\s+(fee|charge|deposit|amount)\b",
            r"\b(pay|deposit|transfer)\b[^.!?]{0,30}?\b(to\s+(confirm|secure|reserve|block)\s+(your\s+)?(seat|position|role|offer))\b",
        ),
        contexts=frozenset({"job_offer"}),
    ),
    Rule(
        id="job.no_interview",
        title="Offer made without any interview",
        category="lure",
        severity="high",
        explanation=(
            "Employers assess candidates before hiring. An offer with no interview is the "
            "standard opening of a recruitment scam."
        ),
        patterns=_p(
            r"\b(no|without)\s+(an?\s+)?(interview|screening|cv|resume)\b",
            r"\b(direct|instant|immediate)\s+(joining|hiring|selection|appointment)\b",
            r"\b(selected|shortlisted)\b[^.!?]{0,25}?\bwithout\b",
        ),
        contexts=frozenset({"job_offer"}),
    ),
    Rule(
        id="invoice.bank_change",
        title="Bank details changed on an invoice",
        category="payment",
        severity="critical",
        explanation=(
            "Changed payment details on a real invoice is the signature of business email "
            "compromise. Confirm by phoning a number you already had."
        ),
        patterns=_p(
            r"\b(bank|account|payment)\s+(details|information)\s+(have\s+)?(changed|updated|new)\b",
            r"\b(new|updated|revised)\s+(bank|account)\s+(details|number|information)\b",
            r"\b(use|note)\s+(the\s+)?(new|updated)\s+account\b",
        ),
        contexts=frozenset({"invoice"}),
    ),
    Rule(
        id="proposal.guaranteed_return",
        title="Guaranteed or fixed returns",
        category="lure",
        severity="critical",
        explanation=(
            "No lawful investment can guarantee a return. A guarantee is either a lie or an "
            "unregistered scheme."
        ),
        patterns=_p(
            r"\b(guaranteed|assured|fixed|risk[-\s]?free)\s+(returns?|profits?|income)\b",
            r"\b\d{2,}\s*%\s*(returns?|profit|monthly|guaranteed)\b",
            r"\b(double|triple)\s+your\s+(money|investment)\b",
        ),
        contexts=frozenset({"proposal"}),
    ),
]

# --------------------------------------------------------------------------
# Tamil written in Latin script
# --------------------------------------------------------------------------

_DO = r"(?:pannu(?:nga|ngo|ga)?|panu(?:nga|ga)?|paNNunga)"
_GIVE = r"(?:k[ou]du(?:nga|ngo|ga)?|kudu|kodu)"

TAMIL: list[Rule] = [
    Rule(
        id="ta.otp_request",
        title="Asks you to share an OTP or PIN (Tamil)",
        category="credentials",
        severity="critical",
        explanation=(
            "No bank or payment app asks for an OTP, PIN or CVV — not by phone, not to "
            "\"verify\" anything. Anyone asking is trying to take money from the account."
        ),
        patterns=_p(
            rf"\b(otp|pin|cvv|password)\b[^.!?]{{0,40}}?\b(?:{_GIVE}|share\s*{_DO}|sollu(?:nga)?)",
            rf"\b(otp|pin|cvv)[\s-]*(?:ah|a|ai|va)?\b[^.!?]{{0,30}}?\b(?:{_GIVE}|share)",
        ),
    ),
    Rule(
        id="ta.account_block",
        title="Threatens that the account will be blocked (Tamil)",
        category="threat",
        severity="high",
        explanation=(
            "Manufactured urgency. A real bank writes through its app or by post and gives "
            "you time; it does not threaten closure within hours over a message."
        ),
        patterns=_p(
            r"\b(account|akkaun[dt]|kanakku)\b[^.!?]{0,40}?\b(block|blaak|close|freeze|nirutha|niruthi)\w*\b",
            r"\b(block|close)\s*(aagidum|aagum|agiduum|aayidum)\b",
            r"\b(kyc)\b[^.!?]{0,40}?\b(update|expire|mudinj\w*|mudiy\w*)\b",
        ),
    ),
    Rule(
        id="ta.money_transfer",
        title="Asks you to transfer or send money (Tamil)",
        category="payment",
        severity="high",
        explanation=(
            "A request to move money from a message you did not expect. Verify through a "
            "number you already have before sending anything."
        ),
        patterns=_p(
            rf"\b(panam|money|amount|rupees?|rs\.?)\b[^.!?]{{0,40}}?\b(?:anupp|anup|send|transfer|pod)\w*\s*(?:{_DO})?",
            rf"\b(?:anupp|anup)\w*\s*{_DO}\b",
            r"\b(deposit|advance|fees?|fee)\b[^.!?]{0,30}?\b(kattunga|kattanum|katta)\b",
        ),
    ),
    Rule(
        id="ta.link_click",
        title="Pushes you to open a link (Tamil)",
        category="link",
        severity="medium",
        explanation=(
            "A link plus urgency is how credential-stealing pages are delivered. Open your "
            "bank through its own app instead."
        ),
        patterns=_p(
            rf"\b(link|website|site)\b[^.!?]{{0,30}}?\b(?:click|open|pathunga|paarunga)\w*\s*(?:{_DO})?",
            rf"\bclick\s*{_DO}\b",
        ),
    ),
    Rule(
        id="ta.urgency",
        title="Demands that you act immediately (Tamil)",
        category="urgency",
        severity="medium",
        explanation=(
            "Pressure to act now exists to stop you checking with anyone. A genuine "
            "institution is willing to wait."
        ),
        patterns=_p(
            r"\b(udane|udaney|seekiram|sikkiram|ippove|ippothe)\b",
            r"\b(last|kadaisi|final)\s*(chance|warning|notice|vaippu)\b",
        ),
    ),
    Rule(
        id="ta.impersonation",
        title="Claims to be from a bank or the authorities (Tamil)",
        category="impersonation",
        severity="high",
        explanation=(
            "Anyone can claim an identity in a message. Real officials do not demand "
            "payments or codes over chat."
        ),
        patterns=_p(
            r"\b(bank|vangi)\b[^.!?]{0,25}?\b(?:il|la|lerundhu|irundhu|iruthu)\b[^.!?]{0,25}?\b(pesure|pesuren|pesuraen|call|speaking)\b",
            r"\b(police|cyber\s*crime|customs|income\s*tax)\b[^.!?]{0,30}?\b(?:il|la|lerundhu|irundhu)\b",
        ),
    ),
    Rule(
        id="ta.remote_access",
        title="Asks you to install an app or share your screen (Tamil)",
        category="channel",
        severity="critical",
        explanation=(
            "Screen-sharing hands over everything you can see, including balances and codes. "
            "No genuine support process needs it."
        ),
        patterns=_p(
            rf"\b(anydesk|teamviewer|quicksupport|screen\s*shar\w*)\b[^.!?]{{0,40}}?\b(?:install|download|{_DO})",
            rf"\b(app|application)\b[^.!?]{{0,25}}?\b(?:install|download)\s*{_DO}\b",
        ),
    ),
]

ALL_RULES: list[Rule] = GENERIC + CONTEXTUAL + TAMIL

#: Ceiling on spans kept per rule — a report is evidence, not a concordance.
MAX_MATCHES_PER_RULE = 4


def _collect(text: str, patterns: Iterable[re.Pattern[str]]) -> list[Match]:
    """Every distinct span matching any of ``patterns``, in document order."""
    out: list[Match] = []
    seen: set[str] = set()
    for pattern in patterns:
        for m in pattern.finditer(text):
            span = m.group(0).strip()
            key = span.lower()
            if not span or key in seen:
                continue
            seen.add(key)
            out.append(Match(text=span, start=m.start(), end=m.start() + len(span)))
            if len(out) >= MAX_MATCHES_PER_RULE:
                return out
    return out


def detect(text: str, context: str = "generic") -> list[Signal]:
    """Run every applicable rule and return the ones that fired.

    Tamil rules run unconditionally: real messages mix languages freely, and an
    English bank name beside a Tamil demand is the norm rather than the
    exception, so gating them on a detected language would miss most of them.
    """
    if context not in CONTEXTS:
        context = "generic"

    signals: list[Signal] = []
    for rule in ALL_RULES:
        if rule.contexts and context not in rule.contexts:
            continue
        matches = _collect(text, rule.patterns)
        if not matches:
            continue
        signals.append(
            Signal(
                id=rule.id,
                title=rule.title,
                category=rule.category,
                severity=rule.severity,
                explanation=rule.explanation,
                matches=matches,
            )
        )

    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    signals.sort(key=lambda s: order[s.severity])
    return signals


def rule_count(context: str = "generic") -> int:
    """How many rules were eligible, for the report's completeness figure."""
    return sum(1 for r in ALL_RULES if not r.contexts or context in r.contexts)
