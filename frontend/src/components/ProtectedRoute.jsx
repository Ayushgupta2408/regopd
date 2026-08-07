import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-vellum/50 font-mono text-sm">
        loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
