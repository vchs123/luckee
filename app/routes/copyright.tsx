import type { MetaFunction } from "react-router";
import { LegalLayout } from "~/components/LegalLayout";

export const meta: MetaFunction = () => [
  { title: "Copyright Policy | Luckee" },
  { name: "description", content: "Copyright, trademarks and takedown requests on Luckee." },
];

export default function Copyright() {
  return (
    <LegalLayout eyebrow="©️ Legal" title="Copyright Policy" updated="August 2026" active="/copyright">
      <p>Luckee respects intellectual property rights and asks the same of everyone who uses the platform.</p>

      <h2>Our content</h2>
      <p>The Luckee name, logo, written guides, layout and original graphics are owned by Luckee and protected by copyright and trademark law. You may share links to our pages, but please don't republish our content wholesale without permission.</p>

      <h2>Third-party brands</h2>
      <p>Brand names, logos and trademarks that appear on Luckee (for example, in freebie and deal listings) belong to their respective owners. They're used for identification and editorial purposes only, and their appearance doesn't imply endorsement of Luckee unless stated.</p>

      <h2>Reporting infringement</h2>
      <p>If you believe content on Luckee infringes your copyright or trademark, email us with:</p>
      <ul>
        <li>a description of the work and where it appears on Luckee (a link);</li>
        <li>your contact details; and</li>
        <li>a statement that you're the rights holder or authorised to act on their behalf.</li>
      </ul>
      <p>We'll review and, where appropriate, remove or amend the content promptly.</p>

      <h2>Contact</h2>
      <p>Send requests to <a href="mailto:hello@luckee.com.au">hello@luckee.com.au</a>.</p>
    </LegalLayout>
  );
}
