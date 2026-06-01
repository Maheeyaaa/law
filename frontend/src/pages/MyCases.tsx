import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCases, getCaseStats } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUEB = "#4d8aff";

const GLASS: CSSProperties = {
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4)",
};

function statusColor(status: string): string {
  switch (status) {
    case "Draft": return "#6B7280";
    case "Filed": return "#fbbf24";
    case "Pending": return "#60a5fa";
    case "Active": return "#34d399";
    case "Resolved": return "#93c5fd";
    case "Closed": return "#9ca3af";
    case "Dismissed": return "#ef4444";
    default: return "#6B7280";
  }
}

const STATUS_DISPLAY: Record<string, string> = {
  Draft: "Draft",
  Filed: "Submitted",
  Pending: "Under Review",
  Active: "Lawyer Assigned",
  Resolved: "Guidance Provided",
  Closed: "Closed",
  Dismissed: "Cancelled",
};

const FILTER_TO_STATUS: Record<string, string> = {
  All: "",
  Draft: "Draft",
  Submitted: "Filed",
  "Under Review": "Pending",
  "Lawyer Assigned": "Active",
  "Guidance Provided": "Resolved",
  Closed: "Closed",
  Cancelled: "Dismissed",
};

const FILTER_OPTIONS = [
  "All",
  "Draft",
  "Submitted",
  "Under Review",
  "Lawyer Assigned",
  "Guidance Provided",
  "Closed",
];

export default function MyCases() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

      if (filter !== "All") {
        params.status = FILTER_TO_STATUS[filter] || filter;
      }
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [casesRes, statsRes] = await Promise.all([
        getMyCases(params),
        getCaseStats(),
      ]);

      setCases(casesRes.data.cases || []);
      setTotalPages(casesRes.data.totalPages || 1);

      const s = statsRes.data || {};
      setStats({
        total: s.total || 0,
        active: s.active || 0,
        pending: s.pending || 0,
        resolved: s.resolved || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: "url('/images/bg-marble.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#fff",
      }}
    >
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>
              MY REQUESTS
            </p>
            <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>
              Legal Requests
            </p>
          </div>

          <button
            onClick={() => navigate("/citizen")}
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
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(0)")}
          >
            + Submit Legal Request
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Total Requests", value: stats.total, color: BLUEB },
            { label: "Lawyer Assigned", value: stats.active, color: BLUEB },
            { label: "Under Review", value: stats.pending, color: BLUEB },
            { label: "Guidance Provided", value: stats.resolved, color: BLUEB },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                ...GLASS,
                borderRadius: 16,
                padding: "20px 24px",
                position: "relative",
                overflow: "hidden",
                transition: "transform .2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(0)")}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: stat.color,
                  boxShadow: `0 0 10px ${stat.color}`,
                }}
              />
              <p
                style={{
                  ...DM,
                  fontSize: 9,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.4)",
                  marginBottom: 8,
                }}
              >
                {stat.label}
              </p>
              <p style={{ ...BN, fontSize: 36, color: "#fff" }}>
                {String(stat.value).padStart(2, "0")}
              </p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div
          style={{
            ...GLASS,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
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
                  transition: "all .2s ease",
                  backdropFilter: "blur(8px)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{
              ...DM,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 10,
              padding: "10px 16px",
              color: "rgba(255,255,255,.6)",
              fontSize: 12,
              outline: "none",
              width: 280,
            }}
          />
        </div>

        <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
          Track requests, view uploaded documents, and manage consultations.
        </p>

        {/* Requests Table */}
        <div
          style={{
            ...GLASS,
            borderRadius: 16,
            padding: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "8%",
              right: "8%",
              height: 1,
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)",
              pointerEvents: "none",
            }}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid rgba(255,255,255,.1)",
                  borderTop: "3px solid rgba(255,255,255,.4)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>
                Loading requests...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : cases.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>
                No requests found
              </p>
              <button
                onClick={() => navigate("/citizen")}
                style={{
                  ...DM,
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(12px)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  marginTop: 16,
                }}
              >
                + Submit Your First Request
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 0.8fr 1fr 1fr 0.6fr",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                  marginBottom: 8,
                }}
              >
                {["Request ID", "Issue Title", "Category", "District", "Status", "Manage"].map((h) => (
                  <p
                    key={h}
                    style={{
                      ...DM,
                      fontSize: 9,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,.3)",
                    }}
                  >
                    {h}
                  </p>
                ))}
              </div>

              {/* Table Rows */}
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {cases.map((c, i) => (
                  <div key={c._id}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 2fr 0.8fr 1fr 1fr 0.6fr",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 10,
                        background: i % 2 === 0 ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.03)",
                        alignItems: "center",
                        marginBottom: 4,
                        transition: "all .2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.5)";
                        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          i % 2 === 0 ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)";
                        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.03)";
                      }}
                      onClick={() => navigate(`/citizen/cases/${c._id}`)}
                    >
                      <p style={{ ...DM, fontSize: 11, color: BLUEB }}>
                        {c.caseId || c.requestId}
                      </p>

                      <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.7)" }}>
                        {c.title}
                      </p>

                      <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)" }}>
                        {c.caseType || c.category}
                      </p>

                      <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)" }}>
                        {c.district || "—"}
                      </p>

                      <span
                        style={{
                          ...DM,
                          fontSize: 9,
                          padding: "4px 10px",
                          borderRadius: 99,
                          background: `${statusColor(c.status)}15`,
                          border: `1px solid ${statusColor(c.status)}44`,
                          color: statusColor(c.status),
                        }}
                      >
                        {STATUS_DISPLAY[c.status] || c.status}
                      </span>

                      <span
                        style={{
                          ...DM,
                          fontSize: 11,
                          color: BLUEB,
                        }}
                      >
                        View →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      ...DM,
                      background: page === 1 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.45)",
                      color: page === 1 ? "rgba(255,255,255,.2)" : "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,.06)",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    ← Prev
                  </button>

                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.5)" }}>
                    Page {page} of {totalPages}
                  </p>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      ...DM,
                      background: page === totalPages ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.45)",
                      color: page === totalPages ? "rgba(255,255,255,.2)" : "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,.06)",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}