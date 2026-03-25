// frontend/src/pages/CaseDetail.tsx

import { useState, useEffect, CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { getCaseDetail, updateCaseNotes } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";

const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.4)",
};

function statusColor(status: string): string {
  switch (status) {
    case "Active": return "#34d399";
    case "Pending": return "#fbbf24";
    case "Resolved": return "#93c5fd";
    case "Closed": return "#9ca3af";
    default: return "#6aadff";
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case "High": return "#f87171";
    case "Urgent": return "#ef4444";
    case "Medium": return "#fbbf24";
    case "Low": return "#34d399";
    default: return "#6aadff";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);

  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const res = await getCaseDetail(id!);
        setCaseData(res.data.case);
        setTimeline(res.data.timeline || []);
        setDocuments(res.data.documents || []);
        setHearings(res.data.hearings || []);
        setNotes(res.data.case.notes || "");
      } catch (err: any) {
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError(err.response?.data?.message || "Failed to load case");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCase();
  }, [id, navigate]);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setSaveMsg(null);
      await updateCaseNotes(id!, { notes });
      setSaveMsg("Notes saved!");
      setEditingNotes(false);
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingNotes(false);
    }
  };

  const expectedSteps = [
    { type: "case_filed", label: "Case Filed", icon: "📝" },
    { type: "under_review", label: "Under Review", icon: "🔍" },
    { type: "lawyer_assigned", label: "Lawyer Assigned", icon: "👤" },
    { type: "hearing_scheduled", label: "Hearing Scheduled", icon: "📅" },
    { type: "hearing_completed", label: "Hearing Completed", icon: "✅" },
    { type: "resolved", label: "Case Resolved", icon: "⚖️" },
  ];

  const completedTypes = timeline.map((t: any) => t.type);

  if (loading) {
    return (
      <CitizenLayout activeNav="cases">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", ...DM }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading case...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  if (error || !caseData) {
    return (
      <CitizenLayout activeNav="cases">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", ...DM }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#ff6b6b", marginBottom: 12 }}>{error || "Case not found"}</p>
            <button onClick={() => navigate("/citizen/cases")} style={{ ...DM, background: BLUE, color: "#fff", padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13 }}>Back to Cases</button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="cases">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Back Button + Case Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/citizen/cases")} style={{ ...DM, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.5)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.5)"; }}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>{caseData.caseId}</p>
          </div>
        </div>

        {/* Case Info Header */}
        <div style={{ ...GLASS, borderRadius: 20, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ ...DM, fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{caseData.title}</p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ ...DM, fontSize: 10, padding: "4px 12px", borderRadius: 99, background: "rgba(30,95,255,0.2)", border: `1px solid ${statusColor(caseData.status)}44`, color: statusColor(caseData.status), fontWeight: 600 }}>{caseData.status}</span>
                <span style={{ ...DM, fontSize: 10, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)" }}>{caseData.caseType}</span>
                <span style={{ ...DM, fontSize: 10, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: `1px solid ${priorityColor(caseData.priority)}44`, color: priorityColor(caseData.priority) }}>{caseData.priority} Priority</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Filed On</p>
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 2 }}>{formatDate(caseData.filingDate)}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "flex", gap: 20 }}>

          {/* Left Column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Description */}
            <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", boxShadow: SH_CARD }}>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Description</p>
              <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.8 }}>{caseData.description}</p>
            </div>

            {/* Notes */}
            <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", boxShadow: SH_CARD }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff" }}>Notes</p>
                {!editingNotes ? (
                  <span onClick={() => setEditingNotes(true)} style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}>Edit ✏️</span>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <span onClick={() => { setEditingNotes(false); setNotes(caseData.notes || ""); }} style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", cursor: "pointer" }}>Cancel</span>
                    <span onClick={handleSaveNotes} style={{ ...DM, fontSize: 10, color: "#34d399", cursor: "pointer" }}>{savingNotes ? "Saving..." : "Save ✓"}</span>
                  </div>
                )}
              </div>
              {saveMsg && <p style={{ ...DM, fontSize: 10, color: "#34d399", marginBottom: 8 }}>{saveMsg}</p>}
              {editingNotes ? (
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 8, padding: "10px 12px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box" }} placeholder="Add notes about your case..." />
              ) : (
                <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.8 }}>{notes || "No notes added yet. Click Edit to add."}</p>
              )}
            </div>

            {/* Documents */}
            <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", boxShadow: SH_CARD }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff" }}>Documents</p>
                <span onClick={() => navigate("/citizen/documents")} style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}>Upload →</span>
              </div>
              {documents.length === 0 ? (
                <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.3)", textAlign: "center", padding: 16 }}>No documents linked to this case</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {documents.map((d: any, i: number) => (
                    <div key={d._id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ ...DM, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(30,95,255,.15)", border: "1px solid rgba(30,95,255,.3)", color: BLUEB }}>{d.fileType}</span>
                        <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>{d.name}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ ...DM, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: d.status === "Verified" ? "rgba(52,211,153,.15)" : "rgba(251,191,36,.15)", color: d.status === "Verified" ? "#34d399" : "#fbbf24" }}>{d.status}</span>
                        <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)" }}>{d.fileSize}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Timeline */}
            <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", boxShadow: SH_CARD }}>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Case Timeline</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {expectedSteps.map((step, i) => {
                  const done = completedTypes.includes(step.type);
                  const isLast = i === expectedSteps.length - 1;
                  const timelineEntry = timeline.find((t: any) => t.type === step.type);
                  return (
                    <div key={step.type} style={{ display: "flex", gap: 12, position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? BLUE : "rgba(255,255,255,.08)", border: done ? `2px solid ${BLUEB}` : "2px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0, boxShadow: done ? `0 0 8px ${BLUE}` : "none" }}>
                          {done ? "✓" : ""}
                        </div>
                        {!isLast && (
                          <div style={{ width: 2, flex: 1, minHeight: 30, background: done ? "rgba(30,95,255,.4)" : "rgba(255,255,255,.08)" }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 16 }}>
                        <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: done ? "#fff" : "rgba(255,255,255,.3)" }}>{step.icon} {step.label}</p>
                        {timelineEntry && (
                          <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 2 }}>{timelineEntry.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hearings */}
            <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", boxShadow: SH_CARD }}>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Hearings</p>
              {hearings.length === 0 ? (
                <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.3)", textAlign: "center", padding: 16 }}>No hearings scheduled</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {hearings.map((h: any) => (
                    <div key={h._id} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,.03)", border: "1px solid rgba(30,95,255,.15)" }}>
                      <p style={{ ...DM, fontSize: 11, color: "#fff", fontWeight: 600 }}>{formatDate(h.hearingDate)}</p>
                      <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{h.purpose}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </CitizenLayout>
  );
}