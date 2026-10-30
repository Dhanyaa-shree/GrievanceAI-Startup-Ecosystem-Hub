import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const RatingModal = ({ 
  grievance,        // { id, title, officer_name, officer_category }
  onClose, 
  onSuccess 
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const handleSubmit = async () => {
    if (selectedStar === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/rating/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          grievance_id: grievance.id,
          rating: selectedStar,
          feedback: feedback.trim()
        })
      });
      const data = await response.json();

      if (data.success) {
        toast.success('⭐ Thank you for your feedback!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to submit rating');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="rating-modal-close" onClick={onClose} title="Close">
          ✕
        </button>

        {/* Header */}
        <h2 className="rating-modal-title">What is your rating?</h2>
        <p className="rating-modal-subtitle">
          How was your experience with{' '}
          <strong style={{ color: '#a8b4ff' }}>
            {grievance.officer_name || 'the Officer'}
          </strong>
          ?
        </p>

        {/* Stars */}
        <div className="rating-stars-row">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoveredStar || selectedStar);
            return (
              <button
                key={star}
                className={`rating-star-btn ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setSelectedStar(star)}
                type="button"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            );
          })}

          {selectedStar > 0 && (
            <>
              <span className="rating-divider">|</span>
              <span className="rating-number">{selectedStar}</span>
            </>
          )}
        </div>

        {/* Rating Label */}
        {selectedStar > 0 && (
          <div className="rating-label-text" style={{ color: '#fbbf24' }}>
            {ratingLabels[selectedStar]}
          </div>
        )}

        {/* Feedback */}
        <textarea
          className="rating-feedback-input"
          placeholder="Add feedback (optional)..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows="3"
          maxLength={500}
        />

        {/* Submit */}
        <button
          className="rating-submit-btn"
          onClick={handleSubmit}
          disabled={submitting || selectedStar === 0}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>

        {/* No thanks */}
        <button
          className="rating-skip-btn"
          onClick={onClose}
          type="button"
        >
          No thanks
        </button>
      </div>
    </div>
  );
};

export default RatingModal;

