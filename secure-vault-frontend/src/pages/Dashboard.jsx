import React, { useEffect, useState, useContext } from "react";
import {
  importPrivateKeyFromBase64,
  decryptPrivateKeyWithPassword,
  unwrapAESKey,
  decryptFile
} from "../utils/crypto";
import FileUpload from "../components/FileUpload";
import { downloadEncryptedFile } from "../api/api";
import { getUserFiles, getSharedFiles } from "../api/files";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { getMasterPassword, unlockVault, secureStorage } = useContext(AuthContext);
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // ===================================================
  // LOAD PRIVATE KEY (after vault unlock)
  // ===================================================
  const loadPrivateKey = async (masterPassword) => {
    try {
      const encryptedPrivateKey = secureStorage.get("encrypted_private_key");
      if (!encryptedPrivateKey) {
        setUnlockError("Encrypted private key not found. Please login again.");
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
      setUnlockError("");
      return true;
    } catch (err) {
      console.error("Failed to decrypt private key:", err);
      setUnlockError("Invalid master password. Please try again.");
      return false;
    }
  };

  // ===================================================
  // HANDLE VAULT UNLOCK
  // ===================================================
  const handleUnlockVault = async (e) => {
    e.preventDefault();
    if (!masterPasswordInput.trim()) {
      setUnlockError("Please enter your master password");
      return;
    }

    // Unlock vault in auth context
    unlockVault(masterPasswordInput);

    // Try to decrypt private key
    const success = await loadPrivateKey(masterPasswordInput);
    if (!success) {
      unlockVault(null); // Lock vault again on error
    } else {
      setMasterPasswordInput(""); // Clear input
      setLoading(false);
    }
  };

  // ===================================================
  // CHECK IF VAULT IS UNLOCKED ON MOUNT
  // ===================================================
  useEffect(() => {
    const checkVaultStatus = async () => {
      const currentMasterPassword = getMasterPassword();
      
      if (currentMasterPassword) {
        // Vault already unlocked in this session
        const success = await loadPrivateKey(currentMasterPassword);
        setLoading(false);
      } else {
        // Vault locked - show unlock modal
        setShowUnlockModal(true);
        setLoading(false);
      }
    };

    checkVaultStatus();
  }, [getMasterPassword]);

  // ===================================================
  // LOAD USER'S FILES
  // ===================================================
  useEffect(() => {
    if (!privateKey) return;

    async function loadFiles() {
      const token = secureStorage.get("access");
      if (!token) return;

      try {
        const data = await getUserFiles(token);
        setFiles(data);
      } catch (err) {
        console.error("Failed to load files:", err);
      }
    }

    loadFiles();
  }, [privateKey, secureStorage]);

  // ===================================================
  // LOAD SHARED FILES
  // ===================================================
  useEffect(() => {
    if (!privateKey) return;

    async function loadSharedFiles() {
      const token = secureStorage.get("access");
      if (!token) return;

      try {
        const data = await getSharedFiles(token);
        setSharedFiles(data);
      } catch (err) {
        console.error("Failed to load shared files:", err);
      }
    }

    loadSharedFiles();
  }, [privateKey, secureStorage]);

  // ===================================================
  // DOWNLOAD & DECRYPT OWNED FILE
  // ===================================================
  async function downloadAndDecryptFile(fileId, filename) {
    if (!privateKey) return alert("Private key not loaded.");

    try {
      const token = secureStorage.get("access");

      const response = await fetch(
        `http://127.0.0.1:8000/api/files/download/${fileId}/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const wrappedKey = response.headers.get("X-WRAPPED-KEY");
      const iv = response.headers.get("X-IV");
      const encryptedFile = await response.arrayBuffer();

      const aesKey = await unwrapAESKey(privateKey, wrappedKey);
      const decryptedBlob = await decryptFile(aesKey, iv, encryptedFile);

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("File download/decrypt failed:", err);
      alert("Failed to decrypt file.");
    }
  }

  // ===================================================
  // DOWNLOAD & DECRYPT SHARED FILE
  // ===================================================
  async function downloadAndDecryptSharedFile(sharedObj) {
    if (!privateKey) return alert("Private key not loaded.");

    try {
      const token = secureStorage.get("access");

      const aesKey = await unwrapAESKey(privateKey, sharedObj.wrapped_key);
      const blob = await downloadEncryptedFile(token, sharedObj.file);
      const arrayBuffer = await blob.arrayBuffer();

      const decryptedBlob = await decryptFile(
        aesKey,
        sharedObj.file_iv,
        arrayBuffer
      );

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = sharedObj.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Shared file decrypt failed:", err);
      alert("Failed to decrypt shared file.");
    }
  }

  // ===================================================
  // RENDER UNLOCK MODAL
  // ===================================================
  if (showUnlockModal) {
    return (
      <div className="unlock-modal-overlay">
        <div className="unlock-modal">
          <h2>🔓 Unlock Your Vault</h2>
          <p>Enter your master password to access your encrypted files</p>
          <form onSubmit={handleUnlockVault}>
            {unlockError && <p className="error-text">{unlockError}</p>}
            <input
              type="password"
              placeholder="Master password"
              value={masterPasswordInput}
              onChange={(e) => setMasterPasswordInput(e.target.value)}
              autoFocus
              required
            />
            <button type="submit">Unlock Vault</button>
          </form>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER LOADING STATE
  // ===================================================
  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading your vault...</p>
      </div>
    );
  }

  // ===================================================
  // RENDER DASHBOARD
  // ===================================================
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🔐 Secure Vault</h1>

      {privateKey ? (
        <p className="success-text">Your vault is unlocked. ✓</p>
      ) : (
        <p className="error-text">Unable to unlock vault. Please try again.</p>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-upload">
          <h3>Upload File</h3>
          <FileUpload privateKey={privateKey} />
        </div>

        <div className="dashboard-files">
          <h3>Your Files</h3>
          <ul>
            {files.map((f) => (
              <li key={f.id} className="file-row">
                {f.original_name}
                <button
                  className="download-btn"
                  onClick={() =>
                    downloadAndDecryptFile(f.id, f.original_name)
                  }
                >
                  Download + Decrypt
                </button>
              </li>
            ))}
          </ul>

          <h3>Shared With Me</h3>
          <table className="shared-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Owner</th>
                <th>Shared On</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {sharedFiles.map((sf) => (
                <tr key={sf.id}>
                  <td>{sf.file_name}</td>
                  <td>{sf.owner}</td>
                  <td>{new Date(sf.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => downloadAndDecryptSharedFile(sf)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
