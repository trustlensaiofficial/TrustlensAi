package com.trustlensai.android.core.share

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * What a share actually gave us.
 *
 * The rule being protected: anything the share referenced but we cannot use
 * must be reported, never dropped quietly. A confident verdict computed on
 * half of what someone sent is the worst outcome this screen can produce.
 */
class ShareExtractorTest {

    @Test
    fun `keeps plain shared text`() {
        val p = ShareExtractor.build(text = "  Your KYC expires today  ")
        assertEquals("Your KYC expires today", p.text)
        assertTrue(p.hasAnything)
        assertTrue(p.skipped.isEmpty())
    }

    @Test
    fun `reports an empty share instead of pretending`() {
        val p = ShareExtractor.build(text = null)
        assertFalse(p.hasAnything)
        assertNull(p.analysableText())
    }

    @Test
    fun `treats whitespace-only text as nothing`() {
        assertFalse(ShareExtractor.build(text = "   \n  ").hasAnything)
    }

    @Test
    fun `analyses the subject as well as the body`() {
        // Email shares often carry the lure in the subject.
        val p = ShareExtractor.build(text = "Click to verify.", subject = "Your account is blocked")
        val t = p.analysableText()!!
        assertTrue(t.contains("Your account is blocked"))
        assertTrue(t.contains("Click to verify."))
    }

    @Test
    fun `uses the subject alone when there is no body`() {
        assertEquals("Urgent: verify now", ShareExtractor.build(text = null, subject = "Urgent: verify now").analysableText())
    }

    @Test
    fun `finds links and strips trailing punctuation`() {
        // A full stop absorbed into the host would make every lookalike
        // comparison on the server wrong.
        val urls = ShareExtractor.extractUrls("Go to https://sbi-verify.example.com/login. Now!")
        assertEquals(listOf("https://sbi-verify.example.com/login"), urls)
    }

    @Test
    fun `keeps several links in order without duplicates`() {
        val urls = ShareExtractor.extractUrls("a https://one.example b https://two.example c https://one.example")
        assertEquals(listOf("https://one.example", "https://two.example"), urls)
    }

    @Test
    fun `drops an unbalanced closing bracket from prose`() {
        assertEquals(
            listOf("https://example.com/path"),
            ShareExtractor.extractUrls("see the site (https://example.com/path)"),
        )
    }

    @Test
    fun `keeps a balanced bracket that belongs to the link`() {
        val urls = ShareExtractor.extractUrls("https://example.com/a_(b)_c")
        assertEquals(listOf("https://example.com/a_(b)_c"), urls)
    }

    @Test
    fun `finds no links in plain text`() {
        assertTrue(ShareExtractor.extractUrls("no links here at all").isEmpty())
        assertTrue(ShareExtractor.extractUrls(null).isEmpty())
    }

    @Test
    fun `accepts a supported image`() {
        val p = ShareExtractor.build(
            text = null,
            uris = listOf("content://media/1"),
            mimeTypeOf = { "image/jpeg" },
            sizeOf = { 1024 },
        )
        assertEquals(listOf("content://media/1"), p.imageUris)
        assertTrue(p.skipped.isEmpty())
        assertTrue(p.hasAnything)
    }

    @Test
    fun `reports an attachment it cannot read`() {
        val p = ShareExtractor.build(text = "see this", uris = listOf("content://media/1"), mimeTypeOf = { null })
        assertTrue(p.imageUris.isEmpty())
        assertEquals(1, p.skipped.size)
        assertTrue(p.skipped[0].contains("could not be read"))
    }

    @Test
    fun `reports a non-image attachment by its type`() {
        val p = ShareExtractor.build(text = null, uris = listOf("content://doc/1"), mimeTypeOf = { "application/pdf" })
        assertTrue(p.imageUris.isEmpty())
        assertTrue(p.skipped.single().contains("application/pdf"))
    }

    @Test
    fun `refuses an oversized image rather than resizing it silently`() {
        val p = ShareExtractor.build(
            text = null,
            uris = listOf("content://media/big"),
            mimeTypeOf = { "image/png" },
            sizeOf = { ShareExtractor.MAX_IMAGE_BYTES + 1 },
        )
        assertTrue(p.imageUris.isEmpty())
        assertTrue(p.skipped.single().contains("limit is"))
    }

    @Test
    fun `accepts an image whose size is unknown`() {
        // Some providers do not report a size. Refusing on that basis would
        // break ordinary shares from ordinary apps.
        val p = ShareExtractor.build(
            text = null,
            uris = listOf("content://media/1"),
            mimeTypeOf = { "image/jpeg" },
            sizeOf = { null },
        )
        assertEquals(1, p.imageUris.size)
        assertTrue(p.skipped.isEmpty())
    }

    @Test
    fun `handles a multi-image share with one bad item`() {
        val p = ShareExtractor.build(
            text = "look at these",
            uris = listOf("content://a", "content://b", "content://c"),
            mimeTypeOf = { uri -> if (uri == "content://b") "video/mp4" else "image/jpeg" },
        )
        assertEquals(listOf("content://a", "content://c"), p.imageUris)
        // The dropped one is reported, not swallowed.
        assertEquals(1, p.skipped.size)
    }

    @Test
    fun `truncates very long text and says that it did`() {
        val p = ShareExtractor.build(text = "x".repeat(30_000))
        assertEquals(20_000, p.text!!.length)
        assertTrue(p.skipped.single().contains("only the beginning was kept"))
    }
}
