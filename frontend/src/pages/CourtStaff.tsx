// frontend/src/pages/CourtStaff.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CourtStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!stored || !token) {
      navigate("/");
      return;
    }

    const parsed = JSON.parse(stored);

    // If not court staff, redirect
    if (parsed.role !== "court_staff") {
      if (parsed.role === "citizen") navigate("/citizen");
      else if (parsed.role === "lawyer") navigate("/lawyer");
      return;
    }

    setUser(parsed);

    // Fetch global stats
    fetch("http://localhost:8000/api/admin/lawyers-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStats(data.stats));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0d1117",
      color: "white",
      fontFamily: "sans-serif",
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚖️</span>
          <span style={{ fontSize: "20px", fontWeight: "bold" }}>LegalMind</span>
          <span style={{
            backgroundColor: "rgba(255,100,100,0.12)",
            border: "1px solid rgba(255,100,100,0.4)",
            color: "#FF8A8A",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
          }}>Court Staff</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 32px" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
          Court Staff Dashboard 🏛️
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "40px" }}>
          Manage lawyers, cases, and platform operations
        </p>

        {/* Stats */}
        {stats && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "40px",
          }}>
            {[
              { label: "Total Lawyers", value: stats.total, color: "#90D5FF" },
              { label: "Pro Bono Lawyers", value: stats.proBono, color: "#90FF90" },
              { label: "Districts Covered", value: stats.districts, color: "#FFD166" },
              { label: "Specializations", value: stats.specializations, color: "#FF8A8A" },
            ].map((stat) => (
              <div key={stat.label} style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "24px",
              }}>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "8px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>⚡ Quick Actions</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "📋 Pending Lawyers", path: "/admin-panel" },
              { label: "📥 Import Lawyers", path: "/admin/import-lawyers" },
              { label: "📊 Analytics", path: "/admin-panel" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}