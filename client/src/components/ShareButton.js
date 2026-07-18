import React, { useState, useRef, useEffect } from 'react';
import './ShareButton.css';

const ShareButton = ({ title, text, url }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: fullUrl });
      } catch (err) {
        // user cancelled share — do nothing
      }
    } else {
      setMenuOpen(v => !v);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = fullUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${fullUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(text)}`
  };

  return (
    <div className="share-button" ref={menuRef}>
      <button className="btn btn-ghost btn-sm" onClick={handleNativeShare}>
        ⤴ Share
      </button>

      {menuOpen && (
        <div className="share-menu">
          <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="share-menu__item">
            <span className="share-menu__icon">💬</span> WhatsApp
          </a>
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="share-menu__item">
            <span className="share-menu__icon">📘</span> Facebook
          </a>
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="share-menu__item">
            <span className="share-menu__icon">🐦</span> Twitter / X
          </a>
          <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="share-menu__item">
            <span className="share-menu__icon">✈️</span> Telegram
          </a>
          <button className="share-menu__item" onClick={handleCopyLink}>
            <span className="share-menu__icon">🔗</span> {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;