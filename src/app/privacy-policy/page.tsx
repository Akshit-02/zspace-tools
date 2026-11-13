import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";
import { analyticsConfig, site } from "@/lib/site";

const description = "How ZSpace Tools handles your data: files and text are processed in your browser and never uploaded. Read what little we do collect, and why.";

export const metadata: Metadata = pageMetadata({ title: "Privacy Policy", description, path: "/privacy-policy/" });

const UPDATED = "2026-11-12";

export default function PrivacyPage() {
  const analyticsOn = Boolean(analyticsConfig.gaId || analyticsConfig.gtmId);
  return (
    <ProsePage path="/privacy-policy/" eyebrow="Privacy Policy" title="Privacy Policy" updated={UPDATED} description={description}>
      <p>
        This policy explains what information {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles when you use this website, and how. The short version:
        the files, text and passwords you use with our tools stay on your device.
      </p>

      <h2>Your files and inputs stay on your device</h2>
      <p>All tools currently on {site.name} run entirely in your web browser:</p>
      <ul>
        <li>
          <strong>Image Compressor, Image Resizer, Image Cropper and Image to PDF Converter</strong> read, crop, resize, compress and convert your images locally using your
          browser&rsquo;s built-in capabilities. Images are not uploaded to our servers or to any third party.
        </li>
        <li>
          <strong>PDF Compressor, PDF Merger and PDF Splitter</strong> open and process your PDFs locally. Documents — and the page previews generated from
          them — are never uploaded.
        </li>
        <li>
          <strong>QR Code Generator</strong> creates codes in your browser. The links, text, contact details and Wi-Fi credentials you enter are not transmitted.
        </li>
        <li>
          <strong>Word Counter, Case Converter, Markdown Editor, JSON Formatter, URL Encoder, Base64 Encoder, CSV to JSON Converter, UUID Generator, URL Slug Generator, Regex Tester, HTML Formatter, CSS Minifier and Color Picker</strong> work on your text, files and data
          in your browser. Pasted text, URLs, JSON, CSV, HTML and CSS, regex patterns and test text — including any keys or personal data inside them — are not transmitted or saved.
        </li>
        <li>
          <strong>PDF to Word, Word to PDF, PDF to Excel, Excel to PDF, PDF to JPG &amp; PNG, Image Converter, Image to Text (OCR), PDF Editor, PDF Page Organizer, Sign PDF, Protect PDF, Unlock PDF, Watermark PDF, Add Page Numbers and PDF to PowerPoint</strong> convert your documents and images in your
          browser. Files are never uploaded. The OCR engine, its language data and the HEIC/AVIF image decoders are downloaded from this website (not a third
          party) only when you use them, and your browser may cache them. Word to PDF uses your browser&apos;s own print dialog to save the PDF. Signatures you draw, type or upload in Sign PDF are kept only in your browser&apos;s memory while the page is open — they are never uploaded or stored. Passwords you enter in Protect PDF or Unlock PDF are used once inside your browser to encrypt or decrypt the file and are then cleared — they are never uploaded, stored, logged or included in analytics.
        </li>
        <li>
          <strong>Meta Tag Generator, XML Sitemap Generator, Robots.txt Generator, Open Graph Preview and HTML Entity Encoder</strong> build their output in your
          browser. They don&apos;t crawl or fetch websites and don&apos;t submit anything to search engines. When you enter an image URL in the Meta Tag Generator or
          Open Graph Preview, your browser loads that image directly from its own server to show the preview — that server sees an ordinary image request from
          your browser, as it would on any website. Local images you pick for a preview stay on your device.
        </li>
        <li>
          <strong>EMI, GST, Discount, Percentage, Age and Days Between Dates calculators and the Unit Converter</strong> calculate in your browser. Loan details, amounts,
          measurements and dates — including your date of birth — are not transmitted, stored or included in analytics.
        </li>
        <li>
          <strong>Invoice Generator</strong> builds invoices and PDFs in your browser. Business, customer and payment details are never uploaded. If you turn on
          &ldquo;Keep draft in this browser&rdquo; (Invoice Generator or Markdown Editor), your draft is stored in your browser&rsquo;s local storage on that
          device only; switching it off deletes it.
        </li>
        <li>
          <strong>Password Generator</strong> uses your browser&rsquo;s cryptographic random number generator. Passwords are not transmitted, stored or logged.
        </li>
      </ul>
      <p>
        Results exist only in your browser tab&rsquo;s memory and are discarded when you close or reload the page. We don&rsquo;t use your content to train
        models or for any other purpose — we never receive it.
      </p>

      <h2>Information collected automatically</h2>
      <p>
        Like almost every website, the servers that deliver our pages may record standard request information — such as IP address, browser type, the page
        requested and the time of the request — for security, abuse prevention and reliability. These logs are kept by our hosting provider for a limited period
        and are not used to identify you.
      </p>

      <h2>Analytics</h2>
      {analyticsOn ? (
        <>
          <p>
            We use Google Analytics{analyticsConfig.gtmId ? " (via Google Tag Manager)" : ""} to understand how the site is used in aggregate — for example, which
            tools are opened and whether compression completed. Google Analytics uses cookies and similar technologies and processes data such as your
            approximate location, device type and pages visited. See{" "}
            <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</a>.
          </p>
          <p>
            The events we send never include your files, file names, the text you type, QR code contents or passwords. They are limited to things like the tool
            name, file type, a size range and the percentage saved.
          </p>
          <p>
            You can opt out of Google Analytics with your browser&rsquo;s privacy settings, a content blocker, or Google&rsquo;s{" "}
            <a href="https://tools.google.com/dlpage/gaoptout">opt-out browser add-on</a>.
          </p>
        </>
      ) : (
        <p>{site.name} does not currently use analytics or advertising cookies. If that changes, this policy will be updated before it happens.</p>
      )}

      <h2>Cookies and local storage</h2>
      <p>
        {analyticsOn
          ? "Apart from the analytics cookies described above, we do not set cookies."
          : "We do not set cookies."}{" "}
        Local storage is used only for drafts you explicitly choose to keep.{" "}
        We do not use advertising, cross-site tracking or fingerprinting.
      </p>

      <h2>Contacting us</h2>
      <p>
        If you email us, we receive your email address and whatever you include in your message. We use it only to reply and keep it no longer than needed. Please
        don&rsquo;t send private files or passwords.
      </p>

      <h2>Children</h2>
      <p>{site.name} is a general-audience website and does not knowingly collect personal information from children.</p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct or delete personal data held about you, or to object to its processing. Because our
        tools don&rsquo;t receive your content, there is usually very little we hold. To make a request, contact us at the address below.
      </p>

      <h2>Changes to this policy</h2>
      <p>If we change how we handle information, we&rsquo;ll update this page and the date at the top.</p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. See also our <Link href="/terms-and-conditions/">Terms and
        Conditions</Link> and <Link href="/disclaimer/">Disclaimer</Link>.
      </p>
    </ProsePage>
  );
}
