import React from "react";
import {
  generateFileKeyRaw,
  importPublicKeyFromBase64,
  encryptFileWithAesKey,
  arrayBufferToBase64,
} from "../utils/crypto";

import API from "../api/api";
import { getCurrentUser } from "../api/auth";
import "./FileUpload.css";

export default function FileUpload({ onDone }) {
  
  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 1. Create AES key for this file
      const { key: aesKey, rawB64: aesRawB64 } = await generateFileKeyRaw();

      // 2. Convert file → ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // 3. AES encrypt file
     const { encrypted, ivB64 } = await encryptFileWithAesKey(aesKey, fileBuffer);

      // 4. Load logged-in user
      const user = getCurrentUser();
      if (!user) return alert("Not logged in.");

      const publicKeyB64 = localStorage.getItem(`sv_pubkey_${user.username}`);
      if (!publicKeyB64) return alert("Missing public RSA key.");

      // 5. Import RSA public key
      const publicKey = await importPublicKeyFromBase64(publicKeyB64);

      // 6. Wrap AES key using RSA-OAEP (correct way)
      const wrappedKey = await crypto.subtle.wrapKey(
        "raw",
        aesKey,
        publicKey,
        { name: "RSA-OAEP" }
      );

      const wrappedKeyB64 = arrayBufferToBase64(wrappedKey);

      // 7. Upload encrypted file to backend
      const formData = new FormData();
      formData.append("file", new Blob([encrypted]), file.name);
      formData.append("iv", ivB64); // IMPORTANT: use ivB64, not iv!
      formData.append("aes_key_owner_wrapped", wrappedKeyB64);
      formData.append("original_name", file.name);

      await API.post("files/upload/", formData);

      alert("Encrypted file uploaded successfully!");
      if (onDone) onDone();

    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <form className="file-upload-form">
      <label className="file-upload-label">Upload encrypted file</label>

      <input
        type="file"
        className="file-upload-input"
        onChange={handleUpload}
      />

      <div className="file-upload-actions">
        <button type="button" className="btn-upload">
          Select File
        </button>
      </div>
    </form>
  );
}
