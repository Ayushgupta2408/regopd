import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import PdfCard from "../components/PdfCard.jsx";

export default function CollectionDetail() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchDetail = async () => {
    const res = await api.get(`/collections/${id}`);
    setCollection(res.data.collection);
    setPdfs(res.data.pdfs);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("collectionId", id);

    try {
      await api.post("/pdfs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchDetail();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (pdfId) => {
    if (!confirm("Delete this PDF and its indexed data?")) return;
    await api.delete(`/pdfs/${pdfId}`);
    setPdfs((prev) => prev.filter((p) => p._id !== pdfId));
  };

  if (!collection) return <div className="p-10 text-vellum/50 font-mono text-sm">loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/collections" className="eyebrow hover:text-signal">← Collections</Link>

      <div className="flex items-center justify-between mt-1 mb-8">
        <h1 className="font-display text-3xl">{collection.name}</h1>
        <label className="btn-primary cursor-pointer">
          {uploading ? "Uploading…" : "+ Add PDF"}
          <input type="file" accept="application/pdf" hidden onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {pdfs.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-vellum/50">No PDFs in this collection yet.</p>
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
