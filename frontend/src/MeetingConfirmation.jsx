import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const MeetingConfirmation = ({ 
  meetingDetails, 
  officerName, 
  grievanceTitle,
  onClose,
  onReschedule,
  onCancel
}) => {
  const navigate = useNavigate();

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
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
  };

  // Copy meeting link to clipboard
  const copyLink = () => {
    if (meetingDetails?.zoom_link) {
      navigator.clipboard.writeText(meetingDetails.zoom_link);
      toast.success('📋 Meeting link copied to clipboard!');
    }
  };

  // Add to Google Calendar
  const addToCalendar = () => {
    if (!meetingDetails) return;
    
    const startDate = new Date(`${meetingDetails.date}T${meetingDetails.time}`);
    const endDate = new Date(startDate.getTime() + 30 * 60000);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Expert Call with ${officerName}`
    )}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(
      `Meeting with ${officerName} about: ${grievanceTitle || 'Expert Consultation'}\nZoom Link: ${meetingDetails.zoom_link}`
    )}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('📅 Opening Google Calendar...');
  };

  // Download calendar invite (.ics file)
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
SUMMARY:Expert Call with ${officerName}
DESCRIPTION:Meeting with ${officerName} about: ${grievanceTitle || 'Expert Consultation'}\\nZoom Link: ${meetingDetails.zoom_link}
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

  // Send reminder email
  const sendReminder = () => {
    // Simulate sending reminder
    toast.success('📧 Reminder sent to your email!');
  };

  // Handle cancel
  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      if (onCancel) {
        await onCancel(meetingDetails.meeting_id);
      } else {
        toast.success('Meeting cancelled successfully');
        navigate('/my-meetings');
      }
    }
  };

  // Handle reschedule
  const handleReschedule = () => {
    if (onReschedule) {
      onReschedule(meetingDetails);
    } else {
      toast.info('⏳ Reschedule feature coming soon');
    }
  };

  if (!meetingDetails) {
    return (
      <div className="meeting-confirmation-empty">
        <p>No meeting details available</p>
        <button className="btn btn-primary" onClick={() => navigate('/my-meetings')}>
          Go to My Meetings
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-confirmation-container">
      <div className="meeting-confirmation-card glass-card">
        {/* Header */}
        <div className="confirmation-header">
          <div className="confirmation-icon">✅</div>
          <h2>Meeting Confirmed!</h2>
          <p className="confirmation-subtitle">
            Your expert call has been scheduled successfully
          </p>
        </div>

        {/* Meeting Details */}
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
                <span className="detail-value">{formatDate(meetingDetails.date)}</span>
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
                <span className="detail-value">{meetingDetails.meeting_topic || 'Expert Consultation'}</span>
              </div>
            </div>
          </div>

          {/* Zoom Link */}
          <div className="zoom-link-section">
            <div className="zoom-link-header">
              <span className="zoom-icon">🔗</span>
              <span className="zoom-label">Zoom Meeting Link</span>
            </div>
            <div className="zoom-link-display">
              <span className="zoom-link-text">{meetingDetails.zoom_link}</span>
              <button className="btn btn-secondary btn-sm copy-btn" onClick={copyLink}>
                📋 Copy
              </button>
            </div>
            <p className="zoom-note">
              💡 You will also receive this link via email
            </p>
          </div>

          {/* Quick Actions */}
          <div className="confirmation-actions">
            <button className="btn btn-primary" onClick={addToCalendar}>
              📅 Add to Calendar
            </button>
            <button className="btn btn-secondary" onClick={downloadICS}>
              📥 Download .ics
            </button>
            <button className="btn btn-secondary" onClick={sendReminder}>
              📧 Send Reminder
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="confirmation-bottom">
          <button 
            className="btn btn-secondary"
            onClick={handleReschedule}
          >
            🔄 Reschedule
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleCancel}
          >
            ❌ Cancel Meeting
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/my-meetings')}
          >
            📊 View All Meetings
          </button>
        </div>

        {/* Info Note */}
        <div className="confirmation-info">
          <p>
            💡 A confirmation email has been sent to your registered email address.
            Please check your spam folder if you don't see it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeetingConfirmation;

