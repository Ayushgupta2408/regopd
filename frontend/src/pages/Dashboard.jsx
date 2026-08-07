import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import PdfCard from "../components/PdfCard.jsx";

export default function Dashboard() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchPdfs = useCallback(async () => {
    const res = await api.get("/pdfs");
    setPdfs(res.data.pdfs);
  }, []);

  useEffect(() => {
    fetchPdfs().finally(() => setLoading(false));
  }, [fetchPdfs]);

  // Poll for status updates while any PDF is still processing
  useEffect(() => {
    const hasProcessing = pdfs.some((p) => p.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(fetchPdfs, 4000);
    return () => clearInterval(interval);
  }, [pdfs, fetchPdfs]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      await api.post("/pdfs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchPdfs();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this PDF and its indexed data?")) return;
    await api.delete(`/pdfs/${id}`);
    setPdfs((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="eyebrow mb-1">Your library</p>
          <h1 className="font-display text-3xl">Documents</h1>
        </div>

        <label className="btn-primary cursor-pointer">
          {uploading ? "Uploading…" : "+ Upload PDF"}
          <input type="file" accept="application/pdf" hidden onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-vellum/50 font-mono text-sm">loading…</p>
      ) : pdfs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="eyebrow mb-2">Empty shelf</p>
          <p className="text-vellum/50">Upload your first PDF to start chatting with it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs.map((pdf) => (
            <PdfCard key={pdf._id} pdf={pdf} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
