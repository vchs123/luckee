import type { MetaFunction } from "react-router";
import { LegalLayout } from "~/components/LegalLayout";

export const meta: MetaFunction = () => [
  { title: "Terms & Conditions | Luckee" },
  { name: "description", content: "The terms that govern your use of Luckee." },
];

export default function Terms() {
  return (
    <LegalLayout eyebrow="📜 Legal" title="Terms & Conditions" updated="August 2026" active="/terms">
      <p>These terms govern your use of Luckee. By creating an account or using the site, you agree to them. If you don't agree, please don't use Luckee.</p>

      <h2>Eligibility</h2>
      <p>You must be at least 18 years old to create an account and take part in rewards and community dinners.</p>

      <h2>Your account</h2>
      <p>You're responsible for keeping your account secure and for the accuracy of the information in your profile. Don't create accounts for other people or use Luckee to abuse the rewards system. We may suspend or remove accounts that break these terms or misuse the platform.</p>

      <h2>Points, rewards and the gachapon</h2>
      <ul>
        <li>Points have no cash value, can't be exchanged for cash, and can't be transferred between accounts.</li>
        <li>Points, boosters, gachapon prizes and redemptions are provided for fun and may be changed, expired or withdrawn at any time.</li>
        <li>Gachapon pulls cost points and outcomes are randomised. Collecting the required number of a prize lets you request a physical redemption, which is arranged directly with the organiser at a time and place to be agreed. Dietary requirements you provide are used only to prepare your gift.</li>
        <li>We may reverse points or redemptions obtained through error, fraud or abuse.</li>
      </ul>

      <h2>Freebies, deals and accuracy</h2>
      <p>Offers listed on Luckee are provided by third parties and change frequently. We mark offers we've personally checked as <strong>"Verified by Luckee"</strong>; others are community-listed and pending verification. Always confirm the current terms with the brand before relying on a specific offer. Luckee isn't responsible for third-party offers, their availability, or their terms.</p>

      <h2>Affiliate links</h2>
      <p>Some links are affiliate referral links. If you sign up through them, Luckee may earn a commission at no extra cost to you. Our freebies content is editorially independent — brands don't pay to appear in the guides.</p>

      <h2>Community dinners</h2>
      <p>Community dinners (coming soon) are non-profit and cost-neutral. Participation is at your own discretion and risk; please treat other participants with respect.</p>

      <h2>Acceptable use</h2>
      <p>Don't misuse the platform, attempt to disrupt it, scrape it at scale, or upload unlawful, misleading or infringing content.</p>

      <h2>Liability</h2>
      <p>Luckee is provided "as is". To the extent permitted by law, we aren't liable for losses arising from your use of the site or reliance on third-party offers. Nothing in these terms excludes rights you have under the Australian Consumer Law.</p>

      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use after changes means you accept the updated terms.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Victoria, Australia.</p>

      <h2>Contact</h2>
      <p>Questions? Email <a href="mailto:hello@luckee.com.au">hello@luckee.com.au</a>.</p>
    </LegalLayout>
  );
}
