import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="ft">
      <div className="ft-i">
        <div className="ft-top">
          <div className="ft-brand">
            <div className="ft-logo">Luckee</div>
            <p className="ft-tag">Melbourne's best freebies, deals and community dinners. Updated regularly. Verified by a local.</p>
          </div>
          <div className="ft-cols">
            <div className="ft-col">
              <h4>Freebies</h4>
              <Link to="/freebies/birthday-freebies">Birthday Freebies</Link>
              <Link to="/freebies/sign-up-freebies">Sign-up Freebies</Link>
              <Link to="/freebies/free-melbourne">Free Melbourne</Link>
              <Link to="/freebies/events-calendar">Events Calendar</Link>
            </div>
            <div className="ft-col">
              <h4>Platform</h4>
              <Link to="/deals">Deals</Link>
              <Link to="/dinners">Community Dinners</Link>
              <Link to="/rewards">Rewards</Link>
              <Link to="/about">About Luckee</Link>
              <Link to="/blog">Blog</Link>
            </div>
            <div className="ft-col">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <Link to="/copyright">Copyright Policy</Link>
              <Link to="/partner">Partner With Us</Link>
            </div>
          </div>
        </div>
        <div className="ft-bot">
          <p className="ft-legal">© 2026 Luckee. All rights reserved.</p>
          <p className="ft-disco">Some links are affiliate referral links. Luckee earns a commission if you sign up — at no extra cost to you. All freebie listings are editorially independent.</p>
        </div>
      </div>
    </footer>
  );
}
