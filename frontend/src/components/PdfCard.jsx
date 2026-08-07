import React from "react";
import { Link } from "react-router-dom";

const statusStyles = {
  ready: "text-signal border-signal/40",
  processing: "text-marker border-marker/40",
  failed: "text-red-400 border-red-400/40",
};

export default function PdfCard({ pdf, onDelete }) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:border-signal/50 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-snug line-clamp-2">{pdf.title}</h3>
        <span
          className={`text-[10px] font-mono uppercase border rounded px-1.5 py-0.5 shrink-0 ${
            statusStyles[pdf.status] || statusStyles.processing
          }`}
        >
          {pdf.status}
        </span>
      </div>

      <div className="text-xs text-vellum/50 font-mono flex gap-3">
        {pdf.numPages ? <span>{pdf.numPages}p</span> : null}
        {pdf.numChunks ? <span>{pdf.numChunks} chunks</span> : null}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Link
          to={`/chat/${pdf._id}`}
          className="btn-primary !py-1.5 text-sm flex-1 text-center"
          aria-disabled={pdf.status !== "ready"}
        >
          {pdf.status === "ready" ? "Chat" : "Processing…"}
        </Link>
        <button
          onClick={() => onDelete(pdf._id)}
          className="btn-ghost !py-1.5 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete PDF"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
