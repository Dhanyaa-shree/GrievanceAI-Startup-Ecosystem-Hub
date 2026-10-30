import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const FounderChat = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const founderId = localStorage.getItem('founderId');
    if (!founderId) {
      navigate('/register');
      return;
    }
    fetchTickets();
    
    intervalRef.current = setInterval(() => {
      if (selectedTicket) {
        fetchMessages(selectedTicket.ticket_id, true);
      }
      fetchTickets();
    }, 10000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/chat/founder/tickets', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (!selectedTicket && data.tickets && data.tickets.length > 0) {
          setSelectedTicket(data.tickets[0]);
          fetchMessages(data.tickets[0].ticket_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
    setLoading(false);
  };

  const fetchMessages = async (ticketId, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/chat/messages/${ticketId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setTickets(prev => prev.map(t => 
          t.ticket_id === ticketId ? { ...t, unread_count: 0 } : t
        ));
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load messages');
    }
    if (!silent) setLoading(false);
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (!selectedTicket) {
      toast.error('No ticket selected');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          message: messageInput.trim(),
          as_role: 'founder'
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        await fetchMessages(selectedTicket.ticket_id, true);
        await fetchTickets();
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
    setSending(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ FINAL FIX: Convert UTC to IST with correct AM/PM
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      // Add 5 hours 30 minutes for IST
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 30);
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return '';
    }
  };

  // ✅ Format date with IST conversion
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 30);
      
      const today = new Date();
      const todayStr = today.toDateString();
      const msgDateStr = date.toDateString();
      
      if (msgDateStr === todayStr) {
        return 'Today';
      }
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (msgDateStr === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
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
        <h1>💬 My Chats</h1>
        <p>Chat with your assigned officers</p>
      </div>

      <div className="chat-container glass-card">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No active chats</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Purchase a chat ticket to start messaging your officer
            </p>
            <Link to="/my-grievances" className="btn btn-primary" style={{ marginTop: '16px' }}>
              View Grievances
            </Link>
          </div>
        ) : (
          <div className="chat-layout">
            {/* Left Panel - Chat List */}
            <div className="chat-list-panel">
              <div className="chat-list-header">
                <h3>Active Chats</h3>
                <span className="chat-count">{tickets.length}</span>
              </div>
              <div className="chat-list">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    className={`chat-list-item ${selectedTicket?.ticket_id === ticket.ticket_id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      fetchMessages(ticket.ticket_id);
                    }}
                  >
                    <div className="chat-item-avatar">
                      {ticket.officer_name?.charAt(0) || 'O'}
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-name">{ticket.officer_name}</div>
                      <div className="chat-item-preview">
                        {ticket.last_message || 'No messages yet'}
                      </div>
                      <div className="chat-item-meta">
                        <span className="chat-item-category">{ticket.officer_category}</span>
                        <span className={`chat-item-status ${ticket.status.toLowerCase()}`}>
                          ● {ticket.status}
                        </span>
                      </div>
                    </div>
                    <div className="chat-item-right">
                      {ticket.unread_count > 0 && (
                        <span className="chat-unread-badge">{ticket.unread_count}</span>
                      )}
                      <span className="chat-item-time">
                        {ticket.last_message_time ? formatTime(ticket.last_message_time) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Chat Window */}
            {selectedTicket ? (
              <div className="chat-window">
                {/* Chat Header */}
                <div className="chat-window-header">
                  <div className="chat-header-info">
                    <div className="chat-header-avatar">
                      {selectedTicket.officer_name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <div className="chat-header-name">{selectedTicket.officer_name}</div>
                      <div className="chat-header-sub">
                        <span className="chat-header-category">{selectedTicket.officer_category}</span>
                        <span className={`chat-header-status ${selectedTicket.status.toLowerCase()}`}>
                          ● {selectedTicket.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <span className="chat-ticket-id">🎫 #{selectedTicket.ticket_id}</span>
                    {selectedTicket.expires_at && (
                      <span className="chat-expiry">
                        Expires: {new Date(selectedTicket.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-empty">
                      <span>💬</span>
                      <p>No messages yet</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Start the conversation with your officer
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const showDate = index === 0 || 
                          new Date(msg.sent_at).toDateString() !== new Date(messages[index - 1].sent_at).toDateString();
                        
                        // ⭐ FIX: Founder messages on RIGHT (sent), Officer messages on LEFT (received)
                        // We trust the backend's sender_type — it derives from the session cookie.
                        const isSent = msg.sender_type === 'founder';
                        const timeDisplay = formatTime(msg.sent_at);
                        
                        return (
                          <React.Fragment key={msg.message_id}>
                            {showDate && (
                              <div className="chat-date-divider">
                                <span>{formatDate(msg.sent_at)}</span>
                              </div>
                            )}
                            <div className={`chat-message ${isSent ? 'sent' : 'received'}`}>
                              <div className="chat-message-content">
                                <div className="chat-message-text">{msg.message}</div>
                                <div className="chat-message-time">
                                  {timeDisplay}
                                  {isSent && (
                                    <span className="chat-message-read">
                                      {msg.is_read ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="chat-input-area">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !sending) {
                        sendMessage();
                      }
                    }}
                    disabled={sending || selectedTicket.status !== 'Active'}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={sendMessage}
                    disabled={sending || !messageInput.trim() || selectedTicket.status !== 'Active'}
                  >
                    {sending ? (
                      <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
                    ) : (
                      '📤 Send'
                    )}
                  </button>
                </div>
                {selectedTicket.status !== 'Active' && (
                  <div className="chat-ticket-inactive">
                    ⚠️ This ticket is {selectedTicket.status}. You cannot send messages.
                  </div>
                )}
              </div>
            ) : (
              <div className="chat-empty-window">
                <span>💬</span>
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FounderChat;