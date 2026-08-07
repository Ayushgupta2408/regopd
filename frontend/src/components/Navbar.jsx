import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-ink-700 bg-ink-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl text-vellum">Marginal</span>
          <span className="eyebrow hidden sm:inline">PDF · RAG · Chat</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-signal transition-colors">Library</Link>
            <Link to="/collections" className="hover:text-signal transition-colors">Collections</Link>
            <div className="flex items-center gap-3 pl-4 border-l border-ink-700">
              <span className="text-vellum/60 font-mono text-xs">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="btn-ghost !px-3 !py-1.5 text-xs"
              >
                Sign out
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
