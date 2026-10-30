/**
 * OfficerEliteReview.jsx
 * ------------------------------------------------------------------
 * Officer-side Elite document review page (chat + documents + review modal).
 *
 * Emoji version — no ./Icons dependency.
 * ALL working logic preserved: state, effects, fetch, navigate,
 * IST offset, 15s polling interval, and every handler unchanged.
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OfficerEliteReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const officerId = sessionStorage.getItem('officerId');
    if (!officerId) {
      navigate('/officer-login');
      return;
    }
    fetchEliteTickets();

    intervalRef.current = setInterval(() => {
      if (selectedTicket) {
        fetchMessages(selectedTicket.ticket_id, true);
        fetchDocuments(selectedTicket.ticket_id);
      }
      fetchEliteTickets();
    }, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchEliteTickets = async () => {
    try {
      const response = await fetch('/api/officer/all-tickets', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📋 All tickets for officer:', data);

      if (data.success) {
        // Filter only ELITE tickets (document type)
        const eliteTickets = (data.tickets || []).filter(t => t.ticket_type === 'document');
        console.log('✅ Elite tickets found:', eliteTickets);
        setTickets(eliteTickets || []);

        // Check if ticket ID in URL
        const queryParams = new URLSearchParams(location.search);
        const ticketId = queryParams.get('ticket');

        if (ticketId) {
          const ticket = eliteTickets.find(t => t.ticket_id === parseInt(ticketId));
          if (ticket) {
            setSelectedTicket(ticket);
            fetchMessages(ticket.ticket_id);
            fetchDocuments(ticket.ticket_id);
            return;
          }
        }

        if (!selectedTicket && eliteTickets && eliteTickets.length > 0) {
          setSelectedTicket(eliteTickets[0]);
          fetchMessages(eliteTickets[0].ticket_id);
          fetchDocuments(eliteTickets[0].ticket_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch elite tickets:', error);
    }
    setLoading(false);
  };

  const fetchMessages = async (ticketId, silent = false) => {
    try {
      const response = await fetch(`/api/chat/messages/${ticketId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load messages');
    }
  };

  const fetchDocuments = async (ticketId) => {
    try {
      const response = await fetch(`/api/elite/documents/${ticketId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;
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
          message: messageInput.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        await fetchMessages(selectedTicket.ticket_id, true);
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Network error');
    }
    setSending(false);
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const response = await fetch(`/api/elite/documents/${documentId}/download`, {
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Downloading...');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleReviewDocument = async (documentId) => {
    if (!reviewNotes.trim()) {
      toast.error('Please enter review notes');
      return;
    }

    try {
      const response = await fetch(`/api/elite/review/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: reviewNotes })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Document reviewed successfully');
        setShowReviewModal(false);
        setReviewNotes('');
        fetchDocuments(selectedTicket.ticket_id);
      } else {
        toast.error(data.message || 'Failed to review document');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 30);
      const today = new Date();
      const todayStr = today.toDateString();
      const msgDateStr = date.toDateString();
      if (msgDateStr === todayStr) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (msgDateStr === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        <h1>Elite Document Review</h1>
        <p>Review documents uploaded by founders</p>
      </div>

      <div className="elite-chat-container glass-card">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No Elite tickets assigned</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              You don't have any Elite document review tickets
            </p>
          </div>
        ) : (
          <div className="chat-layout">
            {/* Left Panel - Ticket List */}
            <div className="chat-list-panel elite-list-panel">
              <div className="chat-list-header">
                <h3>Elite Chats</h3>
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
                      fetchDocuments(ticket.ticket_id);
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
                        <span className="chat-item-status active">
                          ● Elite
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Chat + Documents */}
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
                        <span className="chat-header-status active">
                          ● Elite
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <span className="chat-ticket-id">
                      🎫 #{selectedTicket.ticket_id}
                    </span>
                    <span className="chat-grievance">{selectedTicket.grievance_title}</span>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="elite-documents-section">
                  <h4>
                    📄 Uploaded Documents ({documents.length})
                  </h4>
                  {documents.length === 0 ? (
                    <p className="elite-empty-docs">No documents uploaded yet</p>
                  ) : (
                    <div className="elite-docs-list">
                      {documents.map((doc) => (
                        <div key={doc.document_id} className="elite-document-item">
                          <div className="doc-item-left">
                            <div className="doc-icon-wrap">
                              📄
                            </div>
                            <div className="doc-info">
                              <span className="doc-name">{doc.file_name}</span>
                              <span className="doc-meta">{formatFileSize(doc.file_size)}</span>
                            </div>
                            <span className={`doc-status ${doc.is_reviewed ? 'reviewed' : 'pending'}`}>
                              {doc.is_reviewed ? '✅ Reviewed' : '⏳ Pending'}
                            </span>
                          </div>
                          <div className="doc-item-right">
                            <button
                              className="doc-download-btn"
                              onClick={() => downloadDocument(doc.document_id, doc.file_name)}
                              title="Download document"
                              aria-label="Download document"
                            >
                              ⬇️
                            </button>
                            {!doc.is_reviewed && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setSelectedDocId(doc.document_id); setShowReviewModal(true); }}
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-empty">
                      <div className="chat-empty-icon">
                        💬
                      </div>
                      <p>No messages yet</p>
                      <p className="chat-empty-hint">Start the conversation with the founder</p>
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
                    onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
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
                      <>
                        Send 📤
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="chat-empty-window">
                <div className="chat-empty-icon">
                  💬
                </div>
                <p>Select a chat to start</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div
            className="modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="review-modal-header">
              <h3 className="review-modal-title">
                📄 Review Document
              </h3>
              <button
                className="review-modal-close"
                onClick={() => { setShowReviewModal(false); setReviewNotes(''); }}
                title="Close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="review-modal-subtitle">
              Add your review notes for this document
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Enter your review notes..."
              rows="5"
              className="review-modal-textarea"
            />
            <div className="review-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => { setShowReviewModal(false); setReviewNotes(''); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleReviewDocument(selectedDocId)}
              >
                ✅ Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerEliteReview;