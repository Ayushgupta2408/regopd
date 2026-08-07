import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function ChatWindow({ messages, pending }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  if (messages.length === 0 && !pending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <p className="eyebrow mb-2">Empty margin</p>
        <p className="text-vellum/50 max-w-sm">
          Ask a question about this document. Answers are grounded in its actual content, with sources cited.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
      {messages.map((m) => (
        <div key={m._id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-signal text-ink-950"
                : "bg-ink-900 border border-ink-700 text-vellum"
            }`}
          >
            {m.user?.name && m.role === "user" && (
              <div className="text-[10px] font-mono uppercase opacity-60 mb-1">{m.user.name}</div>
            )}
            <ReactMarkdown>{m.content}</ReactMarkdown>

            {m.sources?.length > 0 && (
              <details className="mt-2 text-xs opacity-70">
                <summary className="cursor-pointer font-mono uppercase tracking-wide">
                  {m.sources.length} source{m.sources.length > 1 ? "s" : ""}
                </summary>
                <ul className="mt-1 space-y-1">
                  {m.sources.map((s, i) => (
                    <li key={i} className="border-l-2 border-signal/40 pl-2">
                      {s.text}…
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      ))}

      {pending && (
        <div className="flex justify-start">
          <div className="bg-ink-900 border border-ink-700 rounded-lg px-4 py-3 text-sm text-vellum/50 font-mono">
            thinking…
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
