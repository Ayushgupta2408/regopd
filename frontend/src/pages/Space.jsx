import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import ChatWindow from "../components/ChatWindow.jsx";
import ModelSelector from "../components/ModelSelector.jsx";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function Space() {
  const { code } = useParams();
  const [space, setSpace] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [presence, setPresence] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    (async () => {
      await api.post(`/spaces/${code}/join`);
      const [detailRes, modelsRes] = await Promise.all([
        api.get(`/spaces/${code}`),
        api.get(`/chat/models`),
      ]);
      setSpace(detailRes.data.space);
      setPdf(detailRes.data.pdf);
      setMessages(detailRes.data.messages);
      setModels(modelsRes.data.models);
      setModel(modelsRes.data.models[0]?.id || "");
    })();
  }, [code]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.emit("join_space", code);

    socket.on("new_messages", ({ userMessage, assistantMessage }) => {
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    });

    socket.on("presence_update", ({ type, user }) => {
      setPresence((prev) => [...prev.slice(-4), `${user.name} ${type}`]);
    });

    return () => {
      socket.emit("leave_space", code);
      socket.disconnect();
    };
  }, [code]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!input.trim() || pending || !pdf) return;

    const question = input.trim();
    setInput("");
    setPending(true);

    try {
      // The server broadcasts the resulting messages to everyone in the space
      // room (including this socket) via "new_messages", so we don't append
      // locally here — that would double them up for the asker.
      await api.post(`/chat/${pdf._id}/ask`, { question, model, spaceCode: code });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to get an answer");
    } finally {
      setPending(false);
    }
  };

  if (!pdf) return <div className="p-10 text-vellum/50 font-mono text-sm">loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="py-4 border-b border-ink-700 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link to="/" className="eyebrow hover:text-signal">← Library</Link>
          <h1 className="font-display text-xl truncate">{pdf.title}</h1>
          <p className="text-[10px] font-mono text-marker">Space · {code}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector models={models} value={model} onChange={setModel} />
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="btn-ghost !py-1.5 text-xs"
          >
            Copy invite link
          </button>
        </div>
      </div>

      {presence.length > 0 && (
        <div className="text-[10px] font-mono text-vellum/40 py-1">{presence.join(" · ")}</div>
      )}

      <ChatWindow messages={messages} pending={pending} />

      <form onSubmit={handleAsk} className="py-4 border-t border-ink-700 flex gap-2">
        <input
          className="input-field"
          placeholder="Ask something — everyone in this space will see it…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={pending}>
          Ask
        </button>
      </form>
    </div>
  );
}
