import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

const DocumentUpload = ({ 
  ticketId, 
  onUploadSuccess, 
  onUploadError,
  maxSize = 10, // MB
  acceptedTypes = ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'ppt', 'pptx'],
  buttonText = 'Upload Document',
  multiple = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Validate file type
  const isValidType = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    return acceptedTypes.includes(ext);
  };

  // Validate file size
  const isValidSize = (file) => {
    return file.size <= maxSize * 1024 * 1024;
  };

  // Get file icon based on type
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📃',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️'
    };
    return icons[ext] || '📎';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle file selection from input
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  // Process files (validate and upload)
  const processFiles = async (selectedFiles) => {
    // Validate files
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach(file => {
      if (!isValidType(file)) {
        errors.push(`${file.name}: Unsupported file type. Allowed: ${acceptedTypes.join(', ')}`);
      } else if (!isValidSize(file)) {
        errors.push(`${file.name}: File size exceeds ${maxSize}MB limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }

    if (validFiles.length === 0) return;

    // If single file mode, just upload the first file
    if (!multiple && validFiles.length > 1) {
      toast.warning('Only one file can be uploaded at a time');
      await uploadFile(validFiles[0]);
      return;
    }

    // Upload all valid files
    setFiles(validFiles);
    for (const file of validFiles) {
      await uploadFile(file);
    }
  };

  // Upload single file
  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticket_id', ticketId);

    try {
      // Simulate progress (since fetch doesn't support progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/elite/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        toast.success(`📄 ${file.name} uploaded successfully!`);
        if (onUploadSuccess) {
          onUploadSuccess(data.document || data);
        }
        // Remove file from list on success
        setFiles(prev => prev.filter(f => f.name !== file.name));
      } else {
        toast.error(data.message || `Failed to upload ${file.name}`);
        if (onUploadError) {
          onUploadError(data.message);
        }
      }
    } catch (error) {
      toast.error(`Network error uploading ${file.name}`);
      if (onUploadError) {
        onUploadError(error.message);
      }
    }

    setUploading(false);
    setUploadProgress(0);
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  // Trigger file input click
  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  // Remove file from pending list
  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <div className={`document-upload-wrapper ${className}`}>
      {/* Drop Zone */}
      <div
        className={`document-drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          multiple={multiple}
          disabled={uploading}
        />

        {uploading ? (
          <div className="upload-progress-container">
            <div className="upload-spinner">
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            </div>
            <div className="upload-progress-text">
              <p>Uploading...</p>
              <div className="upload-progress-bar">
                <div 
                  className="upload-progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="upload-progress-percent">{uploadProgress}%</span>
            </div>
          </div>
        ) : (
          <>
            <div className="upload-icon-container">
              <span className="upload-icon-big">📤</span>
            </div>
            <h4 className="upload-title">Drop your documents here</h4>
            <p className="upload-subtitle">
              or <span className="upload-browse-link">click to browse</span>
            </p>
            <div className="upload-formats">
              {acceptedTypes.map(type => (
                <span key={type} className="upload-format-tag">.{type}</span>
              ))}
            </div>
            <small className="upload-size-limit">
              Max file size: {maxSize}MB
            </small>
          </>
        )}
      </div>

      {/* Pending Files List */}
      {files.length > 0 && !uploading && (
        <div className="upload-pending-files">
          <h5 className="pending-title">📎 Pending Uploads ({files.length})</h5>
          {files.map((file, index) => (
            <div key={index} className="upload-pending-item">
              <div className="pending-item-left">
                <span className="pending-item-icon">{getFileIcon(file.name)}</span>
                <div className="pending-item-info">
                  <span className="pending-item-name">{file.name}</span>
                  <span className="pending-item-size">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button 
                className="pending-item-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.name);
                }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            className="btn btn-primary btn-sm upload-all-btn"
            onClick={() => {
              const remainingFiles = files.filter(f => !f._uploaded);
              if (remainingFiles.length > 0) {
                processFiles(remainingFiles);
              }
            }}
          >
            Upload All ({files.length})
          </button>
        </div>
      )}

      {/* Compact Button Mode */}
      {!files.length && !uploading && buttonText && (
        <button 
          className="btn btn-primary upload-trigger-btn"
          onClick={handleClick}
          disabled={uploading}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default DocumentUpload;

