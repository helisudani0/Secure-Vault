import React, { useEffect, useState, useContext } from 'react';
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
import './Dashboard.css';

export default function Dashboard() {
  const { getMasterPassword, unlockVault, secureStorage } = useContext(AuthContext);
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [activeTab, setActiveTab] = useState('my-files');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Load private key after vault unlock
  const loadPrivateKey = async (masterPassword) => {
    try {
      const encryptedPrivateKey = secureStorage.get('encrypted_private_key');
      if (!encryptedPrivateKey) {
        setUnlockError('Encrypted private key not found. Please login again.');
        return false;
      }

      const blob = encryptedPrivateKey;

      const base64Key = await decryptPrivateKeyWithPassword(
        blob.ciphertext,
        masterPassword,
        blob.salt,
        blob.iv
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

  // Handle unlock
  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    const success = await loadPrivateKey(masterPasswordInput);
    if (!success) {
      setMasterPasswordInput('');
    }
  };

  // Fetch files
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

  // On component mount
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

  // Handle file download
  const handleFileDownload = async (file) => {
    try {
      if (!privateKey) {
        alert('Vault is locked. Please unlock it first.');
        return;
      }

      const response = await downloadEncryptedFile(file.id);
      const wrappedKey = response.data.wrapped_key;

      const aesKey = await unwrapAESKey(wrappedKey, privateKey);
      const decryptedData = await decryptFile(response.data.encrypted_data, aesKey);

      const blob = new Blob([decryptedData], { type: file.mime_type });
      const url = URL.createObjectURL(blob);
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

  // Filter files based on search
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSharedFiles = sharedFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Unlock Your Vault</h2>
              <p className="text-slate-400 mt-2">Enter your master password to continue</p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              {unlockError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {unlockError}
                </div>
              )}
              <input
                type="password"
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                placeholder="Enter master password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Unlock Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"></path>
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm5-4a1 1 0 00-1 1v3H6a1 1 0 000 2h1v3a1 1 0 102 0v-3h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h1 className="text-xl font-bold">Secure Vault</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {[
              { id: 'my-files', label: 'My Files', icon: '📁' },
              { id: 'shared', label: 'Shared with Me', icon: '👥' },
              { id: 'recent', label: 'Recent', icon: '⏰' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  activeTab === item.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">My Account</p>
                <p className="text-xs text-slate-400 truncate">Profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
              {/* View mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>

              {/* Unlock button */}
              {!privateKey && (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all"
                >
                  🔓 Unlock
                </button>
              )}

              {/* Upload button */}
              <FileUpload onUploadSuccess={() => fetchFiles()} privateKey={privateKey} />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-8">
            {activeTab === 'my-files' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">My Files</h2>
                  <p className="text-slate-400">{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}</p>
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">No files yet</h3>
                    <p className="text-slate-400 mb-6">Upload your first file to get started</p>
                    <FileUpload onUploadSuccess={() => fetchFiles()} privateKey={privateKey} showButton />
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl p-4 transition-all duration-200 cursor-pointer"
                        onClick={() => handleFileDownload(file)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-lg">
                            📄
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 4.586v12.828A2 2 0 0111.414 20H6a2 2 0 01-2-2v-8.5a.5.5 0 01.5-.5h5a.5.5 0 000-1h-5a.5.5 0 01-.5-.5V4z"></path>
                              </svg>
                            </button>
                            <button className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <h3 className="font-medium truncate mb-2">{file.name}</h3>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{(file.size / 1024).toFixed(2)} KB</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-lg transition-all duration-200 cursor-pointer"
                        onClick={() => handleFileDownload(file)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                          📄
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{file.name}</h3>
                          <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB • {new Date(file.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0113 4.586v12.828A2 2 0 0111.414 20H6a2 2 0 01-2-2v-8.5a.5.5 0 01.5-.5h5a.5.5 0 000-1h-5a.5.5 0 01-.5-.5V4z"></path>
                            </svg>
                          </button>
                          <button className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300 flex-shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shared' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Shared with Me</h2>
                  <p className="text-slate-400">{filteredSharedFiles.length} file{filteredSharedFiles.length !== 1 ? 's' : ''}</p>
                </div>

                {filteredSharedFiles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 9H3m6 0h6m-6 0v6m0-6v-6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">No shared files</h3>
                    <p className="text-slate-400">Files shared with you will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSharedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                          👥
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{file.name}</h3>
                          <p className="text-sm text-slate-400">Shared by User • {new Date(file.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
