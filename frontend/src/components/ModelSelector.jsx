import React from "react";

export default function ModelSelector({ models, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-ink-900 border border-ink-700 rounded-md px-2 py-1.5 text-xs font-mono text-vellum/80 focus:border-signal outline-none"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
