import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OfficerChat = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  // ✅ Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/officer/check-auth', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.is_logged_in) {
          sessionStorage.setItem('officerId', data.officer.id);
          sessionStorage.setItem('officerName', data.officer.name);
          fetchTickets();
          fetchUnreadCount();
        } else {
          navigate('/officer-login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/officer-login');
      }
    };
    
    checkAuth();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ✅ Polling for selected ticket
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!selectedTicket) {
      return;
    }

    console.log('🔄 Starting polling for ticket:', selectedTicket.ticket_id);

    intervalRef.current = setInterval(() => {
      if (selectedTicket) {
        fetchMessages(selectedTicket.ticket_id, true);
      }
      fetchTickets();
      fetchUnreadCount();
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ fetchTickets
  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/chat/officer/tickets', {
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

  // ✅ fetchMessages
  const fetchMessages = async (ticketId, silent = false) => {
    try {
      const response = await fetch(`/api/chat/messages/${ticketId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        console.log('📩 Messages from backend:', data.messages);
        setMessages(data.messages || []);
        setTickets(prev => prev.map(t => 
          t.ticket_id === ticketId ? { ...t, unread_count: 0 } : t
        ));
        fetchUnreadCount();
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load messages');
    }
  };

  // ✅ fetchUnreadCount
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/chat/officer/unread-count', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // ✅ sendMessage
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
          as_role: 'officer'
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        await fetchMessages(selectedTicket.ticket_id, true);
        await fetchTickets();
        await fetchUnreadCount();
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
    setSending(false);
  };

  // ✅ scrollToBottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ formatTime - IST
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
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

  // ✅ formatDate - IST
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

  // ✅ Get tier info from ticket
  const getTierInfo = (ticket) => {
    const tierLabels = {
      'chat': { label: 'STANDARD', icon: '🥉', color: '#cd7f32' },
      'document': { label: 'ELITE', icon: '🥈', color: '#c0c0c0' },
      'call': { label: 'PREMIUM', icon: '🥇', color: '#ffd700' }
    };
    return tierLabels[ticket.ticket_type] || { label: 'UNKNOWN', icon: '🎫', color: '#ffffff' };
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
        <h1>💬 Officer Chat Dashboard</h1>
        <p>
          Manage all your assigned chats
          {unreadCount > 0 && (
            <span className="officer-unread-badge">{unreadCount} unread</span>
          )}
        </p>
      </div>

      <div className="chat-container glass-card">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No active chats</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              You don't have any active chat tickets assigned
            </p>
          </div>
        ) : (
          <div className="chat-layout">
            {/* Left Panel - Chat List */}
            <div className="chat-list-panel">
              <div className="chat-list-header">
                <h3>Assigned Chats</h3>
                <span className="chat-count">{tickets.length}</span>
              </div>
              <div className="chat-list">
                {tickets.map((ticket) => {
                  const tier = getTierInfo(ticket);
                  return (
                    <div
                      key={ticket.ticket_id}
                      className={`chat-list-item ${selectedTicket?.ticket_id === ticket.ticket_id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        fetchMessages(ticket.ticket_id);
                      }}
                    >
                      <div className="chat-item-avatar">
                        {ticket.founder_name?.charAt(0) || 'F'}
                      </div>
                      <div className="chat-item-info">
                        <div className="chat-item-name">{ticket.founder_name}</div>
                        <div className="chat-item-preview">
                          {ticket.last_message || 'No messages yet'}
                        </div>
                        <div className="chat-item-meta">
                          <span className="chat-item-startup">{ticket.startup_name}</span>
                          {/* ✅ Display tier badge */}
                          <span className="chat-item-tier" style={{ 
                            color: tier.color,
                            fontWeight: '600',
                            fontSize: '11px'
                          }}>
                            {tier.icon} {tier.label}
                          </span>
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
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Chat Window */}
            {selectedTicket ? (
              <div className="chat-window">
                {/* Chat Header */}
                <div className="chat-window-header">
                  <div className="chat-header-info">
                    <div className="chat-header-avatar">
                      {selectedTicket.founder_name?.charAt(0) || 'F'}
                    </div>
                    <div>
                      <div className="chat-header-name">{selectedTicket.founder_name}</div>
                      <div className="chat-header-sub">
                        <span className="chat-header-startup">{selectedTicket.startup_name}</span>
                        {selectedTicket.tier_icon && (
                          <span className="chat-header-tier" style={{
                            color: selectedTicket.tier_color || '#ffffff',
                            fontWeight: '600'
                          }}>
                            {selectedTicket.tier_icon} {selectedTicket.tier_label}
                          </span>
                        )}
                        <span className={`chat-header-status ${selectedTicket.status.toLowerCase()}`}>
                          ● {selectedTicket.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <span className="chat-ticket-id">🎫 #{selectedTicket.ticket_id}</span>
                    <span className="chat-grievance">{selectedTicket.grievance_title}</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-empty">
                      <span>💬</span>
                      <p>No messages yet</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Start the conversation with the founder
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const showDate = index === 0 || 
                          new Date(msg.sent_at).toDateString() !== new Date(messages[index - 1].sent_at).toDateString();
                        
                        const isSent = msg.sender_type === 'officer';
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
                    placeholder="Type your reply..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !sending) {
                        sendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={sendMessage}
                    disabled={sending || !messageInput.trim()}
                  >
                    {sending ? (
                      <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
                    ) : (
                      '📤 Send'
                    )}
                  </button>
                </div>
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

export default OfficerChat;