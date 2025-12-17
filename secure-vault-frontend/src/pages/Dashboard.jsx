import React, { useEffect, useState } from "react";
import {
  importPrivateKeyFromBase64,
  decryptPrivateKeyWithPassword,
  unwrapAESKey,
  decryptFile
} from "../utils/crypto";
import FileUpload from "../components/FileUpload";
import { downloadEncryptedFile } from "../api/api";
import { getUserFiles, getSharedFiles } from "../api/files";
import "./Dashboard.css";

export default function Dashboard() {
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);

  // -----------------------------------------------------
  // 1) Load user's decrypted private key
  // -----------------------------------------------------
  useEffect(() => {
    async function loadPrivateKey() {
      try {
        const encryptedStr = localStorage.getItem("encrypted_private_key");
        const password = localStorage.getItem("login_password");

        if (!encryptedStr || !password) {
          console.warn("Missing encrypted key or password");
          setLoading(false);
          return;
        }

        // Stored as JSON blob
        const blob = JSON.parse(encryptedStr);

        const base64Key = await decryptPrivateKeyWithPassword(
          blob.ciphertext,
          password,
          blob.salt,
          blob.iv,
    
        );

        const key = await importPrivateKeyFromBase64(base64Key);
        setPrivateKey(key);

      } catch (err) {
        console.error("Failed to load private key:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPrivateKey();
  }, []);

  // -----------------------------------------------------
  // 2) Load user's own files
  // -----------------------------------------------------
  useEffect(() => {
    async function loadFiles() {
      const token = localStorage.getItem("access");
      if (!token) return;

      const data = await getUserFiles(token);
      setFiles(data);
    }

    loadFiles();
  }, []);

  // -----------------------------------------------------
  // 3) Load files shared with the user
  // -----------------------------------------------------
  useEffect(() => {
    async function loadSharedFiles() {
      const token = localStorage.getItem("access");
      if (!token) return;

      const data = await getSharedFiles(token);
      setSharedFiles(data);
    }

    loadSharedFiles();
  }, []);

  // -----------------------------------------------------
  // 4) Download + decrypt user's own file
  // -----------------------------------------------------
  async function downloadAndDecryptFile(fileId, filename) {
    if (!privateKey) return alert("Private key not loaded.");

    try {
      const token = localStorage.getItem("access");

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

  // -----------------------------------------------------
  // 5) Download + decrypt a shared file
  // -----------------------------------------------------
  async function downloadAndDecryptSharedFile(sharedObj) {
    if (!privateKey) return alert("Private key not loaded.");

    try {
      const token = localStorage.getItem("access");

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

  // -----------------------------------------------------
  // Render UI
  // -----------------------------------------------------
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🔐 Secure Vault</h1>

      {loading ? (
        <p className="loading-text">Decrypting your private key...</p>
      ) : privateKey ? (
        <p className="success-text">Your vault is unlocked.</p>
      ) : (
        <p className="error-text">Unable to unlock vault. Please log in again.</p>
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
