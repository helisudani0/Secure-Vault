import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ShareModal from "../components/ShareModal";
import "./FileDetail.css";

export default function FileDetail() {
  const { id } = useParams();
  
  // Load files from local storage
  const files = JSON.parse(localStorage.getItem("sv_files") || "[]");
  const file = files.find((f) => f.id === id);

  const [open, setOpen] = useState(false);

  if (!file) {
    return <div className="glass-card">File not found.</div>;
  }

  return (
    <div className="glass-card">
      <h2 className="file-title">{file.name}</h2>

      <div className="file-meta">
        Uploaded: {new Date(file.createdAt).toLocaleString()}
      </div>

      <div className="file-actions">
        <button className="btn-share" onClick={() => setOpen(true)}>
          Share
        </button>
      </div>

      {open && <ShareModal file={file} onClose={() => setOpen(false)} />}
    </div>
  );
}
