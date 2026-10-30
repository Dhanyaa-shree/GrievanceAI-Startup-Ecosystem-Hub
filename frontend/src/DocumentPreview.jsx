import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const DocumentPreview = ({ 
  documentId, 
  fileName, 
  fileType, 
  fileSize,
  onClose,
  onDownload,
  isReviewed = false,
  reviewNotes = '',
  officerName = 'Officer',
  reviewDate = null
}) => {
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isImage, setIsImage] = useState(false);
  const [isPDF, setIsPDF] = useState(false);
  const [isText, setIsText] = useState(false);
  const [fileContent, setFileContent] = useState(null);

  // Determine file type on mount
  useEffect(() => {
    const ext = fileName?.split('.').pop().toLowerCase();
    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
    const textTypes = ['txt', 'csv', 'md', 'log', 'json', 'xml', 'html', 'css', 'js'];
    const pdfTypes = ['pdf'];

    if (imageTypes.includes(ext)) {
      setIsImage(true);
      setIsPDF(false);
      setIsText(false);
    } else if (pdfTypes.includes(ext)) {
      setIsPDF(true);
      setIsImage(false);
      setIsText(false);
    } else if (textTypes.includes(ext)) {
      setIsText(true);
      setIsImage(false);
      setIsPDF(false);
    } else {
      // Unknown type - try to fetch anyway
      setIsImage(false);
      setIsPDF(false);
      setIsText(false);
    }

    fetchFile();
  }, [documentId, fileName]);

  // Fetch file from server
  const fetchFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/elite/documents/${documentId}/download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // If text file, read content
      if (isText) {
        const text = await blob.text();
        setFileContent(text);
      }

      setFileUrl(url);

    } catch (err) {
      setError(err.message || 'Failed to load document');
      toast.error('Failed to load document preview');
    }

    setLoading(false);
  };

  // Handle download
  const handleDownload = () => {
    if (onDownload) {
      onDownload(documentId, fileName);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloading...');
    }
  };

  // Handle copy to clipboard (for text files)
  const handleCopyText = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
      toast.success('Text copied to clipboard!');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file icon
  const getFileIcon = () => {
    const ext = fileName?.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📃',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      svg: '🖼️',
      webp: '🖼️',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      csv: '📊',
      json: '📋',
      xml: '📋',
      html: '🌐',
      css: '🎨',
      js: '💻',
      md: '📝'
    };
    return icons[ext] || '📎';
  };

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  return (
    <div className="document-preview-modal" onClick={onClose}>
      <div className="document-preview-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="document-preview-header">
          <div className="document-preview-title">
            <span className="doc-preview-icon">{getFileIcon()}</span>
            <div>
              <h3>{fileName || 'Document'}</h3>
              <div className="doc-preview-meta">
                <span>{formatFileSize(fileSize)}</span>
                <span className="doc-preview-divider">•</span>
                <span>{fileType || 'Unknown type'}</span>
                {isReviewed && (
                  <>
                    <span className="doc-preview-divider">•</span>
                    <span className="doc-review-badge">✅ Reviewed</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="document-preview-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
              title="Download"
            >
              ⬇️ Download
            </button>
            <button 
              className="btn btn-secondary btn-sm close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="document-preview-body">
          {loading ? (
            <div className="doc-preview-loading">
              <div className="spinner spinner-lg"></div>
              <p>Loading document...</p>
            </div>
          ) : error ? (
            <div className="doc-preview-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="btn btn-primary btn-sm" onClick={fetchFile}>
                Retry
              </button>
            </div>
          ) : isImage && fileUrl ? (
            <div className="doc-preview-image">
              <img src={fileUrl} alt={fileName} />
            </div>
          ) : isPDF && fileUrl ? (
            <div className="doc-preview-pdf">
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1`}
                title={fileName}
                className="pdf-iframe"
              />
            </div>
          ) : isText && fileContent !== null ? (
            <div className="doc-preview-text">
              <div className="text-toolbar">
                <button className="btn btn-secondary btn-sm" onClick={handleCopyText}>
                  📋 Copy
                </button>
                <span className="text-info">
                  {fileContent.split('\n').length} lines • {fileContent.length} characters
                </span>
              </div>
              <pre className="text-content">{fileContent}</pre>
            </div>
          ) : fileUrl ? (
            <div className="doc-preview-unknown">
              <span className="unknown-icon">📎</span>
              <p>Preview not available for this file type</p>
              <button className="btn btn-primary" onClick={handleDownload}>
                ⬇️ Download File
              </button>
            </div>
          ) : (
            <div className="doc-preview-empty">
              <p>No content to preview</p>
            </div>
          )}
        </div>

        {/* Footer - Review Notes */}
        {reviewNotes && (
          <div className="document-preview-footer">
            <div className="review-notes-section">
              <h4 className="review-notes-title">📋 Review Notes</h4>
              <div className="review-notes-content">
                <p>{reviewNotes}</p>
                {reviewDate && (
                  <span className="review-date">
                    Reviewed by {officerName} on {new Date(reviewDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;

