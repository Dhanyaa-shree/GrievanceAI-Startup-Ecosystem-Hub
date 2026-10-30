import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StarDisplay from './StarDisplay';

const OfficerPerformance = () => {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState({
    total_officers: 0,
    overall_avg_rating: 0,
    total_ratings: 0
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating | name | reviews

  // ✅ UPDATED: Added "General"
  const categories = ['Funding', 'Hiring', 'Marketing', 'Legal', 'Mentorship', 'General'];

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    fetchPerformance();
  }, [categoryFilter]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/officer-performance';
      if (categoryFilter) url += `?category=${categoryFilter}`;

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setOfficers(data.officers || []);
        setStats(data.stats || stats);
      } else {
        if (data.message === 'Unauthorized') {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('adminLoggedIn');
          navigate('/admin-login');
        } else {
          toast.error(data.message || 'Failed to load officer data');
        }
      }
    } catch (err) {
      toast.error('Failed to load officer performance');
    }
    setLoading(false);
  };

  const sortedOfficers = [...officers].sort((a, b) => {
    if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
    if (sortBy === 'reviews') return (b.total_ratings || 0) - (a.total_ratings || 0);
    return (a.name || '').localeCompare(b.name || '');
  });

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
        <h1>👥 Officer Performance Dashboard</h1>
        <p>Monitor officer ratings and grievance handling</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">{stats.total_officers}</div>
          <div className="stat-label">Total Officers</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {Number(stats.overall_avg_rating || 0).toFixed(2)} ⭐
          </div>
          <div className="stat-label">Overall Avg Rating</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #667eea' }}>
          <div className="stat-value" style={{ color: '#667eea' }}>
            {stats.total_ratings}
          </div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {officers.filter(o => o.avg_rating >= 4.5).length}
          </div>
          <div className="stat-label">Top Rated (4.5+)</div>
        </div>
      </div>

      <div className="filters-bar">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="rating">Sort by: Rating</option>
          <option value="reviews">Sort by: Reviews</option>
          <option value="name">Sort by: Name</option>
        </select>

        <button className="btn btn-secondary btn-sm" onClick={fetchPerformance}>
          🔄 Refresh
        </button>
      </div>

      <div className="table-container glass-card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Officer</th>
              <th>Category</th>
              <th>Avg Rating</th>
              <th>Reviews</th>
              <th>Grievances</th>
              <th>Performance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedOfficers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table">No officers found</td>
              </tr>
            ) : (
              sortedOfficers.map((officer, i) => (
                <tr key={officer.officer_id}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{officer.name}</strong>
                    <p className="text-muted" style={{ fontSize: '12px' }}>
                      {officer.email}
                    </p>
                  </td>
                  <td><span className="badge-category">{officer.category}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StarDisplay rating={officer.avg_rating} size="sm" />
                      <strong style={{ color: '#fbbf24' }}>
                        {Number(officer.avg_rating || 0).toFixed(1)}
                      </strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{officer.total_ratings}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>
                      {officer.resolved_grievances}/{officer.total_grievances}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: `${officer.performance_color}22`,
                        color: officer.performance_color,
                        padding: '4px 12px',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}
                    >
                      {officer.performance_band}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/officer-performance/${officer.officer_id}`}
                      className="btn btn-primary btn-sm"
                    >
                      👁️ View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfficerPerformance;