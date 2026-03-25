// frontend/src/pages/MyCases.tsx

import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { getMyCases } from "../services/api";

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

export default function MyCases() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchCases();
  }, [filter, searchQuery, page]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (filter !== "All") params.status = filter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getMyCases(params);
      setCases(res.data.cases);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);

      // Update stats
      const allRes = await getMyCases({});
      const allCases = allRes.data.cases;
      setStats({
        total: allCases.length,
        active: allCases.filter((c: any) => c.status === "Active").length,
        pending: allCases.filter((c: any) => c.status === "Pending").length,
        resolved: allCases.filter((c: any) => c.status === "Resolved").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CitizenLayout activeNav="cases">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>MY CASES</p>
            <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>All Cases</p>
          </div>
          <button onClick={() => navigate("/citizen")} style={{ ...DM, background: BLUE, color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: SH_CARD, transition: "transform .2s ease" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
            + File New Case
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Total Cases", value: stats.total, color: BLUEB },
            { label: "Active", value: stats.active, color: "#34d399" },
            { label: "Pending", value: stats.pending, color: "#fbbf24" },
            { label: "Resolved", value: stats.resolved, color: "#93c5fd" },
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

        {/* Filters + Search */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Active", "Pending", "Resolved", "Closed"].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{ ...DM, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: filter === f ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: filter === f ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>{f}</button>
            ))}
          </div>
          <input placeholder="Search cases..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} style={{ ...DM, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", width: 280 }} />
        </div>

        {/* Cases Table */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
          
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading cases...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : cases.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No cases found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr 1fr 1fr 1fr 1fr", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 8 }}>
                {["Case ID", "Title", "Type", "Status", "Priority", "Action"].map(h => (
                  <p key={h} style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>{h}</p>
                ))}
              </div>

              {/* Table Rows */}
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {cases.map((c, i) => (
                  <div key={c._id} style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr 1fr 1fr 1fr 1fr", gap: 12, padding: "14px 16px", borderRadius: 10, background: i % 2 === 0 ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,.02)", alignItems: "center", marginBottom: 4, transition: "all .2s ease", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,.02)"; }}
                    onClick={() => navigate(`/citizen/cases/${c._id}`)}>
                    <p style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600 }}>{c.caseId}</p>
                    <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.7)" }}>{c.title}</p>
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)" }}>{c.caseType}</p>
                    <span style={{ ...DM, fontSize: 9, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: `${statusColor(c.status)}15`, border: `1px solid ${statusColor(c.status)}44`, color: statusColor(c.status), display: "inline-block", textAlign: "center" }}>{c.status}</span>
                    <span style={{ ...DM, fontSize: 9, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: `${priorityColor(c.priority)}15`, color: priorityColor(c.priority), display: "inline-block", textAlign: "center" }}>{c.priority}</span>
                    <span style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600 }}>View →</span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...DM, background: page === 1 ? "rgba(255,255,255,.05)" : "rgba(30,95,255,.2)", color: page === 1 ? "rgba(255,255,255,.2)" : "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(30,95,255,.3)", cursor: page === 1 ? "not-allowed" : "pointer" }}>← Prev</button>
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.5)" }}>Page {page} of {totalPages}</p>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...DM, background: page === totalPages ? "rgba(255,255,255,.05)" : "rgba(30,95,255,.2)", color: page === totalPages ? "rgba(255,255,255,.2)" : "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(30,95,255,.3)", cursor: page === totalPages ? "not-allowed" : "pointer" }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </CitizenLayout>
  );
}