import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [officerName, setOfficerName] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [allTickets, setAllTickets] = useState([]);

  useEffect(() => {
    const officerId = sessionStorage.getItem('officerId');
    const name = sessionStorage.getItem('officerName');
    
    if (!officerId) {
      navigate('/officer-login');
      return;
    }
    
    setOfficerName(name || 'Officer');
    fetchAllTickets();
  }, []);

  // ✅ Fetch all tickets for the officer using new endpoint
  const fetchAllTickets = async () => {
    try {
      const response = await fetch('/api/officer/all-tickets', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('🎫 Officer tickets fetched:', data);
      
      if (data.success) {
        setAllTickets(data.tickets || []);
        fetchGrievances(data.tickets || []);
      } else {
        console.log('❌ No tickets found for officer');
        fetchGrievances([]);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      fetchGrievances([]);
    }
  };

  const fetchGrievances = async (tickets) => {
    setLoading(true);
    try {
      const response = await fetch('/officer/grievances', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📋 Grievances data:', data);
      
      if (data.success) {
        const grievancesWithTickets = (data.grievances || []).map(g => {
          const ticket = tickets.find(t => 
            t.grievance_id === g.id && 
            (t.status === 'Active' || t.status === 'Paid')
          );
          console.log(`🔍 Grievance ${g.id}:`, { 
            grievance_id: g.id,
            ticket_found: !!ticket,
            ticket: ticket 
          });
          return { ...g, ticket };
        });
        
        setGrievances(grievancesWithTickets || []);
        
        const total = grievancesWithTickets?.length || 0;
        const active = grievancesWithTickets?.filter(g => g.status !== 'Resolved').length || 0;
        const resolved = grievancesWithTickets?.filter(g => g.status === 'Resolved').length || 0;
        setStats({ total, active, resolved });
      } else {
        if (data.message === 'Officer not logged in') {
          navigate('/officer-login');
        }
      }
    } catch (error) {
      toast.error('Failed to load grievances');
    }
    setLoading(false);
  };

  // ✅ Get tier info from ticket
  const getTierInfo = (grievance) => {
    const ticket = grievance?.ticket;
    
    if (!ticket) {
      return {
        tier: 'No Ticket',
        icon: '📌',
        badgeClass: 'badge-pending',
        showChat: false,
        showDocuments: false,
        showMeetings: false,
        showZoom: false
      };
    }

    if (ticket.ticket_type === 'chat') {
      return {
        tier: 'STANDARD',
        icon: '🥉',
        badgeClass: 'badge-standard',
        showChat: true,
        showDocuments: false,
        showMeetings: false,
        showZoom: false
      };
    } else if (ticket.ticket_type === 'document') {
      return {
        tier: 'ELITE',
        icon: '🥈',
        badgeClass: 'badge-elite',
        showChat: true,
        showDocuments: true,
        showMeetings: false,
        showZoom: false
      };
    } else if (ticket.ticket_type === 'call') {
      return {
        tier: 'PREMIUM',
        icon: '🥇',
        badgeClass: 'badge-premium',
        showChat: true,
        showDocuments: false,
        showMeetings: true,
        showZoom: true
      };
    }
    
    return {
      tier: 'Unknown',
      icon: '❓',
      badgeClass: 'badge-pending',
      showChat: false,
      showDocuments: false,
      showMeetings: false,
      showZoom: false
    };
  };

  // ✅ Navigate to chat - ALL tiers go to Officer Chat page
  const openChat = (grievance) => {
    if (grievance?.ticket?.ticket_id) {
      // ✅ Pass ticket ID to OfficerChat to show specific chat
      navigate(`/officer-chat?ticket=${grievance.ticket.ticket_id}`);
    } else {
      navigate('/officer-chat');
    }
  };

  // ✅ Navigate to documents - ELITE only
  const viewDocuments = (grievance) => {
    if (grievance?.ticket?.ticket_id) {
      navigate(`/officer-elite-review?ticket=${grievance.ticket.ticket_id}`);
    } else {
      toast.info('No documents available for this grievance');
    }
  };

  // ✅ Navigate to meetings - PREMIUM only
  const viewMeetings = (grievance) => {
    navigate('/officer-meetings');
  };

  const updateStatus = async (grievanceId, status) => {
    try {
      const response = await fetch(`/officer/grievance/${grievanceId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes: '' })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Status updated to ${status}`);
        fetchAllTickets();
      }
    } catch (error) {
      toast.error('Failed to update status');
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
        <h1>👋 Welcome, {officerName}!</h1>
        <p>Manage your assigned grievances and assist founders</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Grievances</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #667eea' }}>
          <div className="stat-value" style={{ color: '#667eea' }}>{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</div>
          <div className="stat-label">Resolution Rate</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/officer-chat" className="quick-action glass-card">
          <span className="action-icon">💬</span>
          <h3>Chat with Founders</h3>
          <p>View and respond to founder messages</p>
        </Link>
        <Link to="/officer-grievances" className="quick-action glass-card">
          <span className="action-icon">📋</span>
          <h3>View Grievances</h3>
          <p>Manage all assigned grievances</p>
        </Link>
      </div>

      {/* Recent Grievances */}
      <div className="recent-section">
        <h2>📋 My Grievances</h2>
        {grievances.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No grievances assigned yet.</p>
          </div>
        ) : (
          <div className="table-container glass-card">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Founder</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grievances.slice(0, 10).map((g, i) => {
                  const tierInfo = getTierInfo(g);
                  
                  return (
                    <tr key={g.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{g.founder_name}</strong>
                        <p className="text-muted" style={{ fontSize: '12px' }}>{g.startup_name}</p>
                      </td>
                      <td>{g.title}</td>
                      <td><span className="badge-category">{g.predicted_category}</span></td>
                      <td>
                        <span className={`badge ${tierInfo.badgeClass}`}>
                          {tierInfo.icon} {tierInfo.tier}
                        </span>
                      </td>
                      <td>
                        <span className={`badge status-${g.status.toLowerCase().replace(' ', '-')}`}>
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* 💬 Chat - ALL tiers (Standard, Elite, Premium) */}
                          {tierInfo.showChat && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openChat(g)}
                              title="Chat with founder"
                            >
                              💬 Chat
                            </button>
                          )}
                          
                          {/* 📄 Documents - ELITE only */}
                          {tierInfo.showDocuments && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => viewDocuments(g)}
                              title="Review documents"
                              style={{ background: 'rgba(192,192,192,0.15)', color: '#c0c0c0' }}
                            >
                              📄 Docs
                            </button>
                          )}
                          
                          {/* 📅 Meeting - PREMIUM only */}
                          {tierInfo.showMeetings && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => viewMeetings(g)}
                              title="View meetings"
                              style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700' }}
                            >
                              📅 Meeting
                            </button>
                          )}
                          
                          {/* Status Update */}
                          <select
                            value={g.status}
                            onChange={(e) => updateStatus(g.id, e.target.value)}
                            className="status-select"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            <option value="Under Review">Under Review</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;

