import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  importPrivateKeyFromBase64,
  decryptPrivateKeyWithPassword,
  unwrapAESKey,
  decryptFile,
} from '../utils/crypto';
import FileUpload from '../components/FileUpload';
import { downloadEncryptedFile } from '../api/api';
import { getUserFiles, getSharedFiles } from '../api/files';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { getMasterPassword, secureStorage, user, logout } = useContext(AuthContext);
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const navigate = useNavigate();

  const loadPrivateKey = async (masterPassword) => {
    try {
      const encryptedPrivateKey = secureStorage.get('encrypted_private_key');
      if (!encryptedPrivateKey) {
        setUnlockError('Encrypted private key not found. Please login again.');
        return false;
      }

      const base64Key = await decryptPrivateKeyWithPassword(
        encryptedPrivateKey.ciphertext,
        masterPassword,
        encryptedPrivateKey.salt,
        encryptedPrivateKey.iv
      );

      const key = await importPrivateKeyFromBase64(base64Key);
      setPrivateKey(key);
      setShowUnlockModal(false);
      setUnlockError('');
      return true;
    } catch (err) {
      console.error('Failed to decrypt private key:', err);
      setUnlockError('Incorrect master password');
      return false;
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    const success = await loadPrivateKey(masterPasswordInput);
    if (!success) {
      setMasterPasswordInput('');
    }
  };

  const fetchFiles = async () => {
    try {
      const userFiles = await getUserFiles();
      const sharedFilesList = await getSharedFiles();
      setFiles(userFiles || []);
      setSharedFiles(sharedFilesList || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const masterPassword = getMasterPassword();
    if (masterPassword) {
      loadPrivateKey(masterPassword).then((success) => {
        if (success) {
          fetchFiles();
        } else {
          setLoading(false);
        }
      });
    } else {
      setShowUnlockModal(true);
      setLoading(false);
    }
  }, []);

  const handleFileDownload = async (file) => {
    try {
      if (!privateKey) {
        alert('Vault is locked. Please unlock it first.');
        return;
      }

      const response = await downloadEncryptedFile(file.id);
      const wrappedKey = response.data.wrapped_key;
      const ivB64 = response.data.iv;

      const aesKey = await unwrapAESKey(wrappedKey, privateKey);
      const decryptedBlob = await decryptFile(aesKey, ivB64, response.data.encrypted_data);

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full mx-4 shadow-lg">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">Unlock Vault</h2>
              <p className="text-gray-600 text-sm mt-1">Enter master password</p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3">
              {unlockError && (
                <div className="p-2 rounded bg-red-100 border border-red-300 text-red-700 text-sm">
                  {unlockError}
                </div>
              )}
              <input
                type="password"
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                placeholder="master password"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
            <p className="text-gray-600 text-sm">{files.length} file(s)</p>
          </div>
          <div className="flex gap-2">
            <FileUpload onUploadSuccess={() => fetchFiles()} privateKey={privateKey} />
            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded text-sm hover:bg-gray-100 transition"
            >
              Settings
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-3 py-2 border border-red-300 text-red-600 font-medium rounded text-sm hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded shadow">
          {files.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 text-sm">No files yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFileDownload(file)}
                    className="ml-4 px-3 py-1 text-blue-600 hover:bg-blue-50 font-medium rounded text-sm transition flex-shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared Files */}
        {sharedFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Shared with Me</h2>
            <div className="bg-white rounded shadow divide-y divide-gray-200">
              {sharedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Shared • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFileDownload(file)}
                    className="ml-4 px-3 py-1 text-purple-600 hover:bg-purple-50 font-medium rounded text-sm transition flex-shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
