import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const description = "Important information about the accuracy and limitations of ZSpace Tools' online tools and guides.";

export const metadata: Metadata = pageMetadata({ title: "Disclaimer", description, path: "/disclaimer/" });

export default function DisclaimerPage() {
  return (
    <ProsePage path="/disclaimer/" eyebrow="Disclaimer" title="Disclaimer" updated="2026-11-12" description={description}>
      <p>
        {site.name} provides free tools and guides for general, everyday use. We test our tools carefully, but we can&rsquo;t guarantee that every result will
        be suitable for your particular purpose.
      </p>

      <h2>Tool results</h2>
      <ul>
        <li>
          <strong>Compression</strong> results vary with the content of each file, the settings you choose and your browser. Lossy compression permanently
          removes some image detail. Always keep your original files and check compressed output before deleting anything.
        </li>
        <li>
          <strong>QR codes</strong> should be test-scanned with more than one device before they are printed or published. Colour choices, logos, print size and
          surface can all affect scanning.
        </li>
        <li>
          <strong>Word, character and time counts</strong> are estimates. Different platforms and institutions count text in different ways, so check against the
          rules that apply to you.
        </li>
        <li>
          <strong>Password strength</strong> figures are mathematical estimates based on randomness. They don&rsquo;t account for passwords being reused, stored
          insecurely or captured by malware. Use a reputable password manager and enable multi-factor authentication where available.
        </li>
      </ul>

      <h2>Guides and articles</h2>
      <p>
        Articles on our <Link href="/blog/">blog</Link> are written for general information. Platform limits, browser behaviour and best practices change over
        time. Nothing on this website is legal, security, or other professional advice.
      </p>

      <h2>External links</h2>
      <p>Links to other websites are provided for convenience. We don&rsquo;t control and aren&rsquo;t responsible for their content.</p>

      <h2>Questions</h2>
      <p>
        If you think something on this site is inaccurate, please tell us at <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> and we&rsquo;ll
        look into it.
      </p>
    </ProsePage>
  );
}
