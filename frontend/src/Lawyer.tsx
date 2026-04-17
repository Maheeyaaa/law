// frontend/src/pages/Lawyer.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Lawyer() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!stored || !token) {
      navigate("/");
      return;
    }

    const parsed = JSON.parse(stored);

    // If not a lawyer, redirect to correct dashboard
    if (parsed.role !== "lawyer") {
      if (parsed.role === "citizen") navigate("/citizen");
      else if (parsed.role === "court_staff") navigate("/court-staff");
      return;
    }

    setUser(parsed);

    // Fetch lawyer dashboard data
    fetch("http://localhost:8000/api/lawyer/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setDashboard(data));
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
            backgroundColor: "rgba(255,190,50,0.15)",
            border: "1px solid rgba(255,190,50,0.4)",
            color: "#FFD166",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
          }}>Lawyer</span>
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

      {/* Dashboard Content */}
      <div style={{ padding: "40px 32px" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
          Welcome, {user.name} 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "40px" }}>
          {user.specialization} • {user.district}
        </p>

        {/* Stats Grid */}
        {dashboard && (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "40px",
            }}>
              {[
                { label: "Pending Requests", value: dashboard.stats.pendingRequests, color: "#FFD166" },
                { label: "Total Cases", value: dashboard.stats.totalCases, color: "#90D5FF" },
                { label: "Active Cases", value: dashboard.stats.activeCases, color: "#90FF90" },
                { label: "Resolved Cases", value: dashboard.stats.resolvedCases, color: "#FF8A8A" },
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

            {/* Assigned Cases */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}>
              <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>
                📁 Assigned Cases
              </h2>
              {dashboard.assignedCases.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)" }}>No cases assigned yet.</p>
              ) : (
                dashboard.assignedCases.map((c: any) => (
                  <div key={c._id} style={{
                    padding: "16px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: "600" }}>{c.title}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "4px" }}>
                        {c.caseType} • {c.district} • Client: {c.citizen?.name}
                      </div>
                    </div>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      backgroundColor: c.status === "Active"
                        ? "rgba(100,255,100,0.1)"
                        : "rgba(255,255,255,0.05)",
                      color: c.status === "Active" ? "#90FF90" : "rgba(255,255,255,0.5)",
                      border: `1px solid ${c.status === "Active" ? "rgba(100,255,100,0.3)" : "rgba(255,255,255,0.1)"}`,
                    }}>
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Recent Requests */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "24px",
            }}>
              <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>
                📨 Recent Requests
              </h2>
              {dashboard.recentRequests.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)" }}>No requests yet.</p>
              ) : (
                dashboard.recentRequests.map((r: any) => (
                  <div key={r._id} style={{
                    padding: "16px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}>
                    <div style={{ fontWeight: "600" }}>{r.citizen?.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "4px" }}>
                      {r.message}
                    </div>
                    <span style={{
                      marginTop: "8px",
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      backgroundColor: "rgba(255,190,50,0.1)",
                      color: "#FFD166",
                      border: "1px solid rgba(255,190,50,0.3)",
                    }}>
                      {r.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}