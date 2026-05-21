// frontend/src/pages/Hearings.tsx

import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { getMyHearings } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
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
    case "Scheduled": return "#3b82f6";
    case "Completed": return "#34d399";
    case "Postponed": return "#fbbf24";
    case "Cancelled": return "#ef4444";
    default: return "#6B7280";
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { 
    weekday: "short",
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { 
    hour: "numeric",
    minute: "2-digit",
    hour12: true 
  });
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const hearing = new Date(dateStr);
  const diff = hearing.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  return formatDate(dateStr);
}

export default function Hearings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [filter, setFilter] = useState("upcoming");

  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    postponed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchHearings();
  }, [filter]);

  const fetchHearings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filter === "upcoming") {
        params.upcoming = "true";
      } else if (filter !== "all") {
        params.status = filter.charAt(0).toUpperCase() + filter.slice(1);
      }

      const res = await getMyHearings(params);
      setConsultations(res.data.hearings || []);

      // Get all consultations for stats
      const allRes = await getMyHearings({});
      const allHearings = allRes.data.hearings || [];

      setStats({
        total: allHearings.length,
        scheduled: allHearings.filter((h: any) => h.status === "Scheduled").length,
        completed: allHearings.filter((h: any) => h.status === "Completed").length,
        postponed: allHearings.filter((h: any) => h.status === "Postponed").length,
        cancelled: allHearings.filter((h: any) => h.status === "Cancelled").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingConsultations = consultations.filter(h => new Date(h.hearingDate) >= new Date() && h.status === "Scheduled" || h.status === "Postponed");

  return (
    <CitizenLayout activeNav="hear">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>MY CONSULTATIONS</p>
          <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Legal Consultations</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {[
            { label: "Total Consultations", value: stats.total, color: BLUEB },
            { label: "Scheduled", value: stats.scheduled, color: "#3b82f6" },
            { label: "Completed", value: stats.completed, color: "#34d399" },
            { label: "Postponed", value: stats.postponed, color: "#fbbf24" },
            { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
          ].map((stat, i) => (
            <div key={i} style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden", transition: "transform .2s ease" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.color, boxShadow: `0 0 10px ${stat.color}` }} />
              <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ ...BN, fontSize: 36, color: "#fff" }}>{String(stat.value).padStart(2, "0")}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          {[
            { id: "upcoming", label: "Upcoming" },
            { id: "all", label: "All" },
            { id: "scheduled", label: "Scheduled" },
            { id: "completed", label: "Completed" },
            { id: "postponed", label: "Postponed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ ...DM, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: filter === f.id ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: filter === f.id ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading consultations...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : consultations.length === 0 ? (
          <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
            <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No consultations found</p>
          </div>
        ) : (
          <>
            {/* Upcoming Consultations */}
            {filter === "upcoming" || filter === "all" ? (
              upcomingConsultations.length > 0 && (
                <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
                  <p style={{ ...DM, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 10px #3b82f6" }} />
                    Upcoming Consultations
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {upcomingConsultations.map((h: any) => (
                      <div key={h._id} style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(59,130,246,.25)", boxShadow: SH_CARD, cursor: "pointer", transition: "all .2s ease" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,.5)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,.25)"; }}
                        onClick={() => h.case?._id && navigate(`/citizen/cases/${h.case._id}`)}>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <p style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600 }}>{h.case?.requestId || h.case?.caseId}</p>
                            <p style={{ ...DM, fontSize: 14, color: "#fff", fontWeight: 600, marginTop: 4 }}>{h.case?.title || "Legal Request"}</p>
                          </div>
                          <span style={{ ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99, background: `${statusColor(h.status)}15`, border: `1px solid ${statusColor(h.status)}44`, color: statusColor(h.status), fontWeight: 600 }}>
                            {getRelativeTime(h.hearingDate)}
                          </span>
                        </div>

                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:14 }}>💻</span>

                          <p
                          style={{
                          ...DM,
                          fontSize:11,
                          color:"rgba(255,255,255,.6)"
                          }}
                          >
                            {h.mode || "Online Consultation"}
                          </p>
                        </div>

                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:14 }}>💬</span>

                          <p
                          style={{
                          ...DM,
                          fontSize:11,
                          color:"rgba(255,255,255,.4)"
                          }}
                          >
                            {h.purpose || "Legal consultation"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}

            {/* Past/Other Consultations */}
            {filter !== "upcoming" && (
              <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
                <p style={{ ...DM, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
                  {filter === "all" ? "All Consultations" : filter.charAt(0).toUpperCase() + filter.slice(1) + " Consultations"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {consultations.map((h: any) => (
                    <div key={h._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.06)", cursor: "pointer", transition: "all .2s ease" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.08)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.4)"; }}
                      onClick={() => h.case?._id && navigate(`/citizen/cases/${h.case._id}`)}>
                      
                      <div style={{ flex: 1 }}>
                        <p style={{ ...DM, fontSize: 12, color: "#fff", fontWeight: 600 }}>{h.case?.title || "Legal Request"}</p>
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{h.purpose}</p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)" }}>{formatDate(h.hearingDate)}</p>
                          <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{h.hearingTime || formatTime(h.hearingDate)}</p>
                        </div>
                        <span style={{ ...DM, fontSize: 9, padding: "5px 12px", borderRadius: 99, background: `${statusColor(h.status)}15`, border: `1px solid ${statusColor(h.status)}44`, color: statusColor(h.status), fontWeight: 600 }}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </CitizenLayout>
  );
}