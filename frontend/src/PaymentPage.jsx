import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [saveCard, setSaveCard] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    const state = location.state;
    console.log('💰 Payment page received state:', state);
    
    if (state && state.ticket) {
      setTicketDetails(state.ticket);
      setTicketId(state.ticket.ticket_id);
      // Save to sessionStorage as fallback
      sessionStorage.setItem('paymentTicket', JSON.stringify(state.ticket));
    } else {
      // Try to recover from sessionStorage
      const savedTicket = sessionStorage.getItem('paymentTicket');
      if (savedTicket) {
        try {
          const parsed = JSON.parse(savedTicket);
          setTicketDetails(parsed);
          setTicketId(parsed.ticket_id);
          toast.info('🔄 Recovered payment details');
        } catch (e) {
          toast.error('No payment details found');
          navigate('/my-grievances');
        }
      } else {
        toast.error('No payment details found');
        navigate('/my-grievances');
      }
    }
  }, [location, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\D/g, '');
      const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
      setCardDetails({ ...cardDetails, cardNumber: formatted });
      return;
    }
    
    if (name === 'expiry') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        const formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        setCardDetails({ ...cardDetails, expiry: formatted });
        return;
      }
      setCardDetails({ ...cardDetails, expiry: cleaned });
      return;
    }
    
    setCardDetails({ ...cardDetails, [name]: value });
  };

  // ✅ FIXED: Redirect based on ticket type
  const redirectAfterPayment = (ticketData) => {
    const ticketType = ticketData?.ticket_type;
    console.log('🔄 Redirecting based on ticket type:', ticketType);
    
    // Clear session storage
    sessionStorage.removeItem('paymentTicket');
    
    if (ticketType === 'document') {
      // ✅ ELITE - Go to Elite Chat with ticket data
      navigate('/elite-chat', { 
        state: { 
          ticket: ticketData,
          isElite: true,
          fromPayment: true
        }
      });
    } else if (ticketType === 'call') {
      // ✅ PREMIUM - Go to Premium Booking with ticket data
      navigate('/premium-booking', { 
        state: { 
          ticket: ticketData,
          isPremium: true,
          fromPayment: true
        }
      });
    } else {
      // ✅ STANDARD - Go to My Tickets
      navigate('/my-tickets');
    }
  };

  const handlePayment = async () => {
    // Basic validation
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid card number');
      return;
    }
    if (!cardDetails.cardHolder) {
      toast.error('Please enter card holder name');
      return;
    }
    if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
      toast.error('Please enter valid expiry date');
      return;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast.error('Please enter valid CVV');
      return;
    }

    setLoading(true);

    try {
      console.log('💳 Processing payment for ticket:', ticketId);
      
      const response = await fetch(`/api/ticket/payment/simulate/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('📦 Payment response:', data);
      
      if (data.success) {
        setPaymentSuccess(true);
        toast.success('✅ Payment successful! Ticket activated.');
        
        // Prepare ticket data for redirect
        const ticketData = {
          ticket_id: ticketId,
          price: ticketDetails?.price,
          ticket_type: ticketDetails?.ticket_type,
          grievance_title: ticketDetails?.grievance_title || 'N/A',
          officer_name: ticketDetails?.officer_name || 'Officer',
          officer_id: ticketDetails?.officer_id
        };
        
        // ✅ Redirect after 2.5 seconds
        setTimeout(() => {
          redirectAfterPayment(ticketData);
        }, 2500);
        
      } else {
        toast.error(data.message || 'Payment failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (!ticketDetails) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading payment details...</p>
      </div>
    );
  }

  if (paymentSuccess) {
    const typeLabels = {
      chat: '💬 Standard Chat',
      document: '📄 Elite Document Review',
      call: '📞 Premium Expert Call'
    };
    
    return (
      <div className="payment-success-container">
        <div className="payment-success-card glass-card">
          <div className="success-icon">✅</div>
          <h2 className="payment-success-title">Payment Successful!</h2>
          <p className="payment-success-subtitle">
            Your ticket has been activated successfully.
          </p>
          
          <div className="payment-success-details">
            <div className="success-detail-item">
              <span className="success-detail-label">🎫 Ticket ID</span>
              <span className="success-detail-value">#{ticketId}</span>
            </div>
            <div className="success-detail-item">
              <span className="success-detail-label">Service</span>
              <span className="success-detail-value">
                {typeLabels[ticketDetails.ticket_type] || ticketDetails.ticket_type}
              </span>
            </div>
            <div className="success-detail-item">
              <span className="success-detail-label">Officer</span>
              <span className="success-detail-value">{ticketDetails.officer_name || 'Dr. Rajesh Kumar'}</span>
            </div>
            <div className="success-detail-item">
              <span className="success-detail-label">Amount</span>
              <span className="success-detail-value" style={{ color: '#34d399', fontWeight: '700' }}>
                ₹{ticketDetails.price}.00
              </span>
            </div>
          </div>

          <div className="payment-success-loading">
            <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
            <span>
              {ticketDetails.ticket_type === 'document' ? '🔄 Redirecting to Elite Chat...' : 
               ticketDetails.ticket_type === 'call' ? '🔄 Redirecting to Premium Booking...' : 
               '🔄 Redirecting to My Tickets...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const typeLabels = {
    chat: '💬 Standard Chat',
    document: '📄 Elite Document Review',
    call: '📞 Premium Expert Call'
  };

  return (
    <div className="payment-page-wrapper">
      <div className="payment-page-card glass-card">
        {/* Header */}
        <div className="payment-page-header">
          <div className="payment-page-header-left">
            <div className="payment-page-icon">💳</div>
            <div>
              <h2 className="payment-page-title">Secure Payment</h2>
              <p className="payment-page-subtitle">Complete your purchase securely</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="payment-two-column">
          {/* Left Column - Payment Form */}
          <div className="payment-left-column">
            {/* Order Summary */}
            <div className="payment-order-summary">
              <h3 className="payment-section-title">Order Summary</h3>
              
              <div className="payment-summary-row">
                <span className="payment-summary-label">Service</span>
                <span className="payment-summary-value">
                  {typeLabels[ticketDetails.ticket_type] || ticketDetails.ticket_type}
                </span>
              </div>
              
              <div className="payment-summary-row">
                <span className="payment-summary-label">Officer</span>
                <span className="payment-summary-value">{ticketDetails.officer_name || 'Dr. Rajesh Kumar'}</span>
              </div>
              
              <div className="payment-summary-row">
                <span className="payment-summary-label">Grievance</span>
                <span className="payment-summary-value" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {ticketDetails.grievance_title || 'N/A'}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="payment-method-section">
              <h3 className="payment-section-title">Payment Method</h3>
              
              <div className="payment-method-options">
                <div className="payment-method-option active">
                  <span className="method-radio">●</span>
                  <span className="method-name">Credit / Debit Card</span>
                  <div className="method-icons">
                    <span>Visa</span>
                    <span>RuPay</span>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              <div className="payment-card-form">
                <div className="payment-form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleInputChange}
                    placeholder="Enter card number"
                    maxLength="19"
                  />
                </div>

                <div className="payment-form-group">
                  <label>Card Holder Name</label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={handleInputChange}
                    placeholder="Enter card holder name"
                  />
                </div>

                <div className="payment-form-row">
                  <div className="payment-form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardDetails.expiry}
                      onChange={handleInputChange}
                      placeholder="MM / YY"
                      maxLength="5"
                    />
                  </div>
                  <div className="payment-form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="•••"
                      maxLength="4"
                    />
                  </div>
                </div>

                <div className="payment-save-card">
                  <label className="payment-checkbox">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Save card for faster payments
                  </label>
                </div>

                {/* Security Info */}
                <div className="payment-security-info">
                  <div className="security-title">Why your payment is safe?</div>
                  <div className="security-items">
                    <div className="security-item">
                      <span>🔒</span> 256-bit SSL encryption
                    </div>
                    <div className="security-item">
                      <span>🛡️</span> PCI DSS compliant
                    </div>
                    <div className="security-item">
                      <span>✅</span> Secure and trusted transactions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Total */}
          <div className="payment-right-column">
            <div className="payment-order-total">
              <div className="payment-total-header">
                <span>Total Amount</span>
                <span className="payment-total-tax">Including all taxes</span>
              </div>
              <div className="payment-total-amount">₹{ticketDetails.price}.00</div>
              
              <div className="payment-recommended">
                <span className="recommended-badge">Recommended</span>
                <span className="recommended-text">Payment Method</span>
              </div>

              <button
                className="payment-pay-btn"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                    Processing...
                  </>
                ) : (
                  `Pay ₹${ticketDetails.price}.00`
                )}
              </button>

              <p className="payment-terms">
                By proceeding, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

