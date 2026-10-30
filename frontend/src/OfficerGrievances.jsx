import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OfficerGrievances = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const officerId = sessionStorage.getItem('officerId');
    if (!officerId) {
      navigate('/officer-login');
      return;
    }
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const response = await fetch('/officer/grievances', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setGrievances(data.grievances || []);
      } else if (data.message === 'Officer not logged in') {
        navigate('/officer-login');
      } else {
        toast.error(data.message || 'Failed to load grievances');
      }
    } catch (err) {
      toast.error('Failed to load grievances');
    }
    setLoading(false);
  };

  const updateStatus = async (grievanceId, newStatus, notes = '') => {
    setUpdatingId(grievanceId);
    try {
      const response = await fetch(
        `/officer/grievance/${grievanceId}/update`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus, notes })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchGrievances();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setUpdatingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const filtered = grievances.filter((g) => {
    if (filter && g.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (g.title || '').toLowerCase().includes(q) ||
        (g.founder_name || '').toLowerCase().includes(q) ||
        (g.startup_name || '').toLowerCase().includes(q) ||
        (g.predicted_category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: grievances.length,
    pending: grievances.filter((g) => g.status === 'Pending').length,
    underReview: grievances.filter((g) => g.status === 'Under Review').length,
    resolved: grievances.filter((g) => g.status === 'Resolved').length
  };

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
        <h1>📋 My Grievances</h1>
        <p>All grievances currently assigned to you</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Assigned</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #60a5fa' }}>
          <div className="stat-value" style={{ color: '#60a5fa' }}>{stats.underReview}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="filters-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
        </select>
        <input
          type="text"
          placeholder="Search by title, founder, startup..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm" onClick={fetchGrievances}>
          🔄 Refresh
        </button>
      </div>

      <div className="card glass-card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              {grievances.length === 0
                ? 'No grievances assigned to you yet'
                : 'No grievances match this filter'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {grievances.length === 0
                ? 'You will see them here once an admin assigns one to you'
                : 'Try a different filter or search term'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Founder / Startup</th>
                  <th>Grievance</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th style={{ minWidth: '160px' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={g.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{g.founder_name}</strong>
                      <p className="text-muted" style={{ fontSize: '12px' }}>
                        {g.startup_name}
                      </p>
                      <p className="text-muted" style={{ fontSize: '11px' }}>
                        📧 {g.founder_email}
                      </p>
                      {g.mobile_number && (
                        <p className="text-muted" style={{ fontSize: '11px' }}>
                          📱 {g.mobile_number}
                        </p>
                      )}
                    </td>
                    <td>
                      <strong>{g.title}</strong>
                      <p className="text-muted" style={{ fontSize: '12px' }}>
                        {g.description?.length > 100
                          ? g.description.substring(0, 100) + '…'
                          : g.description}
                      </p>
                    </td>
                    <td>
                      <span className="badge-category">{g.predicted_category}</span>
                    </td>
                    <td>
                      <span
                        className={`badge status-${g.status
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {formatDate(g.assigned_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <select
                          value={g.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus !== g.status) {
                              updateStatus(g.id, newStatus, '');
                            }
                          }}
                          disabled={updatingId === g.id}
                          className="status-select"
                          style={{ fontSize: '12px', padding: '6px 8px' }}
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        {updatingId === g.id && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              textAlign: 'center'
                            }}
                          >
                            Updating…
                          </span>
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

export default OfficerGrievances;