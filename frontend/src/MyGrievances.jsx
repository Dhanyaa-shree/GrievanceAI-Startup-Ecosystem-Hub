import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import RatingModal from './RatingModal';

const MyGrievances = ({ founderId }) => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  // ⭐ RATING STATE
  const [ratingGrievance, setRatingGrievance] = useState(null);
  const [ratedGrievances, setRatedGrievances] = useState([]);

  useEffect(() => {
    if (!founderId) {
      navigate('/register');
      return;
    }
    fetchGrievances();
  }, [founderId, ticketCreated]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/my-grievances/${founderId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📋 Grievances:', data);
      if (data.success) {
        setGrievances(data.grievances || []);
        // ⭐ After loading grievances, check which resolved ones are already rated
        fetchRatedStatus(data.grievances || []);
      }
    } catch (error) {
      toast.error('Failed to load grievances');
    }
    setLoading(false);
  };

  // ⭐ Fetch which resolved grievances have already been rated
  const fetchRatedStatus = async (grievanceList) => {
    const resolved = grievanceList.filter(g => g.status === 'Resolved');
    if (resolved.length === 0) {
      setRatedGrievances([]);
      return;
    }

    const ratedIds = [];
    for (const g of resolved) {
      try {
        const check = await fetch(`/api/rating/check/${g.id}`, {
          credentials: 'include'
        });
        const cdata = await check.json();
        if (cdata.success && cdata.is_rated) {
          ratedIds.push(g.id);
        }
      } catch (e) {
        console.error('Rating check failed for grievance', g.id, e);
      }
    }
    setRatedGrievances(ratedIds);
  };

  // ✅ FIXED: ALL tiers go to PAYMENT first
  const handleBuyTicket = async (grievanceId, ticketType) => {
    console.log('🎫 Buying ticket:', { grievanceId, ticketType });
    setBookingLoading(true);
    setSelectedTier(ticketType);

    // ✅ Store selected grievance before async operations
    const currentGrievance = selectedGrievance;

    try {
      // Step 1: Create ticket
      const response = await fetch('/api/ticket/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          grievance_id: grievanceId,
          ticket_type: ticketType
        })
      });

      const data = await response.json();
      console.log('📦 Ticket creation response:', data);

      if (data.success) {
        toast.success('🎉 Ticket created! Redirecting to payment...');

        // ✅ Step 2: Redirect to PAYMENT with ticket details
        const ticketData = {
          ticket_id: data.ticket.ticket_id,
          price: data.ticket.price,
          ticket_type: data.ticket.ticket_type,
          grievance_title: currentGrievance?.title || 'N/A',
          officer_name: currentGrievance?.assigned_officer_name || 'Officer',
          officer_id: currentGrievance?.assigned_officer_id,
          grievance_id: grievanceId
        };

        console.log('💳 Redirecting to payment with:', ticketData);

        // ✅ ALWAYS go to payment page
        navigate('/payment', {
          state: { ticket: ticketData }
        });

        setShowTicketModal(false);
        setTicketCreated(!ticketCreated);
        setBookingLoading(false);
        setSelectedTier(null);
        return;
      }

      // ✅ Handle "already pending" case - FIXED: toast.error instead of toast.info
      if (data.message && data.message.includes('already pending')) {
        toast.error('⏳ You already have a pending ticket for this grievance');

        // Fetch existing pending ticket
        const ticketsResponse = await fetch('/api/my-tickets', {
          credentials: 'include'
        });
        const ticketsData = await ticketsResponse.json();
        console.log('🎫 Existing tickets:', ticketsData);

        if (ticketsData.success) {
          const existingTicket = ticketsData.tickets.find(t =>
            t.grievance_id === grievanceId && t.status === 'Pending'
          );

          if (existingTicket) {
            toast.success('🔄 Redirecting to payment...');

            const ticketData = {
              ticket_id: existingTicket.ticket_id,
              price: existingTicket.price,
              ticket_type: existingTicket.ticket_type,
              grievance_title: currentGrievance?.title || 'N/A',
              officer_name: currentGrievance?.assigned_officer_name || 'Officer',
              officer_id: currentGrievance?.assigned_officer_id,
              grievance_id: grievanceId
            };

            navigate('/payment', {
              state: { ticket: ticketData }
            });

            setShowTicketModal(false);
            setBookingLoading(false);
            setSelectedTier(null);
            return;
          }
        }

        toast.error('Please check "My Tickets" to continue payment');
        navigate('/my-tickets');
        setBookingLoading(false);
        setSelectedTier(null);
        return;
      }

      toast.error(data.message || 'Failed to create ticket');

    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Network error. Please try again.');
    }

    setBookingLoading(false);
    setSelectedTier(null);
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
        <p>Track all your submitted grievances</p>
      </div>

      <div className="card glass-card">
        {grievances.length === 0 ? (
          <div className="empty-state">
            <p>No grievances submitted yet.</p>
            <Link to="/submit-grievance" className="btn btn-primary">Submit Grievance</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Officer</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g, i) => (
                  <tr key={g.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{g.title}</strong>
                      <p className="text-muted">{g.description?.length > 80 ? g.description.substring(0, 80) + '...' : g.description}</p>
                    </td>
                    <td><span className="badge-category">{g.predicted_category}</span></td>
                    <td><span className={`badge status-${g.status.toLowerCase().replace(' ', '-')}`}>{g.status}</span></td>
                    <td>{g.assigned_officer_name || 'Not assigned'}</td>
                    <td>{new Date(g.date).toLocaleDateString()}</td>
                    <td>
                      {g.assigned_officer_name && !g.has_active_ticket ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            console.log('🖱️ Selected grievance:', g);
                            setSelectedGrievance(g);
                            setShowTicketModal(true);
                          }}
                        >
                          🎫 Get Expert Help
                        </button>
                      ) : g.has_active_ticket ? (
                        <span style={{ color: '#34d399', fontSize: '13px', fontWeight: '600' }}>
                          ✅ Active Ticket
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          No officer assigned
                        </span>
                      )}

                      {/* ⭐ RATE OFFICER BUTTON — only when Resolved & officer assigned */}
                      {g.status === 'Resolved' && g.assigned_officer_name && (
                        ratedGrievances.includes(g.id) ? (
                          <div
                            style={{
                              display: 'inline-block',
                              marginTop: '6px',
                              padding: '4px 10px',
                              background: 'rgba(251,191,36,0.12)',
                              border: '1px solid rgba(251,191,36,0.25)',
                              borderRadius: '50px',
                              color: '#fbbf24',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            ⭐ Rated
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm"
                            style={{
                              display: 'block',
                              marginTop: '6px',
                              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              color: '#1a1a2e',
                              fontWeight: 700,
                              border: 'none',
                              boxShadow: '0 4px 14px rgba(251,191,36,0.3)',
                              padding: '6px 14px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                            onClick={() => setRatingGrievance(g)}
                          >
                            ⭐ Rate Officer
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          TICKET SERVICE MODAL
          ============================================================ */}
      {showTicketModal && selectedGrievance && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>🎫 Get Expert Help</h2>
              <button
                onClick={() => setShowTicketModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Select a service to get expert help for: <strong>{selectedGrievance.title}</strong>
              <br />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Assigned Officer: {selectedGrievance.assigned_officer_name || 'Not assigned yet'}
              </span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* STANDARD - Unlimited Chat (₹599) */}
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(205, 127, 50, 0.08)',
                  border: '2px solid rgba(205, 127, 50, 0.3)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(205, 127, 50, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(205, 127, 50, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(205, 127, 50, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(205, 127, 50, 0.3)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#cd7f32' }}>
                      <span style={{ marginRight: '6px', fontSize: '20px' }}>🥉</span> STANDARD
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(52, 211, 153, 0.2)',
                      color: '#34d399',
                      padding: '2px 10px',
                      borderRadius: '50px',
                      fontWeight: '600'
                    }}>
                      ✅ Available
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Unlimited Chat with your assigned officer</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Unlimited messages</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Response within 24 hours</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Valid for 7 days</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#cd7f32' }}>₹599</div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBuyTicket(selectedGrievance.id, 'chat')}
                    disabled={bookingLoading}
                  >
                    {bookingLoading && selectedTier === 'chat' ? 'Processing...' : '🔥 Buy Now'}
                  </button>
                </div>
              </div>

              {/* ELITE - Document Review (₹999) */}
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(192, 192, 192, 0.05)',
                  border: '2px solid rgba(192, 192, 192, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(192, 192, 192, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(192, 192, 192, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(192, 192, 192, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(192, 192, 192, 0.2)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#c0c0c0' }}>
                      <span style={{ marginRight: '6px', fontSize: '20px' }}>🥈</span> ELITE
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(52, 211, 153, 0.2)',
                      color: '#34d399',
                      padding: '2px 10px',
                      borderRadius: '50px',
                      fontWeight: '600'
                    }}>
                      ✅ Available
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Document Review with expert feedback</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📄 Upload documents</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Expert review</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Chat with document sharing</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#c0c0c0' }}>₹999</div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBuyTicket(selectedGrievance.id, 'document')}
                    disabled={bookingLoading}
                  >
                    {bookingLoading && selectedTier === 'document' ? 'Processing...' : '🔥 Buy Now'}
                  </button>
                </div>
              </div>

              {/* PREMIUM - Expert Call (₹2,999) */}
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '2px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ffd700' }}>
                      <span style={{ marginRight: '6px', fontSize: '20px' }}>🥇</span> PREMIUM
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(52, 211, 153, 0.2)',
                      color: '#34d399',
                      padding: '2px 10px',
                      borderRadius: '50px',
                      fontWeight: '600'
                    }}>
                      ✅ Available
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>30-minute expert call with booking</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 30-min call</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 Calendar booking</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🎯 Personalized guidance</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffd700' }}>₹2,999</div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBuyTicket(selectedGrievance.id, 'call')}
                    disabled={bookingLoading}
                  >
                    {bookingLoading && selectedTier === 'call' ? 'Processing...' : '🔥 Buy Now'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(251,191,36,0.08)', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p style={{ fontSize: '13px', color: '#fbbf24', margin: 0 }}>
                💡 <strong>Demo Mode:</strong> No real payment required. Click "Buy Now" to simulate payment.
              </p>
            </div>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => setShowTicketModal(false)}
              style={{ marginTop: '16px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          ⭐ RATING MODAL
          ============================================================ */}
      {ratingGrievance && (
        <RatingModal
          grievance={{
            id: ratingGrievance.id,
            title: ratingGrievance.title,
            officer_name: ratingGrievance.assigned_officer_name,
            officer_category: ratingGrievance.predicted_category
          }}
          onClose={() => setRatingGrievance(null)}
          onSuccess={() => {
            setRatingGrievance(null);
            // Refresh rated status so button changes to "⭐ Rated"
            fetchRatedStatus(grievances);
          }}
        />
      )}
    </div>
  );
};

export default MyGrievances;

