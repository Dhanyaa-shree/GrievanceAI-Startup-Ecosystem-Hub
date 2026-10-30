import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const EliteChat = ({ ticketId, founderId, officerName, officerId }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!ticketId) {
      toast.error('Invalid ticket');
      navigate('/my-grievances');
      return;
    }

    fetchMessages();
    fetchDocuments();
    
    intervalRef.current = setInterval(() => {
      fetchMessages(true);
      fetchDocuments();
    }, 10000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (silent = false) => {
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
    if (!silent) setLoading(false);
  };

  const fetchDocuments = async () => {
    try {
      console.log('📄 Fetching documents for ticket:', ticketId);
      const response = await fetch(`/api/elite/documents/${ticketId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📄 Documents response:', data);
      if (data.success) {
        setDocuments(data.documents || []);
        console.log('📄 Documents set:', data.documents);
      } else {
        console.error('❌ Failed to fetch documents:', data.message);
      }
    } catch (error) {
      console.error('❌ Failed to fetch documents:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    setSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticket_id: ticketId,
          message: messageInput.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        await fetchMessages(true);
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Network error');
    }
    setSending(false);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    console.log('📤 Uploading file:', file.name, file.size);

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|png|jpg|jpeg)$/i)) {
      toast.error('File type not supported. Please upload PDF, DOC, DOCX, TXT, PNG, or JPG.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticket_id', ticketId);

    try {
      const response = await fetch('/api/elite/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await response.json();
      console.log('📤 Upload response:', data);
      
      if (data.success) {
        toast.success('📄 Document uploaded successfully!');
        await fetchDocuments();
        await fetchMessages(true);
        // ✅ FIXED: Use /api/chat/send instead of non-existent endpoint
        await sendDocumentMessage(file.name, data.document?.document_id);
      } else {
        toast.error(data.message || 'Upload failed');
        console.error('❌ Upload failed:', data);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error('Network error. Please try again.');
    }
    setUploading(false);
  };

  // ✅ FIXED: Use existing /api/chat/send endpoint
  const sendDocumentMessage = async (fileName, documentId) => {
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticket_id: ticketId,
          message: `📄 Uploaded: ${fileName}`
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchMessages(true);
      }
    } catch (error) {
      console.error('Failed to send document message:', error);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="elite-chat-container glass-card">
      <div className="elite-chat-header">
        <div className="elite-chat-header-info">
          <div className="elite-chat-avatar">{officerName?.charAt(0) || 'O'}</div>
          <div>
            <h3>{officerName || 'Officer'}</h3>
            <div className="elite-chat-header-sub">
              <span className="elite-chat-badge">🥈 ELITE Document Review</span>
              <span className="elite-chat-status">● Active</span>
            </div>
          </div>
        </div>
        <div className="elite-chat-header-actions">
          <span className="elite-ticket-id">🎫 #{ticketId}</span>
          <span className="elite-doc-count">{documents.length} Documents</span>
        </div>
      </div>

      <div className="elite-upload-section">
        <div 
          className={`elite-drop-zone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            multiple={false}
          />
          {uploading ? (
            <div className="uploading-state">
              <div className="spinner" style={{ width: '28px', height: '28px' }}></div>
              <p>Uploading document...</p>
            </div>
          ) : (
            <>
              <span className="upload-icon">📤</span>
              <p>Drag & drop documents here or <span className="upload-link">click to browse</span></p>
              <small>Supports: PDF, DOC, DOCX, TXT, PNG, JPG (Max 10MB)</small>
            </>
          )}
        </div>

        {documents.length > 0 ? (
          <div className="elite-document-list">
            <h4 className="document-list-title">📎 Uploaded Documents ({documents.length})</h4>
            {documents.map((doc) => (
              <div key={doc.document_id} className="elite-document-item">
                <div className="doc-item-left">
                  <span className="doc-icon">📄</span>
                  <div className="doc-info">
                    <span className="doc-name">{doc.file_name}</span>
                    <span className="doc-meta">{formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="doc-item-right">
                  <span className={`doc-status ${doc.is_reviewed ? 'reviewed' : 'pending'}`}>
                    {doc.is_reviewed ? '✅ Reviewed' : '⏳ Pending'}
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm doc-download-btn"
                    onClick={() => downloadDocument(doc.document_id, doc.file_name)}
                    title="Download document"
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No documents uploaded yet
          </div>
        )}
      </div>

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
              const isSent = msg.sender_type === 'founder';
              const showDate = index === 0 || 
                new Date(msg.sent_at).toDateString() !== new Date(messages[index - 1].sent_at).toDateString();
              
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
                        {formatTime(msg.sent_at)}
                        {isSent && <span className="chat-message-read">{msg.is_read ? '✓✓' : '✓'}</span>}
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

      <div className="chat-input-area">
        <button 
          className="btn btn-secondary attach-btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach document"
        >
          📎
        </button>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
          disabled={sending}
        />
        <button 
          className="btn btn-primary" 
          onClick={sendMessage} 
          disabled={sending || !messageInput.trim()}
        >
          {sending ? <span className="spinner" style={{ width: '18px', height: '18px' }}></span> : '📤 Send'}
        </button>
      </div>
    </div>
  );
};

export default EliteChat;

