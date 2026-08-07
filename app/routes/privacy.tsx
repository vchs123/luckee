import type { MetaFunction } from "react-router";
import { LegalLayout } from "~/components/LegalLayout";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy | Luckee" },
  { name: "description", content: "How Luckee collects, uses and protects your personal information." },
];

export default function Privacy() {
  return (
    <LegalLayout eyebrow="🔒 Legal" title="Privacy Policy" updated="August 2026" active="/privacy">
      <p>Luckee ("we", "us", "our") is a Melbourne-based platform for finding freebies, deals and community dinners. This policy explains what personal information we collect, how we use it, and the choices you have. By using Luckee you agree to this policy.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address, used to sign in via a magic link (handled by our authentication provider, Supabase).</li>
        <li><strong>Profile information you provide:</strong> first and last name, username, date of birth, mobile number, and optional social handles.</li>
        <li><strong>Activity on Luckee:</strong> points earned and spent, daily logins and streaks, spin/trivia results, gachapon pulls and redemptions, your Luckboard selections, referrals, and any receipts or proof images you upload.</li>
        <li><strong>Usage and device data:</strong> collected via Google Analytics 4 (e.g. pages viewed, approximate location, device/browser) to understand and improve the site.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To create and manage your account and profile.</li>
        <li>To run the rewards features — award points, track streaks, process gachapon pulls and coordinate prize redemptions.</li>
        <li>To match you for community dinners (when that feature launches) and to contact you about them.</li>
        <li>To send transactional messages (for example, sign-in links or dinner coordination) via our email provider, Resend.</li>
        <li>To measure and improve the product, and to keep the platform secure and prevent abuse.</li>
      </ul>

      <h2>How your information is shared</h2>
      <p>We do not sell your personal information. We share data only with service providers who help us operate Luckee, including:</p>
      <ul>
        <li><strong>Supabase</strong> — database, authentication and file storage.</li>
        <li><strong>Cloudflare</strong> — website hosting and delivery.</li>
        <li><strong>Resend</strong> — transactional email.</li>
        <li><strong>Google Analytics</strong> — usage analytics.</li>
        <li><strong>Stripe</strong> — if and when payments are introduced.</li>
      </ul>
      <p>Deal links on Luckee may be affiliate referral links. When you click through and sign up, the partner may set their own cookies and collect information under their own privacy policies. Luckee may earn a commission at no extra cost to you.</p>

      <h2>Cookies and analytics</h2>
      <p>We use essential cookies to keep you signed in, and analytics cookies (Google Analytics 4) to understand how the site is used. You can control cookies through your browser settings.</p>

      <h2>Data retention</h2>
      <p>We keep your information for as long as your account is active or as needed to provide the service. You can ask us to delete your account and associated data at any time.</p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Access, update or correct your profile information from your <a href="/profile">profile</a> page.</li>
        <li>Request a copy or deletion of your data by emailing us.</li>
        <li>Opt out of non-essential emails at any time.</li>
      </ul>

      <h2>Children</h2>
      <p>Luckee is intended for people aged 18 and over. We do not knowingly collect information from anyone under 18.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by the "last updated" date above.</p>

      <h2>Contact</h2>
      <p>Questions or requests? Email <a href="mailto:hello@luckee.com.au">hello@luckee.com.au</a>.</p>
    </LegalLayout>
  );
}
