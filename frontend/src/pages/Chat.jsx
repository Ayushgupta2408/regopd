import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import ChatWindow from "../components/ChatWindow.jsx";
import ModelSelector from "../components/ModelSelector.jsx";

export default function Chat() {
  const { pdfId } = useParams();
  const [pdf, setPdf] = useState(null);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [spaceCode, setSpaceCode] = useState(null);
  const [creatingSpace, setCreatingSpace] = useState(false);

  useEffect(() => {
    (async () => {
      const [pdfRes, historyRes, modelsRes] = await Promise.all([
        api.get(`/pdfs/${pdfId}`),
        api.get(`/chat/${pdfId}/history`),
        api.get(`/chat/models`),
      ]);
      setPdf(pdfRes.data.pdf);
      setMessages(historyRes.data.messages);
      setModels(modelsRes.data.models);
      setModel(modelsRes.data.models[0]?.id || "");
      setSpaceCode(pdfRes.data.pdf.spaceId || null);
    })();
  }, [pdfId]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!input.trim() || pending) return;

    const question = input.trim();
    setInput("");
    setPending(true);

    try {
      const res = await api.post(`/chat/${pdfId}/ask`, { question, model, spaceCode });
      setMessages((prev) => [...prev, res.data.userMessage, res.data.assistantMessage]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to get an answer");
    } finally {
      setPending(false);
    }
  };

  const handleCreateSpace = async () => {
    setCreatingSpace(true);
    try {
      const res = await api.post("/spaces", { pdfId });
      setSpaceCode(res.data.space.code);
    } finally {
      setCreatingSpace(false);
    }
  };

  if (!pdf) return <div className="p-10 text-vellum/50 font-mono text-sm">loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="py-4 border-b border-ink-700 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link to="/" className="eyebrow hover:text-signal">← Library</Link>
          <h1 className="font-display text-xl truncate">{pdf.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector models={models} value={model} onChange={setModel} />
          {spaceCode ? (
            <Link to={`/space/${spaceCode}`} className="btn-ghost !py-1.5 text-xs">
              Open Space →
            </Link>
          ) : (
            <button onClick={handleCreateSpace} disabled={creatingSpace} className="btn-ghost !py-1.5 text-xs">
              {creatingSpace ? "Creating…" : "Share as Space"}
            </button>
          )}
        </div>
      </div>

      <ChatWindow messages={messages} pending={pending} />

      <form onSubmit={handleAsk} className="py-4 border-t border-ink-700 flex gap-2">
        <input
          className="input-field"
          placeholder="Ask something about this document…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pdf.status !== "ready"}
        />
        <button type="submit" className="btn-primary" disabled={pending || pdf.status !== "ready"}>
          Ask
        </button>
      </form>
    </div>
  );
}
