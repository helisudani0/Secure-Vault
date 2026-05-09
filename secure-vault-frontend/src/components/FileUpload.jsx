import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  generateRSAKeyPair,
  wrapAESKey,
  encryptFile,
  generateRandomBytes,
  deriveKeyFromPassword,
  encryptPrivateKey,
} from '../utils/crypto';
import './FileUpload.css';

export default function FileUpload({ onUploadSuccess, privateKey, showButton = false }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!privateKey) {
      alert('Please unlock your vault first');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Read file
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      // Encrypt file
      const aesKey = generateRandomBytes(32); // 256-bit key
      const iv = generateRandomBytes(16); // 128-bit IV
      const encryptedData = await encryptFile(new Uint8Array(fileData), aesKey, iv);

      // Wrap AES key with public key
      const publicKeyObj = privateKey;
      const wrappedKey = await wrapAESKey(aesKey, publicKeyObj);

      setUploadProgress(50);

      // Prepare form data
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('encrypted_data', new Blob([encryptedData]));
      formData.append('wrapped_key', wrappedKey);
      formData.append('iv', btoa(String.fromCharCode(...iv)));
      formData.append('mime_type', file.type || 'application/octet-stream');
      formData.append('size', file.size);

      // Upload
      const token = localStorage.getItem('access');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/files/upload/',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              50 + (progressEvent.loaded / progressEvent.total) * 50
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        onUploadSuccess();
      }, 500);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('File upload failed: ' + (err.response?.data?.detail || err.message));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <>
      {/* Upload button (for dashboard) */}
      {!showButton ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-lg"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {uploadProgress}%
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" />
              </svg>
              Upload
            </>
          )}
        </button>
      ) : (
        // Upload area (for empty state)
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Your First File
        </button>
      )}

      {/* Drag and drop area */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Uploading...</h3>
            <p className="text-slate-400 mb-6">Encrypting and uploading your file</p>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-400">{uploadProgress}% complete</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading || !privateKey}
      />
    </>
  );
}
