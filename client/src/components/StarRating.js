import React from 'react';
import './StarRating.css';

const StarRating = ({ rating, size = 16, interactive = false, onChange }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {stars.map(star => (
        <span
          key={star}
          className={`star ${star <= Math.round(rating) ? 'star--filled' : 'star--empty'} ${interactive ? 'star--interactive' : ''}`}
          onClick={interactive ? () => onChange(star) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;