// frontend/src/pages/AdminPanel.tsx

import { useState, useEffect, type CSSProperties } from "react";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const API = "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [scamPatterns, setScamPatterns] = useState<any[]>([]);
  const [showAddPattern, setShowAddPattern] = useState(false);

  const [newPattern, setNewPattern] = useState({
    type: "keyword",
    pattern: "",
    description: "",
    severity: "medium",
    isRegex: false,
  });

  useEffect(() => {
    // Role check
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (
      user.role !== "court_staff" &&
      user.role !== "Court Staff" &&
      user.role !== "admin"
    ) {
      window.location.href = "/";
      return;
    }
    loadStats();
    loadScamPatterns();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics/global-stats`, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadScamPatterns = async () => {
    try {
      const res = await fetch(`${API}/scam/patterns`, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      const data = await res.json();
      setScamPatterns(data.patterns || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addPattern = async () => {
    if (!newPattern.pattern || !newPattern.description) {
      alert("Pattern and description are required");
      return;
    }
    try {
      await fetch(`${API}/scam/patterns`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPattern),
      });
      setNewPattern({ type: "keyword", pattern: "", description: "", severity: "medium", isRegex: false });
      setShowAddPattern(false);
      loadScamPatterns();
      alert("Pattern added successfully!");
    } catch (err) {
      alert("Error adding pattern");
    }
  };

  const deletePattern = async (id: string) => {
    if (!confirm("Delete this scam pattern?")) return;
    try {
      await fetch(`${API}/scam/patterns/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      loadScamPatterns();
    } catch (err) {
      alert("Error deleting pattern");
    }
  };

  const togglePatternStatus = async (pattern: any) => {
    try {
      await fetch(`${API}/scam/patterns/${pattern._id}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !pattern.isActive }),
      });
      loadScamPatterns();
    } catch (err) {
      alert("Error updating pattern");
    }
  };

  const cardStyle: CSSProperties = {
    background: "rgba(10,20,60,0.5)",
    backdropFilter: "blur(16px)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(30,95,255,.15)",
    boxShadow: "0 8px 32px rgba(0,0,0,.7)",
  };

  const statBoxStyle: CSSProperties = {
    background: "rgba(30,95,255,.08)",
    border: "1px solid rgba(30,95,255,.2)",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(30,95,255,.25)",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    ...DM,
    fontSize: 10,
    color: "rgba(255,255,255,.4)",
    display: "block",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  return (
    <div style={{ ...DM, minHeight: "100vh", background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)", marginBottom: 6 }}>
              LEGAL COORDINATOR
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>🛠️ Platform Admin</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
              Manage scam detection patterns and view platform analytics
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => window.location.href = "/admin/import-lawyers"}
              style={{ ...DM, background: "rgba(30,95,255,.2)", color: BLUEB, fontSize: 12, fontWeight: 600, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(30,95,255,.3)", cursor: "pointer" }}>
              📥 Import Lawyers
            </button>
            <button
              onClick={() => window.location.href = "/court-staff"}
              style={{ ...DM, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.4)", fontSize: 12, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer" }}>
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && !stats && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,.2)", borderTop: "4px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: 16, color: "rgba(255,255,255,.4)", ...DM }}>Loading...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {stats && (
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
              {[
                { label: "Total Users",    value: stats.users?.total || 0,                       color: BLUEB      },
                { label: "AI Messages",    value: stats.usage?.totalMessages || 0,               color: "#a78bfa"  },
                { label: "Scams Detected", value: stats.scamDetection?.scamsDetected || 0,       color: "#ef4444"  },
                { label: "Total Scans",    value: stats.scamDetection?.totalScansPerformed || 0, color: "#fbbf24"  },
              ].map((stat, i) => (
                <div key={i} style={{ ...statBoxStyle, borderTop: `3px solid ${stat.color}` }}>
                  <p style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Feature Usage */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>📊 AI Feature Usage</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {Object.entries(stats.usage?.featureUsage || {}).map(([feature, count]: [string, any]) => (
                  <div key={feature} style={{ background: "rgba(255,255,255,.03)", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(30,95,255,.1)" }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: BLUEB }}>{count}</p>
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 4, textTransform: "capitalize" }}>
                      {feature.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Users by Role */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>👥 Users by Role</h2>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {(stats.users?.byRole || []).map((role: any) => (
                  <div key={role._id} style={{ background: "rgba(30,95,255,.08)", padding: "16px 24px", borderRadius: 10, border: "1px solid rgba(30,95,255,.2)", textAlign: "center" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{role.count}</p>
                    <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "capitalize", marginTop: 4 }}>
                      {role._id === "court_staff" ? "Legal Coordinator" : role._id}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Scam Pattern Management */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>🚨 Scam Pattern Database</h2>
              <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                {scamPatterns.length} patterns active
              </p>
            </div>
            <button
              onClick={() => setShowAddPattern(!showAddPattern)}
              style={{ ...DM, background: showAddPattern ? "rgba(239,68,68,.15)" : BLUE, color: showAddPattern ? "#ef4444" : "#fff", padding: "9px 18px", borderRadius: 9, border: showAddPattern ? "1px solid rgba(239,68,68,.3)" : "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              {showAddPattern ? "✕ Cancel" : "+ Add Pattern"}
            </button>
          </div>

          {/* Add Pattern Form */}
          {showAddPattern && (
            <div style={{ background: "rgba(30,95,255,.05)", padding: 20, borderRadius: 12, marginBottom: 20, border: "1px solid rgba(30,95,255,.2)" }}>
              <h3 style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>New Scam Pattern</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={newPattern.type} onChange={e => setNewPattern({ ...newPattern, type: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="keyword">Keyword</option>
                    <option value="phone_number">Phone Number</option>
                    <option value="bank_account">Bank Account</option>
                    <option value="url">URL</option>
                    <option value="email">Email</option>
                    <option value="threat_pattern">Threat Pattern</option>
                    <option value="payment_pattern">Payment Pattern</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Severity</label>
                  <select value={newPattern.severity} onChange={e => setNewPattern({ ...newPattern, severity: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Pattern *</label>
                <input
                  value={newPattern.pattern}
                  onChange={e => setNewPattern({ ...newPattern, pattern: e.target.value })}
                  placeholder="e.g. 'your account will be suspended'"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Description *</label>
                <input
                  value={newPattern.description}
                  onChange={e => setNewPattern({ ...newPattern, description: e.target.value })}
                  placeholder="e.g. Common phishing threat about account suspension"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newPattern.isRegex}
                    onChange={e => setNewPattern({ ...newPattern, isRegex: e.target.checked })}
                  />
                  Is Regular Expression (RegEx)
                </label>
              </div>

              <button
                onClick={addPattern}
                style={{ ...DM, background: "#34d399", color: "#000", padding: "10px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>
                ✓ Add Pattern
              </button>
            </div>
          )}

          {/* Patterns List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scamPatterns.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.3)" }}>No scam patterns yet</p>
                <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 8 }}>Add patterns to improve scam detection</p>
              </div>
            ) : scamPatterns.map((pattern) => {
              const severityColor =
                pattern.severity === "critical" ? "#ef4444" :
                pattern.severity === "high"     ? "#f59e0b" :
                pattern.severity === "medium"   ? "#3b82f6" : "#6b7280";

              return (
                <div key={pattern._id} style={{ background: pattern.isActive ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.2)", padding: "14px 18px", borderRadius: 10, border: `1px solid ${severityColor}30`, opacity: pattern.isActive ? 1 : 0.5, transition: "all .2s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ background: severityColor, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {pattern.severity}
                        </span>
                        <span style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px" }}>
                          {pattern.type.replace(/_/g, " ")}
                        </span>
                        {pattern.isRegex && (
                          <span style={{ ...DM, fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,.1)", padding: "2px 6px", borderRadius: 4 }}>REGEX</span>
                        )}
                        {!pattern.isActive && (
                          <span style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", background: "rgba(255,255,255,.05)", padding: "2px 6px", borderRadius: 4 }}>DISABLED</span>
                        )}
                      </div>
                      <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                        "{pattern.pattern}"
                      </p>
                      <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                        {pattern.description}
                      </p>
                      <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 6 }}>
                        Detected: {pattern.reportCount || 0} times
                        {pattern.lastReported && ` · Last: ${new Date(pattern.lastReported).toLocaleDateString()}`}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                      <button
                        onClick={() => togglePatternStatus(pattern)}
                        style={{ ...DM, background: pattern.isActive ? "rgba(239,68,68,.15)" : "rgba(52,211,153,.15)", color: pattern.isActive ? "#ef4444" : "#34d399", padding: "6px 12px", borderRadius: 6, border: `1px solid ${pattern.isActive ? "rgba(239,68,68,.3)" : "rgba(52,211,153,.3)"}`, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        {pattern.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deletePattern(pattern._id)}
                        style={{ ...DM, background: "rgba(239,68,68,.1)", color: "#ef4444", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,.2)", cursor: "pointer", fontSize: 11 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}