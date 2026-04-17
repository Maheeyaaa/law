// frontend/src/pages/AdminImportLawyers.tsx

import { useState, useEffect, CSSProperties } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue', cursive" };
const BLUE = "#1e5fff";

const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55)",
};

export default function AdminImportLawyers() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState<any>(null);

  const navigate = useNavigate();

  const API_URL = "http://localhost:8000/api";

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "court_staff") {
      navigate("/");
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/lawyers-stats`, getAuthHeaders());
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a CSV file" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_URL}/admin/import-lawyers`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("token")}`, },
      });

      setMessage({ 
        type: "success", 
        text: `✅ ${res.data.message}` 
      });
      setFile(null);
      fetchStats();
    } catch (err: any) {
      setMessage({ 
        type: "error", 
        text: `❌ ${err.response?.data?.message || "Upload failed"}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`${API_URL}/admin/csv-template`, "_blank");
  };

  const handleClearGenerated = async () => {
    if (!confirm("This will delete all generated/synthetic lawyers. Continue?")) return;

    try {
      const res = await axios.delete(`${API_URL}/admin/clear-generated`, getAuthHeaders());
      setMessage({ type: "success", text: `✅ ${res.data.message}` });
      fetchStats();
    } catch (err: any) {
      setMessage({ type: "error", text: `❌ ${err.response?.data?.message || "Failed"}` });
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)",
      padding: "40px"
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ ...DM, fontSize: 10, letterSpacing: "2px", color: "rgba(168,200,255,.5)", textTransform: "uppercase" }}>
            ADMIN PANEL
          </p>
          <h1 style={{ ...BN, fontSize: 36, color: "#fff", margin: "8px 0" }}>
            Import Real Lawyers
          </h1>
          <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.5)" }}>
            Upload CSV file with real Telangana lawyer data
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ 
            ...GLASS, 
            borderRadius: 16, 
            padding: 24, 
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16
          }}>
            {[
              { label: "Total Lawyers", value: stats.total, color: "#4d8aff" },
              { label: "Imported (CSV)", value: stats.imported, color: "#34d399" },
              { label: "Generated", value: stats.generated, color: "#fbbf24" },
              { label: "Registered", value: stats.registered, color: "#a78bfa" },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p style={{ ...BN, fontSize: 32, color: stat.color }}>{stat.value}</p>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            ...GLASS,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            background: message.type === "success" ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.15)",
            border: `1px solid ${message.type === "success" ? "rgba(52,211,153,.3)" : "rgba(239,68,68,.3)"}`,
          }}>
            <p style={{ ...DM, fontSize: 13, color: message.type === "success" ? "#34d399" : "#ef4444" }}>
              {message.text}
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div style={{ ...GLASS, borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <h2 style={{ ...DM, fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 20 }}>
            📤 Upload CSV File
          </h2>

          {/* Download Template */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 12 }}>
              First, download the CSV template to see the required format:
            </p>
            <button
              onClick={handleDownloadTemplate}
              style={{
                ...DM,
                background: "rgba(30,95,255,.15)",
                color: "#4d8aff",
                fontSize: 12,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid rgba(30,95,255,.3)",
                cursor: "pointer",
              }}
            >
              📥 Download CSV Template
            </button>
          </div>

          {/* File Input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: "block",
              ...DM, 
              fontSize: 12, 
              color: "rgba(255,255,255,.5)", 
              marginBottom: 8 
            }}>
              Select CSV file with lawyer data:
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{
                ...DM,
                width: "100%",
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(30,95,255,.25)",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#fff",
                fontSize: 12,
              }}
            />
            {file && (
              <p style={{ ...DM, fontSize: 11, color: "#34d399", marginTop: 8 }}>
                ✓ Selected: {file.name}
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              ...DM,
              width: "100%",
              background: loading || !file ? "rgba(107,114,128,.3)" : BLUE,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "14px 24px",
              borderRadius: 10,
              border: "none",
              cursor: loading || !file ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⏳ Importing..." : "🚀 Import Lawyers"}
          </button>
        </div>

        {/* Actions */}
        <div style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
          <h2 style={{ ...DM, fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
            ⚙️ Actions
          </h2>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleClearGenerated}
              style={{
                ...DM,
                background: "rgba(239,68,68,.15)",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid rgba(239,68,68,.3)",
                cursor: "pointer",
              }}
            >
              🗑️ Clear Generated Lawyers
            </button>
          </div>
          
          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 12 }}>
            This keeps only real imported and registered lawyers
          </p>
        </div>

        {/* Instructions */}
        <div style={{ ...GLASS, borderRadius: 16, padding: 24, marginTop: 24 }}>
          <h2 style={{ ...DM, fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
            📋 How to Get Real Lawyer Data
          </h2>
          
          <ol style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 2, paddingLeft: 20 }}>
            <li>Visit <a href="https://www.barcounciloftelangana.org" target="_blank" style={{ color: "#4d8aff" }}>Bar Council of Telangana</a> website</li>
            <li>Look for "Advocates List" or "Member Directory"</li>
            <li>Download the list (usually PDF or Excel)</li>
            <li>Convert to CSV format with columns: name, email, barCouncilNumber, specialization, district, experience, phone, languages</li>
            <li>Upload the CSV file here</li>
          </ol>

          <div style={{ 
            background: "rgba(251,191,36,.1)", 
            border: "1px solid rgba(251,191,36,.3)", 
            borderRadius: 8, 
            padding: 12,
            marginTop: 16 
          }}>
            <p style={{ ...DM, fontSize: 11, color: "#fbbf24" }}>
              💡 <strong>Tip:</strong> You can also file an RTI (Right to Information) request to get official lawyer list from Bar Council
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}