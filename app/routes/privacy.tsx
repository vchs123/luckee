import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { LegalLayout } from "~/components/LegalLayout";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy | Luckee" },
  { name: "description", content: "How Luckee collects, uses and protects your personal information." },
];

export default function Privacy() {
  return (
    <LegalLayout eyebrow="🔒 Legal" title="Privacy Policy" updated="October 2026" active="/privacy">
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
      <p>We keep your information while your account is in use.</p>
      <ul>
        <li><strong>Deleting your account:</strong> you can delete it yourself at any time from your <a href="/profile">profile</a> page, or ask us through the <Link to="/contact?topic=privacy">contact form</Link>. This permanently removes your profile, points, gachapon capsules and prize requests, saved freebies, check-in history, receipts and uploaded photos, your dinner waitlist entry, your likes, and your login. Deals you pinned to the community corkboard stay up for others to use, but without your username.</li>
        <li><strong>Inactive accounts:</strong> if you haven't used Luckee for 6 months, we'll email you a reminder. If you don't sign in within 2 weeks of that email, we delete your account and its data in the same way. Signing in once is enough to keep it.</li>
        <li>Messages you've sent us through the contact form are kept as correspondence (for example, a deletion request itself), but are no longer linked to an account once it's deleted.</li>
      </ul>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Access, update or correct your profile information from your <a href="/profile">profile</a> page.</li>
        <li>Delete your account from your <a href="/profile">profile</a> page, or request a copy or deletion of your data through the <Link to="/contact?topic=privacy">contact form</Link>.</li>
        <li>Opt out of non-essential emails at any time.</li>
      </ul>

      <h2>Children</h2>
      <p>Luckee is intended for people aged 18 and over. We do not knowingly collect information from anyone under 18.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by the "last updated" date above.</p>

      <h2>Contact</h2>
      <p>Questions or requests? Use the <Link to="/contact?topic=privacy">contact form</Link>.</p>
    </LegalLayout>
  );
}
