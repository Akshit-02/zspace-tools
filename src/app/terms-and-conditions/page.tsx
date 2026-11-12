import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const description = "The terms that apply when you use ZSpace Tools' free online tools and website.";

export const metadata: Metadata = pageMetadata({ title: "Terms and Conditions", description, path: "/terms-and-conditions/" });

export default function TermsPage() {
  return (
    <ProsePage path="/terms-and-conditions/" eyebrow="Terms & Conditions" title="Terms and Conditions" updated="2026-11-12" description={description}>
      <p>
        These terms apply to your use of the {site.name} website and its tools (the &ldquo;Service&rdquo;). By using the Service you agree to them. If you
        don&rsquo;t agree, please don&rsquo;t use the Service.
      </p>

      <h2>1. Using the Service</h2>
      <p>
        The Service is provided free of charge for personal and commercial use. You may use the tools to process files and content that you own or have the
        right to use. You must not use the Service for anything unlawful, to infringe anyone else&rsquo;s rights, or in a way that disrupts or overloads the
        website.
      </p>

      <h2>2. Your content</h2>
      <p>
        You keep all rights to the files and content you process. Because our tools run in your browser, your content is not uploaded to us and we claim no
        rights over it. You are responsible for keeping your own copies of important files and for checking results before relying on them.
      </p>

      <h2>3. Output and generated content</h2>
      <p>
        You may use the output of the tools — compressed files, QR codes, passwords and statistics — for any lawful purpose, without attribution. QR codes are
        static: their content cannot be changed after creation, and you are responsible for testing them before printing or distributing them.
      </p>

      <h2>4. Availability</h2>
      <p>
        We work to keep the Service available and accurate, but we may change, suspend or discontinue any part of it at any time, without notice. Tools depend on
        features of your browser and device, and results can vary between them.
      </p>

      <h2>5. No warranty</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind, whether express or implied, including
        fitness for a particular purpose and non-infringement. See our <Link href="/disclaimer/">Disclaimer</Link> for more detail.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {site.name} is not liable for any indirect, incidental, special or consequential loss, or for any loss of data,
        profits or business, arising from your use of, or inability to use, the Service. Nothing in these terms excludes liability that cannot be excluded by
        law.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The {site.name} name, logo, website design and written content are protected by intellectual property laws. You may not copy or reuse them without
        permission, except as allowed by law. Open-source components remain under their own licences.
      </p>

      <h2>8. Links to other websites</h2>
      <p>The Service may link to third-party websites. We are not responsible for their content or practices.</p>

      <h2>9. Changes to these terms</h2>
      <p>We may update these terms from time to time. The date at the top shows when they last changed. Continued use of the Service means you accept the updated terms.</p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </ProsePage>
  );
}
