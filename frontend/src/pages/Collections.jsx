import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    const res = await api.get("/collections");
    setCollections(res.data.collections);
  };

  useEffect(() => {
    fetchCollections().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post("/collections", { name: name.trim() });
      setName("");
      await fetchCollections();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this collection? PDFs inside stay in your library.")) return;
    await api.delete(`/collections/${id}`);
    setCollections((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="eyebrow mb-1">Playlists of PDFs</p>
      <h1 className="font-display text-3xl mb-8">Collections</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          className="input-field"
          placeholder="New collection name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={creating} className="btn-primary shrink-0">
          {creating ? "Creating…" : "Create"}
        </button>
      </form>

      {loading ? (
        <p className="text-vellum/50 font-mono text-sm">loading…</p>
      ) : collections.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-vellum/50">No collections yet. Group related PDFs together.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((c) => (
            <div key={c._id} className="card p-5 flex items-center justify-between">
              <div>
                <Link to={`/collections/${c._id}`} className="font-display text-lg hover:text-signal">
                  {c.name}
                </Link>
                <p className="text-xs text-vellum/40 font-mono">{c.pdfCount} PDF{c.pdfCount !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => handleDelete(c._id)} className="btn-ghost !py-1 !px-2 text-xs">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
