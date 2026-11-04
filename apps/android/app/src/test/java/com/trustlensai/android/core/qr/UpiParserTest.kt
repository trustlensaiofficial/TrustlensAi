package com.trustlensai.android.core.qr

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * On-device UPI parsing.
 *
 * These matter because the parse result is what the user is shown before any
 * data leaves the phone. A wrong payee or a missing amount at that moment is
 * worse than no preview at all, since the preview is what they consent on.
 */
class UpiParserTest {

    @Test
    fun `reads a plain payment code`() {
        val u = UpiParser.parse("upi://pay?pa=merchant@okaxis&pn=Chai%20Stall&am=40&cu=INR&tn=Tea")
        assertNotNull(u)
        assertEquals("pay", u!!.mode)
        assertEquals("merchant@okaxis", u.payeeVpa)
        assertEquals("Chai Stall", u.payeeName)
        assertEquals("40", u.amount)
        assertEquals("INR", u.currency)
        assertEquals("Tea", u.note)
    }

    @Test
    fun `distinguishes a collect request from a payment`() {
        assertEquals("collect", UpiParser.parse("upi://collect?pa=refunds@okaxis&am=2499")!!.mode)
        assertEquals("mandate", UpiParser.parse("upi://mandate?pa=sub@okicici&am=499")!!.mode)
    }

    @Test
    fun `every mode debits the reader`() {
        // No UPI mechanism pulls money into your account. This is the fact the
        // whole refund scam depends on people not knowing.
        for (mode in listOf("pay", "collect", "mandate")) {
            assertTrue(mode, UpiParser.parse("upi://$mode?pa=a@b")!!.userWouldPay)
        }
    }

    @Test
    fun `finds a code embedded in a message`() {
        val u = UpiParser.parse("Your refund is ready. Tap upi://pay?pa=refund@okaxis&am=2499 to claim it")
        assertEquals("refund@okaxis", u!!.payeeVpa)
        assertEquals("upi://pay?pa=refund@okaxis&am=2499", u.raw)
    }

    @Test
    fun `returns null rather than guessing`() {
        assertNull(UpiParser.parse(null))
        assertNull(UpiParser.parse(""))
        assertNull(UpiParser.parse("   "))
        assertNull(UpiParser.parse("https://example.com/pay"))
        assertNull(UpiParser.parse("just some text"))
        // A mode we do not understand must not be read as one we do.
        assertNull(UpiParser.parse("upi://transfer?pa=a@b"))
        // A scheme with no query is not a usable instruction.
        assertNull(UpiParser.parse("upi://pay"))
    }

    @Test
    fun `survives an unencoded space in a payee name`() {
        // Real codes in the wild do this, and java.net.URI throws on it. A
        // parser that gave up here would leave the user with nothing to check.
        val u = UpiParser.parse("upi://pay?pa=shop@okaxis&pn=Ravi Stores&am=120")
        assertNotNull(u)
        assertEquals("shop@okaxis", u!!.payeeVpa)
        assertEquals("Ravi Stores", u.payeeName)
        // The amount sits AFTER the space. Asserting only the payee let a real
        // bug through: the pattern stopped at the first space and silently
        // dropped every later parameter, so a preview would have shown a payee
        // with no amount.
        assertEquals("120", u.amount)
    }

    @Test
    fun `takes the first value when a parameter is duplicated`() {
        // Showing one amount and sending another is a known trick, so the
        // first occurrence wins and the behaviour is pinned rather than
        // left to whichever way the map happens to build.
        val u = UpiParser.parse("upi://pay?pa=a@b&am=1&am=99999")
        assertEquals("1", u!!.amount)
    }

    @Test
    fun `assumes rupees only when an amount is actually present`() {
        assertEquals("INR", UpiParser.parse("upi://pay?pa=a@b&am=50")!!.currency)
        // No amount means no currency to state. Inventing one would be a
        // fact we do not have.
        assertNull(UpiParser.parse("upi://pay?pa=a@b")!!.currency)
    }

    @Test
    fun `treats a blank parameter as absent`() {
        val u = UpiParser.parse("upi://pay?pa=a@b&pn=&am=")
        assertNull(u!!.payeeName)
        assertNull(u.amount)
    }

    @Test
    fun `is case insensitive about the scheme`() {
        assertNotNull(UpiParser.parse("UPI://PAY?pa=a@b"))
    }

    @Test
    fun `decodes plus as a space`() {
        assertEquals("Ravi Stores", UpiParser.parse("upi://pay?pa=a@b&pn=Ravi+Stores")!!.payeeName)
    }

    @Test
    fun `tolerates a stray percent that is not an escape`() {
        val u = UpiParser.parse("upi://pay?pa=a@b&tn=100%25 off&am=10")
        assertNotNull(u)
        assertEquals("10", u!!.amount)
    }

    @Test
    fun `looksLikePayment agrees with parse`() {
        assertTrue(UpiParser.looksLikePayment("upi://pay?pa=a@b"))
        assertFalse(UpiParser.looksLikePayment("https://example.com"))
        assertFalse(UpiParser.looksLikePayment(null))
    }
}
