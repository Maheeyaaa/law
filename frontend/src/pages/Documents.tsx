// frontend/src/pages/Documents.tsx

import { useState, useEffect, useRef, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { getMyDocuments, uploadDocument, deleteDocument, downloadDocument, getMyCases } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";

const GLASS: CSSProperties = {
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4)",
};

function statusColor(status: string): string {
  switch (status) {
    case "Verified":  return "#34d399";
    case "Pending":   return "#fbbf24";
    case "Rejected":  return "#ef4444";
    default:          return "#6B7280";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

export default function Documents() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [linkedCase, setLinkedCase] = useState("");
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchDocuments();
    fetchCases();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await getMyDocuments();
      const docs = res.data.documents;
      setDocuments(docs);
      setStats({
        total: docs.length,
        verified: docs.filter((d: any) => d.status === "Verified").length,
        pending: docs.filter((d: any) => d.status === "Pending").length,
        rejected: docs.filter((d: any) => d.status === "Rejected").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await getMyCases({});
      setCases(res.data.cases);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !linkedCase) {
      setUploadMsg({ type: "error", text: "Please select both a document and request" });
      return;
    }
    try {
      setUploading(true);
      setUploadMsg(null);
      const formData = new FormData();
      formData.append("document", uploadFile);
      formData.append("caseId", linkedCase);
      await uploadDocument(formData);
      setUploadMsg({ type: "success", text: "Document uploaded successfully!" });
      setUploadFile(null);
      setLinkedCase("");
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err: any) {
      setUploadMsg({ type: "error", text: err.response?.data?.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, status: string) => {
    if (status === "Verified") {
      alert("Cannot delete a verified document. Contact support if needed.");
      return;
    }
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDocument(id);
      fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete document");
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = filter === "All"
    ? documents
    : documents.filter(d => d.status === filter);

  return (
    <CitizenLayout activeNav="docs">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>MY DOCUMENTS</p>
            <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>All Documents</p>
          </div>
          <button
            onClick={() => { setShowUpload(!showUpload); setUploadMsg(null); }}
            style={{
              ...DM,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: BLUEB,
              fontSize: 12,
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(0,0,0,.5)",
              transition: "transform .2s ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
            {showUpload ? "✕ Cancel" : "+ Upload Document"}
          </button>
        </div>

        {/* Stats Cards — all blue top bars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Total Documents", value: stats.total },
            { label: "Verified",        value: stats.verified },
            { label: "Pending Review",  value: stats.pending },
            { label: "Rejected",        value: stats.rejected },
          ].map((stat, i) => (
            <div key={i}
              style={{
                ...GLASS,
                borderRadius: 16,
                padding: "20px 24px",
                position: "relative",
                overflow: "hidden",
                transition: "transform .2s ease",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: BLUE,
                boxShadow: `0 0 12px ${BLUEB}, 0 0 4px ${BLUE}`,
              }} />
              <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ ...BN, fontSize: 36, color: "#fff" }}>{String(stat.value).padStart(2, "0")}</p>
            </div>
          ))}
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", pointerEvents: "none" }} />
            <p style={{ ...DM, fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Upload New Document</p>

            {uploadMsg && (
              <div style={{ ...DM, background: uploadMsg.type === "success" ? "rgba(52,211,153,.1)" : "rgba(255,107,107,.1)", border: `1px solid ${uploadMsg.type === "success" ? "rgba(52,211,153,.2)" : "rgba(255,107,107,.2)"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: uploadMsg.type === "success" ? "#34d399" : "#ff6b6b", marginBottom: 16 }}>
                {uploadMsg.type === "success" ? "✅" : "❌"} {uploadMsg.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Select File</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileSelect}
                  style={{ ...DM, width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "10px 12px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", cursor: "pointer" }}
                />
                {uploadFile && (
                  <p style={{ ...DM, fontSize: 11, color: ICEB, marginTop: 6 }}>
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 4 }}>
                  Accepted: PDF, DOC, DOCX, JPG, PNG, TXT — Max 10MB
                </p>
              </div>

              <div>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Link to Request</p>
                <select
                  value={linkedCase}
                  onChange={e => setLinkedCase(e.target.value)}
                  style={{ ...DM, width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "10px 12px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  <option value="">-- Select a request --</option>
                  {cases.map(c => (
                    <option key={c._id} value={c._id}>{c.caseId} - {c.title}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !uploadFile}
                style={{
                  ...DM,
                  background: uploading || !uploadFile ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.55)",
                  color: uploading || !uploadFile ? "rgba(255,255,255,.3)" : BLUEB,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.08)",
                  cursor: uploading || !uploadFile ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 24px rgba(0,0,0,.5)",
                  transition: "transform .2s ease",
                  alignSelf: "flex-start",
                }}
                onMouseEnter={e => { if (!uploading && uploadFile) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          {["All", "Verified", "Pending", "Rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                ...DM,
                fontSize: 11,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 99,
                cursor: "pointer",
                background: filter === f ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.35)",
                color: filter === f ? "#fff" : "rgba(255,255,255,.5)",
                border: filter === f ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
                transition: "all .2s ease",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Documents List */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)", pointerEvents: "none" }} />

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,.1)", borderTop: "3px solid rgba(255,255,255,.4)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading documents...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No documents found</p>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  ...DM,
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(12px)",
                  color: BLUEB,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  marginTop: 16,
                }}>
                + Upload Your First Document
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 0.8fr 0.8fr 0.8fr 1.4fr", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 8 }}>
                {["Document Name", "Linked Request", "Type", "Size", "Status", "Actions"].map(h => (
                  <p key={h} style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>{h}</p>
                ))}
              </div>

              {/* Table Rows */}
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {filteredDocs.map((d, i) => (
                  <div key={d._id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.5fr 1.5fr 0.8fr 0.8fr 0.8fr 1.4fr",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: i % 2 === 0 ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.03)",
                      alignItems: "center",
                      marginBottom: 4,
                      transition: "all .2s ease",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.5)";
                      (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)";
                      (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.03)";
                    }}>

                    <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.7)" }}>{d.name}</p>

                    <p
                      style={{ ...DM, fontSize: 11, color: d.case ? BLUEB : "rgba(255,255,255,.3)", cursor: d.case ? "pointer" : "default" }}
                      onClick={() => d.case && navigate(`/citizen/cases/${d.case._id}`)}>
                      {d.case ? d.case.caseId : "—"}
                    </p>

                    <span style={{ ...DM, fontSize: 9, padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,.08)", color: BLUEB, textAlign: "center" }}>
                      {d.fileType}
                    </span>

                    <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                      {typeof d.fileSize === "number"
                        ? formatFileSize(d.fileSize)
                        : d.fileSizeFormatted || d.fileSize || "—"}
                    </p>

                    <span style={{ ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99, background: `${statusColor(d.status)}15`, border: `1px solid ${statusColor(d.status)}44`, color: statusColor(d.status), fontWeight: 600, textAlign: "center" }}>
                      {d.status}
                    </span>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleDownload(d._id, d.name)}
                        style={{
                          ...DM,
                          background: "rgba(0,0,0,0.35)",
                          color: BLUEB,
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,.08)",
                          cursor: "pointer",
                          transition: "all .2s ease",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.5)";
                          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,.15)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.35)";
                          (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,.08)";
                        }}>
                        ↓ Download
                      </button>
                      <button
                        onClick={() => handleDelete(d._id, d.status)}
                        disabled={d.status === "Verified"}
                        style={{
                          ...DM,
                          background: d.status === "Verified" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.35)",
                          color: d.status === "Verified" ? "rgba(255,255,255,.2)" : "#ef4444",
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: `1px solid ${d.status === "Verified" ? "rgba(255,255,255,.04)" : "rgba(239,68,68,.2)"}`,
                          cursor: d.status === "Verified" ? "not-allowed" : "pointer",
                          transition: "all .2s ease",
                        }}
                        onMouseEnter={e => { if (d.status !== "Verified") { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.5)"; (e.currentTarget as HTMLElement).style.border = "1px solid rgba(239,68,68,.35)"; } }}
                        onMouseLeave={e => { if (d.status !== "Verified") { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.35)"; (e.currentTarget as HTMLElement).style.border = "1px solid rgba(239,68,68,.2)"; } }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </CitizenLayout>
  );
}