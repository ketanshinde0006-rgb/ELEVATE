import { Link } from 'react-router-dom';
import './Footer.css';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Personal Development', path: '/personal-development' },
    { label: 'Fashion Explorer', path: '/fashion' },
    { label: 'Brand Explorer', path: '/brands' },
    { label: 'Digital Wardrobe', path: '/wardrobe' },
    { label: 'Outfit Planner', path: '/outfits' },
  ],
  Features: [
    { label: 'Goals & Tasks', path: '/personal-development' },
    { label: 'Habit Tracking', path: '/personal-development' },
    { label: 'Style Explorer', path: '/fashion' },
    { label: 'Recommendations', path: '/recommendations' },
    { label: 'Dashboard', path: '/dashboard' },
  ],
  Company: [
    { label: 'About Us', path: '/about' },
    { label: 'Community Hub', path: '/community' },
    { label: 'Style Recommendations', path: '/recommendations' },
  ],
};

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__container">
        {/* Brand */}
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <span className="footer__logo-text">ELEVATE</span>
          </Link>
          <p className="footer__tagline">
            Your journey to personal growth and style starts here.
            Elevate yourself, elevate your style.
          </p>
        </div>

        {/* Link columns */}
        <div className="footer__columns">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="footer__column">
              <h4 className="footer__column-title">{title}</h4>
              <ul className="footer__column-links">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className="footer__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p className="footer__copyright">
            © {new Date().getFullYear()} ELEVATE. All rights reserved.
          </p>
          <div className="footer__bottom-links">
            <Link to="/about">About</Link>
            <Link to="/community">Community</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
