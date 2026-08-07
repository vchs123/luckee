import type { MetaFunction } from "react-router";
import { LegalLayout } from "~/components/LegalLayout";

export const meta: MetaFunction = () => [
  { title: "Partner With Us | Luckee" },
  { name: "description", content: "Partner with Luckee to reach Melbourne locals looking for freebies, deals and experiences." },
];

export default function Partner() {
  return (
    <LegalLayout eyebrow="🤝 Partner" title="Partner With Us" updated="August 2026" active="/partner">
      <p>Luckee helps Melbourne locals discover what's free, which loyalty programs are worth joining, and where to meet new people over a shared meal. If you're a brand, venue or cafe that wants to reach an engaged, local, freebie-loving audience, we'd love to talk.</p>

      <h2>Ways to work together</h2>
      <ul>
        <li><strong>Feature an offer:</strong> list a birthday perk, sign-up bonus or exclusive deal for Luckee members.</li>
        <li><strong>Gachapon prizes:</strong> sponsor food, drink or grand prizes for our rewards draw and get in front of active users.</li>
        <li><strong>Community dinners:</strong> host or supply a Luckee community dinner as it rolls out across Melbourne.</li>
        <li><strong>Affiliate partnerships:</strong> add a referral program that benefits your business and our members.</li>
      </ul>

      <h2>Our commitment</h2>
      <p>Freebie guides stay editorially independent — we clearly label affiliate links and sponsored placements, and we only feature offers we believe are genuinely good for our community.</p>

      <h2>Get in touch</h2>
      <p>Email <a href="mailto:hello@luckee.com.au">hello@luckee.com.au</a> with a bit about your business and what you have in mind, and we'll get back to you.</p>
    </LegalLayout>
  );
}
