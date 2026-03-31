// frontend/src/pages/AdminPanel.tsx

import { useState, useEffect, type CSSProperties } from "react";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1e5fff";
const API = "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [scamPatterns, setScamPatterns] = useState<any[]>([]);
  const [showAddPattern, setShowAddPattern] = useState(false);

  // Add pattern form
  const [newPattern, setNewPattern] = useState({
    type: "keyword",
    pattern: "",
    description: "",
    severity: "medium",
    isRegex: false
  });

  useEffect(() => {
    loadStats();
    loadScamPatterns();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics/global-stats`, {
        headers: { "Authorization": "Bearer " + getToken() }
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
        headers: { "Authorization": "Bearer " + getToken() }
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
          "Authorization": "Bearer " + getToken(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPattern)
      });
      
      setNewPattern({
        type: "keyword",
        pattern: "",
        description: "",
        severity: "medium",
        isRegex: false
      });
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
        headers: { "Authorization": "Bearer " + getToken() }
      });
      loadScamPatterns();
      alert("Pattern deleted!");
    } catch (err) {
      alert("Error deleting pattern");
    }
  };

  const togglePatternStatus = async (pattern: any) => {
    try {
      await fetch(`${API}/scam/patterns/${pattern._id}`, {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + getToken(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive: !pattern.isActive })
      });
      loadScamPatterns();
    } catch (err) {
      alert("Error updating pattern");
    }
  };

  const cardStyle: CSSProperties = {
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(16px)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(30,95,255,.15)",
    boxShadow: "0 8px 32px rgba(0,0,0,.7)"
  };

  const statBoxStyle: CSSProperties = {
    background: "rgba(30,95,255,.08)",
    border: "1px solid rgba(30,95,255,.2)",
    borderRadius: 12,
    padding: 20,
    textAlign: "center"
  };

  return (
    <div style={{ ...DM, minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>🛠️ Admin Panel</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)" }}>Manage scam patterns and view global analytics</p>
        </div>

        {loading && !stats && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,.2)", borderTop: "4px solid #fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: 16, color: "rgba(255,255,255,.6)" }}>Loading...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {stats && (
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
              <div style={statBoxStyle}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{stats.users.total}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4 }}>Total Users</p>
              </div>
              <div style={statBoxStyle}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{stats.usage.totalMessages}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4 }}>Total Messages</p>
              </div>
              <div style={statBoxStyle}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#4ade80" }}>{stats.scamDetection.scamsDetected || 0}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4 }}>Scams Detected</p>
              </div>
              <div style={statBoxStyle}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#fbbf24" }}>{stats.scamDetection.totalScansPerformed || 0}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4 }}>Total Scans</p>
              </div>
            </div>

            {/* Feature Usage */}
            <div style={{ ...cardStyle, marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>📊 Feature Usage</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                {Object.entries(stats.usage.featureUsage || {}).map(([feature, count]: [string, any]) => (
                  <div key={feature} style={{ background: "rgba(255,255,255,.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,.05)" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: BLUE }}>{count}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4, textTransform: "capitalize" }}>{feature.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Users by Role */}
            <div style={{ ...cardStyle, marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>👥 Users by Role</h2>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {stats.users.byRole.map((role: any) => (
                  <div key={role._id} style={{ background: "rgba(255,255,255,.04)", padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(30,95,255,.2)" }}>
                    <p style={{ fontSize: 20, fontWeight: 700 }}>{role.count}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", textTransform: "capitalize" }}>{role._id}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Scam Patterns Management */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>🚨 Scam Pattern Database</h2>
            <button 
              onClick={() => setShowAddPattern(!showAddPattern)}
              style={{ background: BLUE, color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              {showAddPattern ? "Cancel" : "+ Add Pattern"}
            </button>
          </div>

          {/* Add Pattern Form */}
          {showAddPattern && (
            <div style={{ background: "rgba(255,255,255,.02)", padding: 20, borderRadius: 12, marginBottom: 20, border: "1px solid rgba(30,95,255,.2)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add New Scam Pattern</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 6 }}>Type</label>
                  <select 
                    value={newPattern.type} 
                    onChange={(e) => setNewPattern({...newPattern, type: e.target.value})}
                    style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                  >
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
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 6 }}>Severity</label>
                  <select 
                    value={newPattern.severity} 
                    onChange={(e) => setNewPattern({...newPattern, severity: e.target.value})}
                    style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 6 }}>Pattern</label>
                <input 
                  value={newPattern.pattern}
                  onChange={(e) => setNewPattern({...newPattern, pattern: e.target.value})}
                  placeholder="e.g. 'your account will be suspended', 'arrest within 24 hours'"
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 6 }}>Description</label>
                <input 
                  value={newPattern.description}
                  onChange={(e) => setNewPattern({...newPattern, description: e.target.value})}
                  placeholder="e.g. 'Common phishing threat about account suspension'"
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={newPattern.isRegex}
                    onChange={(e) => setNewPattern({...newPattern, isRegex: e.target.checked})}
                  />
                  Is Regular Expression (RegEx)
                </label>
              </div>

              <button 
                onClick={addPattern}
                style={{ background: "#4ade80", color: "#000", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}
              >
                Add Pattern
              </button>
            </div>
          )}

          {/* Patterns List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scamPatterns.length === 0 && (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,.3)", padding: 40 }}>No scam patterns yet. Add one above!</p>
            )}

            {scamPatterns.map((pattern) => (
              <div 
                key={pattern._id} 
                style={{ 
                  background: pattern.isActive ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.01)", 
                  padding: 16, 
                  borderRadius: 10, 
                  border: `1px solid ${pattern.severity === "critical" ? "rgba(239,68,68,.3)" : pattern.severity === "high" ? "rgba(251,191,36,.3)" : "rgba(30,95,255,.15)"}`,
                  opacity: pattern.isActive ? 1 : 0.5
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ 
                        background: pattern.severity === "critical" ? "#dc2626" : pattern.severity === "high" ? "#f59e0b" : pattern.severity === "medium" ? "#3b82f6" : "#6b7280",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {pattern.severity}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase" }}>
                        {pattern.type.replace(/_/g, " ")}
                      </span>
                      {pattern.isRegex && (
                        <span style={{ fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,.1)", padding: "2px 6px", borderRadius: 4 }}>
                          REGEX
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>"{pattern.pattern}"</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{pattern.description}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 8 }}>
                      Detected: {pattern.reportCount || 0} times
                      {pattern.lastReported && ` • Last: ${new Date(pattern.lastReported).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => togglePatternStatus(pattern)}
                      style={{ background: pattern.isActive ? "rgba(239,68,68,.2)" : "rgba(74,222,128,.2)", color: pattern.isActive ? "#ef4444" : "#4ade80", padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                    >
                      {pattern.isActive ? "Disable" : "Enable"}
                    </button>
                    <button 
                      onClick={() => deletePattern(pattern._id)}
                      style={{ background: "rgba(239,68,68,.1)", color: "#ef4444", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,.2)", cursor: "pointer", fontSize: 11 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button 
            onClick={() => window.location.href = "/citizen"}
            style={{ background: "rgba(255,255,255,.1)", color: "#fff", padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,.2)", cursor: "pointer", fontSize: 13 }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}