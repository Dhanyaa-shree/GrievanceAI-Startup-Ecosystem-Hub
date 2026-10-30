import React from 'react';

const TimeSlotPicker = ({ 
  slots, 
  selectedTime, 
  onTimeSelect, 
  loading = false,
  timezone = 'IST',
  className = ''
}) => {
  // Group slots by morning, afternoon, evening
  const getSlotGroup = (timeDisplay) => {
    const hour = parseInt(timeDisplay.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const groupLabels = {
    morning: '🌅 Morning (9:00 AM - 12:00 PM)',
    afternoon: '☀️ Afternoon (12:00 PM - 5:00 PM)',
    evening: '🌆 Evening (5:00 PM - 6:00 PM)'
  };

  const groupedSlots = {
    morning: [],
    afternoon: [],
    evening: []
  };

  slots.forEach(slot => {
    const group = getSlotGroup(slot.display);
    groupedSlots[group].push(slot);
  });

  if (loading) {
    return (
      <div className="time-slot-picker loading">
        <div className="loading-spinner">
          <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
          <p>Loading available slots...</p>
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="time-slot-picker empty">
        <div className="empty-state">
          <span className="empty-icon">😕</span>
          <p>No available time slots</p>
          <span className="empty-hint">Please select another date</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`time-slot-picker ${className}`}>
      <div className="time-slot-picker-header">
        <h3>🕐 Available Time Slots</h3>
        <span className="timezone-label">{timezone}</span>
        <span className="slot-count">{slots.length} slots available</span>
      </div>

      <div className="time-slot-groups">
        {Object.entries(groupedSlots).map(([group, groupSlots]) => {
          if (groupSlots.length === 0) return null;
          
          return (
            <div key={group} className="time-slot-group">
              <div className="group-label">{groupLabels[group]}</div>
              <div className="group-slots">
                {groupSlots.map((slot, index) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={index}
                      className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => onTimeSelect(slot.time)}
                      disabled={!slot.available}
                    >
                      <span className="slot-icon">🕐</span>
                      <span className="slot-display">{slot.display}</span>
                      {isSelected && (
                        <span className="slot-check">✅</span>
                      )}
                      {!slot.available && (
                        <span className="slot-unavailable">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTime && (
        <div className="selected-slot-info">
          <span className="info-icon">✅</span>
          <span>Selected: <strong>{slots.find(s => s.time === selectedTime)?.display}</strong></span>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;

