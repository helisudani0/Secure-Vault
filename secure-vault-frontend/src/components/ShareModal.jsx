import React, { useState } from "react";
import {
  importPublicKeyFromBase64,
  decryptPrivateKeyFromStorage,
  wrapKeyWithPublicKey,
} from "../utils/crypto";

import "./ShareModal.css";

export default function ShareModal({ file, onClose }) {
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("");

  async function handleShare(e) {
    e.preventDefault();
    setStatus("Processing...");

    try {
      // recipient public key lookup
      const registry = JSON.parse(localStorage.getItem("sv_public_keys") || "{}");
      const pubBase64 = registry[target];

      if (!pubBase64) {
        setStatus("Recipient not found in public key registry.");
        return;
      }

      const recipientPublicKey = await importPublicKeyFromBase64(pubBase64);

      // owner's decrypted RSA private key
      const privateKey = await decryptPrivateKeyFromStorage();
      if (!privateKey) {
        setStatus("Your private key could not be decrypted.");
        return;
      }

      // AES key for the file
      if (!file.rawKey) {
        setStatus("File missing rawKey. (Unwrap original AES key in prod.)");
        return;
      }

      const rawKeyBuffer = base64ToArrayBuffer(file.rawKey);

      const aesKey = await crypto.subtle.importKey(
        "raw",
        rawKeyBuffer,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      // wrap AES key using receiver's RSA key
      const wrapped = await wrapKeyWithPublicKey(aesKey, recipientPublicKey);

      // store wrapped key
      const files = JSON.parse(localStorage.getItem("sv_files") || "[]");
      const idx = files.findIndex((f) => f.id === file.id);

      if (idx === -1) {
        setStatus("File not found in storage.");
        return;
      }

      files[idx].wrappedKeys = files[idx].wrappedKeys || {};
      files[idx].wrappedKeys[target] = arrayBufferToBase64(wrapped);

      localStorage.setItem("sv_files", JSON.stringify(files));

      setStatus("Shared successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Sharing failed: " + err.message);
    }
  }

  return (
    <div className="share-modal-container">
      <div className="modal-backdrop" onClick={onClose}></div>

      <div className="share-modal">
        <h3 className="modal-title">Share file: {file.name}</h3>

        <form onSubmit={handleShare} className="share-form">
          <input
            placeholder="Recipient username"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="share-input"
          />

          <div className="share-actions">
            <button type="button" onClick={onClose} className="btn-close">
              Close
            </button>

            <button className="btn-share">Share</button>
          </div>
        </form>

        {status && <div className="share-status">{status}</div>}
      </div>
    </div>
  );
}

// utils
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
