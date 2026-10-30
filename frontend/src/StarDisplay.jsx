import React from 'react';

const StarDisplay = ({ rating = 0, size = 'md', showNumber = false }) => {
  const sizes = { sm: '14px', md: '18px', lg: '24px' };
  const fontSize = sizes[size] || sizes.md;

  return (
    <span className="star-display" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize,
            color: star <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.15)',
            lineHeight: 1
          }}
        >
          ★
        </span>
      ))}
      {showNumber && (
        <span style={{ 
          marginLeft: '6px', 
          fontSize: size === 'lg' ? '16px' : '13px',
          color: 'var(--text-secondary)',
          fontWeight: 600
        }}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </span>
  );
};

export default StarDisplay;

