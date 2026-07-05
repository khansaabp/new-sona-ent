import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__brand">
        <span className="brand__mark" style={{ color: 'var(--accent-cyan)' }}>⌁</span>
        <span>New sona enterprises</span>
      </div>
      <p className="text-muted">
        Consumer electronics, retail &amp; wholesale &mdash; tv, refrigerator, ac, washing machine and more.
      </p>
      <div className="site-footer__meta text-muted mono">
        GSTIN: 27ABCDE1234F1Z5 &middot; contact: 8483094199 &middot; &copy; {new Date().getFullYear()} New sona enterprises
      </div>
    </div>
  </footer>
);

export default Footer;
