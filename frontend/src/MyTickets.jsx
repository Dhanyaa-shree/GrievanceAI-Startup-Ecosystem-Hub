import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/my-tickets', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        toast.error(data.message || 'Failed to load tickets');
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Pending': 'badge-pending',
      'Paid': 'badge-under-review',
      'Active': 'badge-resolved',
      'Completed': 'badge-resolved',
      'Cancelled': 'badge-pending',
      'Expired': 'badge-pending'
    };
    return `badge ${classes[status] || ''}`;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'chat': '🥉',
      'document': '🥈',
      'call': '🥇'
    };
    return icons[type] || '🎫';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'chat': 'Standard Chat',
      'document': 'Elite Document Review',
      'call': 'Premium Expert Call'
    };
    return labels[type] || type;
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
        <h1>🎫 My Tickets</h1>
        <p>Track all your purchased services</p>
      </div>

      <div className="card glass-card">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <p>You haven't purchased any tickets yet.</p>
            <Link to="/my-grievances" className="btn btn-primary">View My Grievances</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Grievance</th>
                  <th>Type</th>
                  <th>Officer</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Messages</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td>#{ticket.ticket_id}</td>
                    <td>
                      <strong>{ticket.grievance_title}</strong>
                    </td>
                    <td>
                      <span>{getTypeIcon(ticket.ticket_type)} {getTypeLabel(ticket.ticket_type)}</span>
                    </td>
                    <td>{ticket.officer_name}</td>
                    <td>₹{ticket.price}</td>
                    <td>
                      <span className={getStatusBadge(ticket.status)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.message_count || 0}</td>
                    <td>
                      {ticket.ticket_type === 'chat' && ticket.status === 'Active' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/founder-chat')}
                        >
                          💬 Chat
                        </button>
                      )}
                      {ticket.status === 'Pending' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => toast.info('⏳ Payment processing...')}
                        >
                          Pay ₹{ticket.price}
                        </button>
                      )}
                      {ticket.status === 'Completed' && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          ✅ Completed
                        </span>
                      )}
                      {ticket.status === 'Expired' && (
                        <span style={{ color: '#ef4444', fontSize: '12px' }}>
                          ⏰ Expired
                        </span>
                      )}
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

export default MyTickets;

