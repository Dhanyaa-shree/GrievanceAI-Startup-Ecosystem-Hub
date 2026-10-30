import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PremiumBooking = ({ ticketId, founderId, officerName, officerId, grievanceTitle }) => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [fetchingSlots, setFetchingSlots] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (selectedDate && officerId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, officerId]);

  const fetchAvailableSlots = async (date) => {
    setFetchingSlots(true);
    setAvailableSlots([]);
    setSelectedTime(null);

    try {
      const response = await fetch('/api/premium/available-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          officer_id: officerId,
          meeting_date: date
        })
      });
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.slots || []);
        if (data.slots && data.slots.length === 0) {
          toast.info('No available slots for this date. Please select another date.');
        }
      } else {
        toast.error(data.message || 'Failed to load available slots');
      }
    } catch (error) {
      toast.error('Failed to load available slots');
    }
    setFetchingSlots(false);
  };

  const handleBookMeeting = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/premium/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticket_id: ticketId,
          meeting_date: selectedDate,
          meeting_time: selectedTime,
          meeting_topic: meetingTopic || 'Expert Consultation'
        })
      });
      const data = await response.json();
      if (data.success) {
        setMeetingDetails(data.meeting);
        setBookingSuccess(true);
        toast.success('✅ Meeting booked successfully!');
      } else {
        toast.error(data.message || 'Booking failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const copyZoomLink = () => {
    if (meetingDetails?.zoom_link) {
      navigator.clipboard.writeText(meetingDetails.zoom_link);
      toast.success('📋 Meeting link copied!');
    }
  };

  const addToGoogleCalendar = () => {
    if (!meetingDetails) return;
    const startDate = new Date(`${meetingDetails.date}T${meetingDetails.time}`);
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Expert Call with ${officerName || 'Officer'}`
    )}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(
      `Meeting with ${officerName}\nZoom: ${meetingDetails.zoom_link}`
    )}`;
    window.open(url, '_blank');
    toast.success('📅 Opening Google Calendar...');
  };

  const downloadICS = () => {
    if (!meetingDetails) return;
    const startDate = new Date(`${meetingDetails.date}T${meetingDetails.time}`);
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GrievanceAI//Meeting//EN
BEGIN:VEVENT
UID:${meetingDetails.meeting_id}@grievanceai.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Expert Call with ${officerName || 'Officer'}
DESCRIPTION:Zoom Link: ${meetingDetails.zoom_link}
LOCATION:Zoom Meeting
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting_${meetingDetails.meeting_id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('📅 Calendar file downloaded!');
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const isDateAvailable = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0 && date.getDay() !== 6;
  };

  const isDateSelected = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const handleDateSelect = (day) => {
    if (isDateAvailable(day)) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setSelectedTime(null);
    }
  };

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta));
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isAvailable = isDateAvailable(day);
      const isSelected = isDateSelected(day);
      days.push(
        <div
          key={day}
          className={`calendar-day ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  const renderTimeSlots = () => {
    if (fetchingSlots) {
      return (
        <div className="time-slots-loading">
          <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
          <p>Loading available slots...</p>
        </div>
      );
    }

    if (!selectedDate) {
      return <p className="hint-text">📅 Please select a date first</p>;
    }

    if (availableSlots.length === 0) {
      return <p className="hint-text">😕 No available slots for this date</p>;
    }

    return (
      <div className="time-slots-grid">
        {availableSlots.map((slot) => (
          <div
            key={slot.time}
            className={`time-slot ${selectedTime === slot.time ? 'selected' : ''}`}
            onClick={() => setSelectedTime(slot.time)}
          >
            <span className="time-slot-icon">🕐</span>
            <span className="time-slot-display">{slot.display}</span>
            {selectedTime === slot.time && (
              <span className="time-slot-check">✅</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (bookingSuccess && meetingDetails) {
    return (
      <div className="meeting-confirmation-container">
        <div className="meeting-confirmation-card glass-card">
          <div className="confirmation-header">
            <div className="confirmation-icon">✅</div>
            <h2>Meeting Confirmed!</h2>
            <p className="confirmation-subtitle">
              Your expert call has been scheduled successfully
            </p>
          </div>

          <div className="confirmation-details">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-icon">🎫</span>
                <div>
                  <span className="detail-label">Meeting ID</span>
                  <span className="detail-value">#{meetingDetails.meeting_id}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">👤</span>
                <div>
                  <span className="detail-label">Officer</span>
                  <span className="detail-value">{officerName || 'Expert'}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <div>
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {new Date(meetingDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🕐</span>
                <div>
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{formatTime(meetingDetails.time)} (IST)</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">⏱️</span>
                <div>
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">30 minutes</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📋</span>
                <div>
                  <span className="detail-label">Topic</span>
                  <span className="detail-value">
                    {meetingDetails.meeting_topic || 'Expert Consultation'}
                  </span>
                </div>
              </div>
            </div>

            <div className="zoom-link-section">
              <div className="zoom-link-header">
                <span className="zoom-icon">🔗</span>
                <span className="zoom-label">Zoom Meeting Link</span>
              </div>
              <div className="zoom-link-display">
                <span className="zoom-link-text">{meetingDetails.zoom_link}</span>
                <button className="btn btn-secondary btn-sm copy-btn" onClick={copyZoomLink}>
                  📋 Copy
                </button>
              </div>
              <p className="zoom-note">
                💡 Save this link — you'll also find it in "My Meetings"
              </p>
            </div>

            <div className="confirmation-actions">
              <button className="btn btn-primary" onClick={addToGoogleCalendar}>
                📅 Add to Calendar
              </button>
              <button className="btn btn-secondary" onClick={downloadICS}>
                📥 Download .ics
              </button>
              <a
                href={meetingDetails.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                🚀 Open Zoom
              </a>
            </div>
          </div>

          <div className="confirmation-bottom">
            <button className="btn btn-primary" onClick={() => navigate('/my-meetings')}>
              📊 View All Meetings
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/my-tickets')}>
              🎫 My Tickets
            </button>
          </div>

          <div className="confirmation-info">
            <p>💡 A confirmation email has been sent to your registered email address.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-booking-container glass-card">
      <div className="premium-booking-header">
        <div className="premium-badge">🥇 PREMIUM</div>
        <h2>📞 Book Expert Call</h2>
        <p>Schedule a 30-minute consultation with <strong>{officerName || 'Expert'}</strong></p>
        <div className="premium-booking-sub">
          <span className="premium-price">₹2,999</span>
          <span className="premium-duration">⏱️ 30 min session</span>
        </div>
      </div>

      <div className="premium-booking-grid">
        <div className="premium-calendar">
          <div className="calendar-header">
            <button
              className="calendar-nav-btn"
              onClick={() => changeMonth(-1)}
              disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
            >
              ‹
            </button>
            <h3>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <button className="calendar-nav-btn" onClick={() => changeMonth(1)}>›</button>
          </div>

          <div className="calendar-weekdays">
            {dayNames.map((day) => (
              <span key={day} className="weekday">{day}</span>
            ))}
          </div>

          <div className="calendar-grid">{renderCalendar()}</div>

          <div className="calendar-legend">
            <div className="legend-item"><span className="legend-dot available"></span><span>Available</span></div>
            <div className="legend-item"><span className="legend-dot unavailable"></span><span>Unavailable</span></div>
            <div className="legend-item"><span className="legend-dot selected"></span><span>Selected</span></div>
          </div>
        </div>

        <div className="premium-time-slots">
          <div className="time-slots-header">
            <h3>🕐 Available Slots</h3>
            {selectedDate && (
              <span className="selected-date-badge">
                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <div className="time-slots-container">{renderTimeSlots()}</div>
        </div>
      </div>

      <div className="premium-meeting-topic">
        <label>Meeting Topic (Optional)</label>
        <input
          type="text"
          value={meetingTopic}
          onChange={(e) => setMeetingTopic(e.target.value)}
          placeholder="What would you like to discuss with the officer?"
          className="topic-input"
        />
      </div>

      <div className="premium-booking-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/my-tickets')}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleBookMeeting}
          disabled={!selectedDate || !selectedTime || loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '20px', height: '20px' }}></span>
              Booking...
            </>
          ) : (
            '📌 Book Meeting'
          )}
        </button>
      </div>

      <div className="premium-booking-info">
        <p>💡 <strong>Note:</strong> Once booked, you'll receive a Zoom meeting link on this page and in My Meetings.</p>
      </div>
    </div>
  );
};

function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export default PremiumBooking;

