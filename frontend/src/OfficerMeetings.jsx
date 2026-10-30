import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OfficerMeetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    const officerId = sessionStorage.getItem('officerId');
    const name = sessionStorage.getItem('officerName');
    if (!officerId) {
      navigate('/officer-login');
      return;
    }
    setOfficerName(name || 'Officer');
    fetchMeetings();

    intervalRef.current = setInterval(() => fetchMeetings(true), 15000);
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, []);

  const fetchMeetings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/officer/meetings', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setMeetings(data.meetings || []);
      } else if (data.message === 'Officer not logged in') {
        navigate('/officer-login');
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load meetings');
    }
    if (!silent) setLoading(false);
  };

  const updateStatus = async (meetingId, newStatus) => {
    if (!window.confirm(`Mark this meeting as ${newStatus}?`)) return;
    setUpdatingId(meetingId);
    try {
      const response = await fetch(
        `/api/premium/meetings/${meetingId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(`✅ Meeting marked as ${newStatus}`);
        fetchMeetings(true);
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      toast.error('Network error');
    }
    setUpdatingId(null);
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('📋 Meeting link copied!');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Scheduled': 'badge-pending',
      'Completed': 'badge-resolved',
      'Cancelled': 'badge-pending',
      'Rescheduled': 'badge-under-review'
    };
    return `badge ${classes[status] || ''}`;
  };

  const filtered = filter ? meetings.filter(m => m.status === filter) : meetings;
  const scheduledCount = meetings.filter(m => m.status === 'Scheduled').length;
  const completedCount = meetings.filter(m => m.status === 'Completed').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>🥇 Premium Video Calls</h1>
        <p>All expert calls booked with you — auto-refreshes every 15s</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">{meetings.length}</div>
          <div className="stat-label">Total Meetings</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{scheduledCount}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="filters-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchMeetings()}>
          🔄 Refresh
        </button>
      </div>

      <div className="card glass-card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              {meetings.length === 0 ? 'No meetings booked yet' : 'No meetings match this filter'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {meetings.length === 0
                ? "Founders haven't booked any Premium calls with you yet"
                : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Meeting</th>
                  <th>Founder</th>
                  <th>Startup</th>
                  <th>📅 Date &amp; Time</th>
                  <th>🔗 Meeting Link</th>
                  <th>Status</th>
                  <th style={{ minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.meeting_id}>
                    <td>
                      <strong>#{m.meeting_id}</strong>
                      <p className="text-muted" style={{ fontSize: '12px' }}>
                        {m.meeting_topic || 'Expert Consultation'}
                      </p>
                    </td>
                    <td>
                      <strong>{m.founder_name}</strong>
                      <p className="text-muted" style={{ fontSize: '12px' }}>
                        {m.founder_email}
                      </p>
                    </td>
                    <td>{m.startup_name}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatDate(m.meeting_date)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        🕐 {formatTime(m.meeting_time)} (IST) · {m.meeting_duration || 30} min
                      </div>
                    </td>
                    <td style={{ maxWidth: '260px' }}>
                      {m.zoom_link ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <a
                            href={m.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#ffd700',
                              fontSize: '12px',
                              textDecoration: 'none',
                              wordBreak: 'break-all'
                            }}
                          >
                            {m.zoom_link}
                          </a>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 10px', fontSize: '11px' }}
                            onClick={() => copyLink(m.zoom_link)}
                          >
                            📋 Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={getStatusBadge(m.status)}>{m.status}</span>
                    </td>
                    <td>
                      <div className="meeting-actions">
                        {m.status === 'Scheduled' && (
                          <>
                            <a
                              href={m.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action btn-action-join"
                            >
                              <span className="btn-action-icon">📞</span>
                              <span>Join</span>
                            </a>
                            <button
                              className="btn-action btn-action-complete"
                              disabled={updatingId === m.meeting_id}
                              onClick={() => updateStatus(m.meeting_id, 'Completed')}
                            >
                              {updatingId === m.meeting_id ? (
                                <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                              ) : (
                                <>
                                  <span className="btn-action-icon">✅</span>
                                  <span>Complete</span>
                                </>
                              )}
                            </button>
                            <button
                              className="btn-action btn-action-cancel"
                              disabled={updatingId === m.meeting_id}
                              onClick={() => updateStatus(m.meeting_id, 'Cancelled')}
                            >
                              <span className="btn-action-icon">❌</span>
                              <span>Cancel</span>
                            </button>
                          </>
                        )}
                        {m.status === 'Completed' && (
                          <div className="status-done">
                            <span className="status-done-icon">✅</span>
                            <span>Completed</span>
                            {m.completed_at && (
                              <span className="status-done-date">
                                on {new Date(m.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        {m.status === 'Cancelled' && (
                          <div className="status-cancelled">
                            <span className="status-cancelled-icon">❌</span>
                            <span>Cancelled</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerMeetings;

