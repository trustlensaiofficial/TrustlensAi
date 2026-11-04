"""Turning fired rules into the report a person reads."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .rules import Signal, detect, rule_count

Level = Literal["high_risk", "elevated_risk", "some_signals", "no_signals_detected"]

#: Weight each severity contributes to the ranking score. This is an internal
#: ordering aid, never a probability, and the API never presents it as one.
_WEIGHT = {"critical": 10, "high": 6, "medium": 3, "low": 1}


@dataclass(frozen=True)
class Assessment:
    level: Level
    headline: str
    summary: str
    signal_score: int

    def as_dict(self) -> dict:
        return {
            "level": self.level,
            "headline": self.headline,
            "summary": self.summary,
            "signalScore": self.signal_score,
        }


def _level(signals: list[Signal]) -> tuple[Level, str]:
    """Pick the verdict.

    A single critical rule is enough on its own: a request for an OTP does not
    become safer because nothing else matched. Everything else is graded on
    accumulated weight, and the wording never says "safe" — only that our
    checks did not match, which is a different claim.
    """
    if any(s.severity == "critical" for s in signals):
        return "high_risk", (
            "Multiple strong warning signs — treat this as unsafe until you have "
            "verified it independently"
        )

    score = sum(_WEIGHT[s.severity] for s in signals)
    if score >= 12:
        return "high_risk", (
            "Multiple strong warning signs — treat this as unsafe until you have "
            "verified it independently"
        )
    if score >= 6:
        return "elevated_risk", "Several things here need verifying before you act"
    if score > 0:
        return "some_signals", "A few things worth checking before you act"
    return "no_signals_detected", "No strong warning signs found"


def _checklist(signals: list[Signal], context: str) -> list[dict]:
    """Concrete next steps, ordered by how much they reduce the risk."""
    ids = {s.id for s in signals}
    steps: list[dict] = []

    def add(action: str, why: str) -> None:
        steps.append({"action": action, "why": why})

    if {"credentials.request", "ta.otp_request"} & ids:
        add(
            "Do not share the code. End the call or stop replying.",
            "A one-time code is the last thing standing between someone and your account.",
        )
    if {"channel.remote_access", "ta.remote_access"} & ids:
        add(
            "Do not install anything. If you already did, turn off the internet and remove it.",
            "Remote-access tools show them everything on your screen, including codes.",
        )
    if context == "bank_scam" or {"bank.fake_support", "ta.impersonation"} & ids:
        add(
            "Call your bank on the number printed on your card — never a number from the message.",
            "A number inside the message is the scammer's own.",
        )
    if {"link.suspicious", "ta.link_click"} & ids:
        add(
            "Do not open the link. Go to the official app or type the address yourself.",
            "A link can show one name and lead somewhere else entirely.",
        )
    if {"payment.transfer_demand", "ta.money_transfer", "invoice.bank_change"} & ids:
        add(
            "Do not send money until you have confirmed on a number you already had.",
            "Transfers are effectively irreversible once made.",
        )

    add(
        "If money has already gone, call 1930 and your bank immediately.",
        "India's cyber-financial fraud helpline. The first hours decide whether a transfer can be frozen.",
    )
    return steps


def build(text: str, context: str = "generic") -> dict:
    """The full report for one piece of text."""
    signals = detect(text, context)
    level, headline = _level(signals)
    total = rule_count(context)
    critical = sum(1 for s in signals if s.severity == "critical")

    if signals:
        summary = (
            f"{len(signals)} of {total} deterministic rules matched this message"
            + (f", including {critical} rated critical." if critical else ".")
            + " Each warning sign shows the exact text that triggered it."
        )
    else:
        summary = (
            f"None of the {total} deterministic rules matched. That is not proof this is "
            "genuine — it only means our checks did not match anything."
        )

    return {
        "assessment": Assessment(level, headline, summary, sum(_WEIGHT[s.severity] for s in signals)).as_dict(),
        "inputContext": context,
        "inputPreview": text[:280],
        "signals": [s.as_dict() for s in signals],
        "checklist": _checklist(signals, context),
        "uncertainty": {
            "checked": ["Wording and phrasing against the deterministic rule set"],
            "notChecked": [
                "Whether the sender is who they claim to be — identity is not established",
                "Where the sender physically is — a number's region is not a location",
                "Whether any link is live, and where it actually resolves to",
            ],
            "limits": [
                "No warning found is not the same as safe.",
                "This service reports patterns and evidence. It cannot certify that content "
                "is genuine or fraudulent, and it does not establish intent.",
            ],
        },
        "rulesEvaluated": total,
    }
