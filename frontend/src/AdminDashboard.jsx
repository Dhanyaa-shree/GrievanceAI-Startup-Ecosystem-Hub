import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bar, Doughnut } from 'react-chartjs-2';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [officers, setOfficers] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [showOfficersModal, setShowOfficersModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    fetchGrievances();
    fetchOfficers();
  }, [statusFilter, categoryFilter]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      let url = '/all-grievances';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setGrievances(data.grievances || []);
        setStats(data.stats || { total: 0, pending: 0, under_review: 0, resolved: 0 });
      } else {
        if (data.message === 'Unauthorized') {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('adminLoggedIn');
          navigate('/admin-login');
        } else {
          toast.error(data.message || 'Failed to load grievances');
        }
      }
    } catch (error) {
      toast.error('Failed to load grievances. Check backend.');
    }
    setLoading(false);
  };

  const fetchOfficers = async () => {
    try {
      const response = await fetch('/admin/officers', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setOfficers(data.officers || []);
      }
    } catch (error) {
      console.error('Failed to fetch officers');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Status updated to ${status}`);
        fetchGrievances();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAutoConnect = async (grievanceId) => {
    setConnecting(true);
    try {
      const response = await fetch(`/grievance/assign/${grievanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchGrievances();
        fetchOfficers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to assign grievance');
    }
    setConnecting(false);
  };

  const handleManualConnect = async (grievanceId, officerId) => {
    setConnecting(true);
    try {
      const response = await fetch(`/grievance/assign/${grievanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ officer_id: officerId })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchGrievances();
        fetchOfficers();
        setShowOfficersModal(false);
        setSelectedGrievance(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to assign grievance');
    }
    setConnecting(false);
  };

  const getFreeOfficersForCategory = (category) => {
    return officers.filter(o => 
      o.category === category && 
      o.is_free === true && 
      o.is_active === 1
    );
  };

  const filteredGrievances = grievances.filter(g =>
    g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.founder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.startup_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ UPDATED: Added "General" category
  const categoryData = {
    labels: ['Funding', 'Hiring', 'Marketing', 'Legal', 'Mentorship', 'General'],
    datasets: [{
      label: 'Grievances by Category',
      data: [
        grievances.filter(g => g.predicted_category === 'Funding').length,
        grievances.filter(g => g.predicted_category === 'Hiring').length,
        grievances.filter(g => g.predicted_category === 'Marketing').length,
        grievances.filter(g => g.predicted_category === 'Legal').length,
        grievances.filter(g => g.predicted_category === 'Mentorship').length,
        grievances.filter(g => g.predicted_category === 'General').length,
      ],
      backgroundColor: ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
      borderColor: ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
      borderWidth: 2
    }]
  };

  const statusChartData = {
    labels: ['Pending', 'Under Review', 'Resolved'],
    datasets: [{
      label: 'Grievances by Status',
      data: [stats.pending || 0, stats.under_review || 0, stats.resolved || 0],
      backgroundColor: ['#fbbf24', '#60a5fa', '#34d399'],
      borderColor: ['#fbbf24', '#60a5fa', '#34d399'],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          stepSize: 1
        },
        grid: {
          color: 'rgba(255,255,255,0.05)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.5)'
        },
        grid: {
          color: 'rgba(255,255,255,0.05)'
        }
      }
    }
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
        <h1>📊 Admin Dashboard</h1>
        <p>Manage and track all startup grievances</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Grievances</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #60a5fa' }}>
          <div className="stat-value" style={{ color: '#60a5fa' }}>{stats.under_review}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container glass-card">
          <h3>📊 Category Distribution</h3>
          <div style={{ height: '220px' }}>
            <Bar data={categoryData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-container glass-card">
          <h3>📈 Status Distribution</h3>
          <div style={{ height: '220px' }}>
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Funding">Funding</option>
          <option value="Hiring">Hiring</option>
          <option value="Marketing">Marketing</option>
          <option value="Legal">Legal</option>
          <option value="Mentorship">Mentorship</option>
          <option value="General">General</option>
        </select>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm" onClick={fetchGrievances}>🔄 Refresh</button>
      </div>

      <div className="table-container glass-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Founder</th>
              <th>Startup</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assignment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrievances.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table">No grievances found</td>
              </tr>
            ) : (
              filteredGrievances.map((g) => (
                <tr key={g.id}>
                  <td>#{g.id}</td>
                  <td><strong>{g.founder_name}</strong></td>
                  <td>{g.startup_name}</td>
                  <td><strong>{g.title}</strong></td>
                  <td><span className="badge-category">{g.predicted_category}</span></td>
                  <td>
                    <span className={`badge status-${g.status.toLowerCase().replace(' ', '-')}`}>
                      {g.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${g.assignment_status === 'Unassigned' ? 'badge-pending' : 'badge-resolved'}`}>
                      {g.assignment_status || 'Unassigned'}
                    </span>
                    {g.assigned_officer_name && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        👤 {g.assigned_officer_name}
                      </span>
                    )}
                  </td>
                  <td>
                    {g.assignment_status === 'Unassigned' ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAutoConnect(g.id)}
                          disabled={connecting}
                        >
                          🔗 Auto Connect
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setShowOfficersModal(true);
                            setSelectedGrievance(g);
                          }}
                          disabled={connecting}
                        >
                          👤 Select Officer
                        </button>
                      </div>
                    ) : (
                      <select
                        value={g.status}
                        onChange={(e) => updateStatus(g.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showOfficersModal && selectedGrievance && (
        <div className="modal-overlay" onClick={() => setShowOfficersModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>
              👤 Select Officer for: {selectedGrievance.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Category: <strong>{selectedGrievance.predicted_category}</strong>
            </p>
            
            {getFreeOfficersForCategory(selectedGrievance.predicted_category).length === 0 ? (
              <div className="empty-state">
                <p>No free officers available in this category</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Please check officer availability or try auto-connect
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowOfficersModal(false);
                    handleAutoConnect(selectedGrievance.id);
                  }}
                >
                  Try Auto-Connect
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getFreeOfficersForCategory(selectedGrievance.predicted_category).map((officer) => (
                  <div
                    key={officer.officer_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <strong>{officer.name}</strong>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {officer.email} | {officer.active_grievances}/{officer.max_grievances} active
                      </p>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleManualConnect(selectedGrievance.id, officer.officer_id)}
                      disabled={connecting}
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setShowOfficersModal(false)}
              style={{ marginTop: '16px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;