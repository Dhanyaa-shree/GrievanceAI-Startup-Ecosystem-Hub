import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const TicketServiceModal = ({ grievance, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ✅ FIXED: Pass ticket_type to backend
  const handlePurchase = async (ticketType) => {
    setLoading(true);
    setSelectedTicket(ticketType);
    
    try {
      const response = await fetch('/api/ticket/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          grievance_id: grievance.id,
          ticket_type: ticketType  // ✅ FIXED: Send ticket type
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('🎉 Ticket created! Redirecting to payment...');
        navigate('/payment', { 
          state: { 
            ticket: {
              ticket_id: data.ticket.ticket_id,
              price: data.ticket.price,
              ticket_type: data.ticket.ticket_type,
              grievance_title: grievance.title,
              officer_name: grievance.assigned_officer_name
            }
          } 
        });
        onClose();
        if (onSuccess) onSuccess(data.ticket);
      } else {
        toast.error(data.message || 'Failed to create ticket');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>🎫 Get Expert Help</h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Select a service to get expert help for: <strong>{grievance.title}</strong>
          <br />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Assigned Officer: {grievance.assigned_officer_name || 'Not assigned yet'}
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
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Unlimited Chat with your assigned officer
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Unlimited messages</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Response within 24 hours</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Valid for 7 days</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '110px' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#cd7f32' }}>₹599</div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handlePurchase('chat')}
                disabled={loading}
                style={{ marginTop: '4px' }}
              >
                {loading && selectedTicket === 'chat' ? 'Processing...' : '🔥 Buy Now'}
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
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Document Review with expert feedback
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📄 Upload documents</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Expert review</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✅ Chat with document sharing</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '110px' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#c0c0c0' }}>₹999</div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handlePurchase('document')}
                disabled={loading}
                style={{ marginTop: '4px' }}
              >
                {loading && selectedTicket === 'document' ? 'Processing...' : '🔥 Buy Now'}
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
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                30-minute expert call with booking
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 30-min call</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📅 Calendar booking</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🎯 Personalized guidance</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: '110px' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffd700' }}>₹2,999</div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handlePurchase('call')}
                disabled={loading}
                style={{ marginTop: '4px' }}
              >
                {loading && selectedTicket === 'call' ? 'Processing...' : '🔥 Buy Now'}
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
          onClick={onClose}
          style={{ marginTop: '16px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TicketServiceModal;

