import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const MyMeetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/founder/meetings', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📅 Founder meetings response:', data);
      if (data.success) {
        setMeetings(data.meetings || []);
      } else {
        toast.error(data.message || 'Failed to load meetings');
      }
    } catch (error) {
      console.error('❌ Fetch meetings error:', error);
      toast.error('Failed to load meetings');
    }
    setLoading(false);
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

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('📋 Meeting link copied!');
  };

  const filtered = filter ? meetings.filter(m => m.status === filter) : meetings;

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
        <h1>📅 My Meetings</h1>
        <p>View all your booked expert calls</p>
      </div>

      {meetings.length === 0 ? (
        <div className="card glass-card">
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No meetings booked yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Purchase a Premium ticket to book expert calls
            </p>
            <Link to="/my-grievances" className="btn btn-primary" style={{ marginTop: '16px' }}>
              View Grievances
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card glass-card">
              <div className="stat-value">{meetings.length}</div>
              <div className="stat-label">Total Meetings</div>
            </div>
            <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
              <div className="stat-value" style={{ color: '#fbbf24' }}>
                {meetings.filter(m => m.status === 'Scheduled').length}
              </div>
              <div className="stat-label">Upcoming</div>
            </div>
            <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
              <div className="stat-value" style={{ color: '#34d399' }}>
                {meetings.filter(m => m.status === 'Completed').length}
              </div>
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
            <button className="btn btn-secondary btn-sm" onClick={fetchMeetings}>
              🔄 Refresh
            </button>
          </div>

          <div className="card glass-card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Officer</th>
                    <th>Grievance</th>
                    <th>📅 Date &amp; Time</th>
                    <th>🔗 Meeting Link</th>
                    <th>Status</th>
                    <th>Action</th>
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
                        <strong>{m.officer_name}</strong>
                        <p className="text-muted" style={{ fontSize: '12px' }}>
                          {m.officer_category}
                        </p>
                      </td>
                      <td style={{ fontSize: '13px' }}>{m.grievance_title}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{formatDate(m.meeting_date)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          🕐 {formatTime(m.meeting_time)} (IST) · {m.meeting_duration || 30} min
                        </div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
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
                        {m.status === 'Scheduled' && (
                          <a
                            href={m.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            📞 Join
                          </a>
                        )}
                        {m.status === 'Completed' && (
                          <span style={{ color: '#34d399', fontSize: '12px' }}>✅ Completed</span>
                        )}
                        {m.status === 'Cancelled' && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>❌ Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyMeetings;

