// frontend/src/pages/CourtStaff.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DM = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

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

    // Handle both "court_staff" and old "Court Staff" format
    const isCourtStaff =
      parsed.role === "court_staff" || parsed.role === "Court Staff";

    if (!isCourtStaff) {
      if (parsed.role === "citizen") navigate("/citizen");
      else if (parsed.role === "lawyer") navigate("/lawyer");
      else navigate("/");
      return;
    }

    setUser(parsed);

    fetch("http://localhost:8000/api/admin/lawyers-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(console.error);
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
      background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)",
      color: "white",
      ...DM,
    }}>

      {/* Header */}
      <div style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>⚖️</span>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>LegalMind</span>
          <span style={{
            backgroundColor: "rgba(255,100,100,0.12)",
            border: "1px solid rgba(255,100,100,0.4)",
            color: "#FF8A8A",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "600",
          }}>
            Legal Coordinator
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "rgba(239,68,68,.1)",
              border: "1px solid rgba(239,68,68,.3)",
              color: "#ef4444",
              padding: "7px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
            }}>
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 32px" }}>

        {/* Page Title */}
        <div style={{ marginBottom: "36px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)", marginBottom: "8px" }}>
            LEGAL COORDINATOR
          </p>
          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "6px" }}>
            Platform Dashboard 🏛️
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            Manage lawyers, legal requests, and platform operations
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}>
            {[
              { label: "Total Lawyers",    value: stats.total,          color: BLUEB     },
              { label: "Pro Bono Lawyers", value: stats.proBono,        color: "#90FF90" },
              { label: "Districts",        value: stats.districts,      color: "#FFD166" },
              { label: "Specializations",  value: stats.specializations, color: "#FF8A8A" },
            ].map((stat) => (
              <div key={stat.label} style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "20px 24px",
                borderTop: `3px solid ${stat.color}`,
              }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>
                  {stat.value ?? "—"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "6px" }}>
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
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "#fff" }}>
            ⚡ Quick Actions
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "⚖️ Pending Lawyers",   path: "/admin-panel",          color: BLUE                     },
              { label: "📥 Import Lawyers",     path: "/admin/import-lawyers", color: "#7c3aed"                },
              { label: "📊 Platform Analytics", path: "/admin-panel",          color: "#0891b2"                },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  padding: "11px 20px",
                  backgroundColor: `${action.color}18`,
                  border: `1px solid ${action.color}40`,
                  borderRadius: "10px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all .2s ease",
                }}>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Lawyer Management */}
          <div style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "20px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>
              ⚖️ Lawyer Management
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Review pending lawyer applications",   action: () => navigate("/admin-panel")          },
                { label: "Import lawyers from CSV",              action: () => navigate("/admin/import-lawyers") },
                { label: "View lawyer directory statistics",     action: () => navigate("/admin-panel")          },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={item.action}
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all .2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(30,95,255,.08)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.25)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.02)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                  }}>
                  → {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Platform Info */}
          <div style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "20px",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>
              ℹ️ Platform Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Role",     value: "Legal Coordinator"       },
                { label: "Name",     value: user.name                 },
                { label: "Email",    value: user.email                },
                { label: "District", value: user.district || "—"      },
                { label: "Court",    value: user.courtName || "All Courts" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}