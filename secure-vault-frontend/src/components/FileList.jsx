import React, { useEffect, useState } from "react";
import {
  getMyFiles,
  downloadFile,
  deleteFile,
  shareFileFetch,
} from "../../api/files";
import "./FileList.css";
import { decryptPrivateKeyWithPassword, unwrapAESKey } from "../../utils/crypto";

function FileList() {
  const [files, setFiles] = useState([]);
  const [shareFile, setShareFile] = useState(null);
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    try {
      const data = await getMyFiles();
      setFiles(data);
    } catch {
      alert("Could not load your files");
    }
  }

  async function handleDownload(id, name) {
    try {
      const blob = await downloadFile(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this file?")) return;
    await deleteFile(id);
    loadFiles();
  }

  async function shareNow(fileId) {
    try {
      const token = localStorage.getItem("access");
      if (!token) return alert("Not logged in");

      const encryptedPrivateKey = localStorage.getItem("encrypted_private_key");
      const pass = prompt("Enter your password:");
      const privateKey = await decryptPrivateKeyWithPassword(
        pass,
        Uint8Array.from(atob(encryptedPrivateKey), c => c.charCodeAt(0))
      );

      const metaRes = await fetch(
        `http://127.0.0.1:8000/api/files/${fileId}/wrapped-key/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { wrapped_key: ownerWrappedKey } = await metaRes.json();

      const aesKey = await unwrapAESKey(privateKey, ownerWrappedKey);

      const userRes = await fetch(
        `http://127.0.0.1:8000/api/auth/public-key/${recipient}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { public_key } = await userRes.json();
      if (!public_key) return alert("Recipient has no public key");

      const recipientKey = await crypto.subtle.importKey(
        "spki",
        Uint8Array.from(atob(public_key), c => c.charCodeAt(0)),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );

      const exportedAES = await crypto.subtle.exportKey("raw", aesKey);
      const wrapped = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: "RSA-OAEP" },
          recipientKey,
          exportedAES
        )
      );

      const wrappedKey = btoa(String.fromCharCode(...wrapped));
      await shareFileFetch(token, fileId, recipient, wrappedKey);

      alert("File shared!");
      setShareFile(null);
    } catch (e) {
      console.error(e);
      alert("Sharing failed");
    }
  }

  return (
    <div className="file-list-container">
      {shareFile && (
        <div className="share-modal">
          <h3>Share: {shareFile.original_name}</h3>
          <input
            type="text"
            placeholder="Recipient username"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <button onClick={() => shareNow(shareFile.id)}>Share</button>
          <button onClick={() => setShareFile(null)}>Cancel</button>
        </div>
      )}

      {files.length === 0 && (
        <p className="file-list-empty">No files uploaded yet.</p>
      )}

      {files.map((file) => (
        <div key={file.id} className="file-item">
          <div>
            <p className="file-name">{file.original_name}</p>
            <p className="file-meta">{(file.size / 1024).toFixed(2)} KB</p>
          </div>

          <div className="file-actions">
            <button onClick={() => handleDownload(file.id, file.original_name)}>
              ⬇️ Download
            </button>

            <button onClick={() => setShareFile(file)}>🔗 Share</button>

            <button onClick={() => handleDelete(file.id)}>🗑 Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FileList;
