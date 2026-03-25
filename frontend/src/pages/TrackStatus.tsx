// frontend/src/pages/TrackStatus.tsx

import { useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { trackCase, trackCaseById } from "../services/api";

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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function TrackStatus() {
  const navigate = useNavigate();

  const [caseIdInput, setCaseIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleTrack = async () => {
    const query = caseIdInput.trim();
    if (!query) {
      setError("Please enter a Case ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrackingData(null);

      let res;
      if (query.startsWith("#")) {
        res = await trackCase(query);
      } else {
        res = await trackCaseById(query);
      }

      setTrackingData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Case not found. Please check the Case ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTrack();
  };

  const progressPercent = trackingData
    ? Math.round((trackingData.completedSteps / trackingData.totalSteps) * 100)
    : 0;

  return (
    <CitizenLayout activeNav="track">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>TRACK STATUS</p>
          <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Track Your Case</p>
        </div>

        {/* Search Box */}
        <div style={{ ...GLASS, borderRadius: 20, padding: "32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 24, lineHeight: 1.6 }}>
              Enter your Case ID to track the real-time status of your case through the court system.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <input
                value={caseIdInput}
                onChange={e => setCaseIdInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter Case ID (e.g. #LM-2025-0001)"
                style={{ ...DM, flex: 1, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.3)", borderRadius: 12, padding: "14px 20px", color: "#fff", fontSize: 14, outline: "none", transition: "border-color .2s ease" }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.6)"}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.3)"}
              />
              <button onClick={handleTrack} disabled={loading} style={{ ...DM, background: loading ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "14px 28px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: SH_CARD, transition: "transform .2s ease", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                {loading ? "Searching..." : "🔍 Track Case"}
              </button>
            </div>

            {error && (
              <div style={{ ...DM, background: "rgba(255,107,107,.1)", border: "1px solid rgba(255,107,107,.3)", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#ff6b6b", textAlign: "left" }}>
                ❌ {error}
              </div>
            )}
          </div>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <>
            {/* Case Overview Card */}
            <div style={{ ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <p style={{ ...DM, fontSize: 11, color: ICEB, fontWeight: 600 }}>{trackingData.case.caseId}</p>
                  <p style={{ ...DM, fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 4 }}>{trackingData.case.title}</p>
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <span style={{ ...DM, fontSize: 10, padding: "4px 12px", borderRadius: 99, background: `${statusColor(trackingData.case.status)}15`, border: `1px solid ${statusColor(trackingData.case.status)}44`, color: statusColor(trackingData.case.status), fontWeight: 600 }}>{trackingData.case.status}</span>
                    <span style={{ ...DM, fontSize: 10, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)" }}>{trackingData.case.caseType}</span>
                    <span style={{ ...DM, fontSize: 10, padding: "4px 12px", borderRadius: 99, background: `${priorityColor(trackingData.case.priority)}15`, border: `1px solid ${priorityColor(trackingData.case.priority)}44`, color: priorityColor(trackingData.case.priority) }}>{trackingData.case.priority} Priority</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Filed On</p>
                  <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 2 }}>{formatDate(trackingData.case.filingDate)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>Case Progress</p>
                  <p style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600 }}>{progressPercent}% Complete</p>
                </div>
                <div style={{ width: "100%", height: 8, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                  <div style={{ width: `${progressPercent}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${BLUE}, ${BLUEB})`, boxShadow: `0 0 12px ${BLUE}`, transition: "width .5s ease" }} />
                </div>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
                  Step {trackingData.currentStep} of {trackingData.totalSteps} — {trackingData.completedSteps} completed
                </p>
              </div>

              {/* Info Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "16px", border: "1px solid rgba(30,95,255,.15)" }}>
                  <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Assigned Lawyer</p>
                  <p style={{ ...DM, fontSize: 13, color: "#fff", fontWeight: 600 }}>
                    {trackingData.case.assignedLawyer ? trackingData.case.assignedLawyer.name : "Not yet assigned"}
                  </p>
                  {trackingData.case.assignedLawyer && (
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                      {trackingData.case.assignedLawyer.specialization}
                    </p>
                  )}
                </div>
                <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "16px", border: "1px solid rgba(30,95,255,.15)" }}>
                  <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Next Hearing</p>
                  <p style={{ ...DM, fontSize: 13, color: "#fff", fontWeight: 600 }}>
                    {trackingData.case.nextHearingDate ? formatDate(trackingData.case.nextHearingDate) : "Not scheduled"}
                  </p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "16px", border: "1px solid rgba(30,95,255,.15)" }}>
                  <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Case Type</p>
                  <p style={{ ...DM, fontSize: 13, color: "#fff", fontWeight: 600 }}>{trackingData.case.caseType}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
              <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 28 }}>📋 Case Progress Timeline</p>

              <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
                {trackingData.trackingSteps.map((step: any, i: number) => {
                  const isLast = i === trackingData.trackingSteps.length - 1;
                  const isCurrent = step.step === trackingData.currentStep;

                  return (
                    <div key={step.type} style={{ display: "flex", gap: 20, position: "relative" }}>
                      {/* Line + Dot */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                        <div style={{
                          width: isCurrent ? 40 : 32,
                          height: isCurrent ? 40 : 32,
                          borderRadius: "50%",
                          background: step.completed ? BLUE : isCurrent ? "rgba(30,95,255,.25)" : "rgba(255,255,255,.05)",
                          border: step.completed ? `3px solid ${BLUEB}` : isCurrent ? `3px solid ${BLUE}` : "3px solid rgba(255,255,255,.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: isCurrent ? 18 : 16,
                          flexShrink: 0,
                          boxShadow: step.completed ? `0 0 16px ${BLUE}` : isCurrent ? `0 0 12px rgba(30,95,255,.4)` : "none",
                          transition: "all .3s ease",
                          zIndex: 2,
                        }}>
                          {step.completed ? "✓" : step.icon}
                        </div>
                        {!isLast && (
                          <div style={{
                            width: 3,
                            flex: 1,
                            minHeight: 50,
                            background: step.completed ? `linear-gradient(180deg, ${BLUE}, ${trackingData.trackingSteps[i + 1]?.completed ? BLUE : "rgba(255,255,255,.08)"})` : "rgba(255,255,255,.08)",
                            borderRadius: 99,
                          }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ paddingBottom: isLast ? 0 : 20, paddingTop: isCurrent ? 4 : 2, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <p style={{
                            ...DM,
                            fontSize: isCurrent ? 15 : 13,
                            fontWeight: 700,
                            color: step.completed ? "#fff" : isCurrent ? ICEB : "rgba(255,255,255,.3)",
                          }}>
                            Step {step.step}: {step.event}
                          </p>
                          {step.completed && (
                            <span style={{ ...DM, fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "rgba(52,211,153,.15)", color: "#34d399", fontWeight: 600 }}>Completed</span>
                          )}
                          {isCurrent && !step.completed && (
                            <span style={{ ...DM, fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "rgba(30,95,255,.2)", color: BLUEB, fontWeight: 600 }}>In Progress</span>
                          )}
                        </div>
                        <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{step.description}</p>
                        {step.date && (
                          <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 4 }}>📅 {formatDate(step.date)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Button */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={() => navigate(`/citizen/cases/${trackingData.case._id || ""}`)} style={{ ...DM, background: BLUE, color: "#fff", fontSize: 12, fontWeight: 600, padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                View Full Case Details →
              </button>
              <button onClick={() => { setTrackingData(null); setCaseIdInput(""); }} style={{ ...DM, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 500, padding: "12px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", transition: "transform .2s ease" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                Track Another Case
              </button>
            </div>
          </>
        )}

      </div>
    </CitizenLayout>
  );
}