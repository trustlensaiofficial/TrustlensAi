"""Detection tests.

Both directions matter equally. Missing a scam fails the person it was written
for; flagging an ordinary message trains them to ignore the product, and then
the real warning is ignored too.
"""

import pytest

from trustlens.rules import detect, rule_count
from trustlens.report import build


def ids(text: str, context: str = "generic") -> set[str]:
    return {s.id for s in detect(text, context)}


# --------------------------------------------------------------- scams ----

@pytest.mark.parametrize(
    "text,expected",
    [
        ("Please share the OTP sent to your mobile now", "credentials.request"),
        ("To stop the transaction, enter your UPI PIN immediately", "credentials.request"),
        ("The OTP has been sent — read it out to our executive", "credentials.request"),
        ("Your account will be blocked today", "threat.account_action"),
        ("Install AnyDesk so our executive can help you", "channel.remote_access"),
        ("Do not tell anyone, keep this confidential", "secrecy.do_not_tell"),
        ("This is from the Cyber Crime department", "impersonation.authority"),
        ("Complete this within 2 hours or lose access", "urgency.deadline"),
    ],
)
def test_catches_the_demand(text, expected):
    assert expected in ids(text)


def test_catches_a_full_bank_phishing_message():
    text = (
        "Dear customer, your HDFC account will be blocked today. Complete KYC "
        "immediately at http://kyc-update-secure.xyz and share the OTP with our executive."
    )
    found = ids(text, "bank_scam")
    assert "credentials.request" in found
    assert "threat.account_action" in found
    assert "link.suspicious" in found
    assert build(text, "bank_scam")["assessment"]["level"] == "high_risk"


# --------------------------------------------------------------- Tamil ----

@pytest.mark.parametrize(
    "text,expected",
    [
        ("Sir, unga account verify panna OTP-ah share pannunga", "ta.otp_request"),
        ("OTP number kudunga, bank la irundhu pesuren", "ta.otp_request"),
        ("Unga account inniku block aagidum, KYC update pannunga", "ta.account_block"),
        ("Safe account ku panam transfer pannunga", "ta.money_transfer"),
        ("AnyDesk app download pannunga", "ta.remote_access"),
        ("Udane pannunga, illa na problem aagum", "ta.urgency"),
    ],
)
def test_catches_tamil_written_in_english_letters(text, expected):
    assert expected in ids(text)


@pytest.mark.parametrize("verb", ["pannunga", "panunga", "pannuga", "paNNunga"])
def test_accepts_the_spellings_people_actually_type(verb):
    assert "ta.otp_request" in ids(f"OTP ah share {verb}")


# ------------------------------------------------------------- benign -----

@pytest.mark.parametrize(
    "text",
    [
        "I got the OTP for the train booking, the ticket is confirmed. See you Sunday.",
        "The OTP never arrived, I had to book again.",
        "Did you receive the verification code from the college portal?",
        "Rs 2,480.00 debited from A/c XX4412 at SPENCERS. Not you? Call the number on your card.",
        "Hi, can you share the Q3 deck before the review?",
        "Amma naan hostel vandhutaen. Saaptacha? Call pannu.",
        "Pa, I paid the hostel fee today. Please send money for books when you can, no hurry.",
    ],
)
def test_leaves_ordinary_messages_alone(text):
    report = build(text)
    assert report["assessment"]["level"] == "no_signals_detected", report["signals"]


def test_a_mention_is_not_a_demand():
    """The distinction the whole credential rule turns on."""
    assert "credentials.request" not in ids("I got the OTP for the train booking")
    assert "credentials.request" in ids("Send me the OTP you just received")


# -------------------------------------------------------------- shape -----

def test_every_signal_quotes_the_exact_span():
    signals = detect("Please share the OTP sent to your mobile")
    assert signals
    for s in signals:
        assert s.matches
        for m in s.matches:
            assert m.text
            assert m.end > m.start


def test_report_never_claims_safety():
    report = build("Hello, see you at four.")
    joined = " ".join(report["uncertainty"]["limits"]).lower()
    assert "not the same as safe" in joined
    assert "identity is not established" in " ".join(report["uncertainty"]["notChecked"]).lower()


def test_report_always_offers_the_helpline():
    actions = " ".join(s["action"] for s in build("Hello")["checklist"])
    assert "1930" in actions


def test_context_rules_only_fire_in_their_context():
    text = "Pay the registration fee of 2500 to confirm your seat"
    assert "job.upfront_fee" in ids(text, "job_offer")
    assert "job.upfront_fee" not in ids(text, "bank_scam")


def test_rule_count_reflects_the_selected_context():
    assert rule_count("job_offer") > rule_count("website")


def test_scanning_twice_gives_the_same_answer():
    text = "Share the OTP immediately"
    assert ids(text) == ids(text)
