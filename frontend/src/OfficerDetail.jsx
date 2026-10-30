import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import StarDisplay from './StarDisplay';

const OfficerDetail = () => {
  const { officerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    fetchDetail();
  }, [officerId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/officer-performance/${officerId}`,
        { credentials: 'include' }
      );
      const res = await response.json();
      if (res.success) {
        setData(res);
      } else {
        toast.error(res.message || 'Failed to load officer details');
        navigate('/admin/officer-performance');
      }
    } catch (err) {
      toast.error('Network error');
      navigate('/admin/officer-performance');
    }
    setLoading(false);
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch { return ts; }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!data) return null;

  const { officer, stats, reviews } = data;

  const distData = {
    labels: ['5★', '4★', '3★', '2★', '1★'],
    datasets: [{
      label: 'Ratings',
      data: [
        stats.distribution['5'],
        stats.distribution['4'],
        stats.distribution['3'],
        stats.distribution['2'],
        stats.distribution['1']
      ],
      backgroundColor: [
        'rgba(52, 211, 153, 0.8)',
        'rgba(96, 165, 250, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1, font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 12, weight: '600' } },
        grid: { display: false }
      }
    }
  };

  const totalRatings = stats.total_ratings || 1;

  return (
    <div className="dashboard-content">
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin/officer-performance" className="btn btn-secondary btn-sm">
          ← Back to Officers
        </Link>
      </div>

      {/* Officer Header */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, color: 'white'
            }}
          >
            {officer.name?.charAt(0) || 'O'}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
              {officer.name}
            </h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>📧 {officer.email}</span>
              <span className="badge-category">{officer.category}</span>
              <span style={{
                color: officer.is_active ? '#34d399' : '#ef4444',
                fontSize: '13px'
              }}>
                ● {officer.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StarDisplay rating={stats.avg_rating} size="lg" />
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {stats.avg_rating.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {stats.total_ratings} review{stats.total_ratings !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {stats.avg_rating.toFixed(2)} ⭐
          </div>
          <div className="stat-label">Avg Rating</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #667eea' }}>
          <div className="stat-value" style={{ color: '#667eea' }}>{stats.total_ratings}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {stats.grievances.resolved}
          </div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #60a5fa' }}>
          <div className="stat-value" style={{ color: '#60a5fa' }}>
            {stats.grievances.total}
          </div>
          <div className="stat-label">Total Grievances</div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="chart-container glass-card full-width" style={{ marginBottom: '20px' }}>
        <h3>📊 Rating Distribution</h3>
        <div style={{ height: '220px' }}>
          <Bar data={distData} options={chartOptions} />
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px', color: 'var(--text-secondary)' }}>
          Rating Breakdown
        </h3>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[String(star)];
          const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          return (
            <div key={star} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '4px', fontSize: '13px'
              }}>
                <span style={{ color: '#fbbf24' }}>{star} ★</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {count} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div style={{
                height: '8px', background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px', overflow: 'hidden'
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: star >= 4
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : star === 3
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  borderRadius: '10px',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px', color: 'var(--text-secondary)' }}>
          💬 Recent Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
            <p>No reviews yet for this officer</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.map((r) => (
              <div
                key={r.rating_id}
                style={{
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: `3px solid ${
                    r.rating >= 4 ? '#34d399' : r.rating === 3 ? '#fbbf24' : '#ef4444'
                  }`
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StarDisplay rating={r.rating} size="sm" />
                    <strong style={{ fontSize: '14px' }}>
                      {r.founder_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                        ({r.startup_name})
                      </span>
                    </strong>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDate(r.created_at)}
                  </span>
                </div>
                {r.feedback && (
                  <p style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    lineHeight: 1.6, margin: '6px 0'
                  }}>
                    "{r.feedback}"
                  </p>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  📋 {r.grievance_title} · <span className="badge-category" style={{ fontSize: '10px', padding: '1px 8px' }}>
                    {r.predicted_category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDetail;

