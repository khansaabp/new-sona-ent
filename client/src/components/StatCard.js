import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, sub, tone = 'cyan' }) => (
  <div className="stat-card card">
    <div className="stat-card__label">{label}</div>
    <div className={`stat-card__value mono stat-card__value--${tone}`}>{value}</div>
    {sub && <div className="stat-card__sub text-muted">{sub}</div>}
  </div>
);

export default StatCard;
