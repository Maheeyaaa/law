// frontend/src/pages/FindLawyer.tsx

import { useState, useEffect, CSSProperties } from "react";
import {
  browseLawyers,
  getLawyerPublicProfile,
} from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE  = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB  = "#a8c8ff";

const GLASS: CSSProperties = {
  background:           "rgba(0,0,0,0.45)",
  backdropFilter:       "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:               "1px solid rgba(255,255,255,0.06)",
  boxShadow:            "0 8px 32px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4)",
};

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || "?";
}

// Color avatar based on name (consistent per lawyer)
function getAvatarGradient(name: string): string {
  const colors = [
    "linear-gradient(135deg,#1e5fff,#7c3aed)",
    "linear-gradient(135deg,#0ea5e9,#1e5fff)",
    "linear-gradient(135deg,#7c3aed,#ec4899)",
    "linear-gradient(135deg,#10b981,#1e5fff)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function FindLawyer() {
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState<any[]>([]);

  // Filters & search
  const [searchQuery, setSearchQuery]       = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [specFilter, setSpecFilter]         = useState("");
  const [sortBy, setSortBy]                 = useState("name");

  // Dynamic filter options from backend
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableSpecs, setAvailableSpecs]         = useState<string[]>([]);

  // Pagination
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  // Profile modal
  const [showProfile, setShowProfile]       = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchLawyers();
  }, [searchQuery, districtFilter, specFilter, sortBy, page]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12, sortBy };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (districtFilter)     params.district = districtFilter;
      if (specFilter)         params.specialization = specFilter;

      const res = await browseLawyers(params);
      setLawyers(res.data.lawyers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);

      if (res.data.filters?.districts) {
        setAvailableDistricts(res.data.filters.districts);
      }
      if (res.data.filters?.specializations) {
        setAvailableSpecs(res.data.filters.specializations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (lawyerId: string) => {
    try {
      setProfileLoading(true);
      setShowProfile(true);
      const res = await getLawyerPublicProfile(lawyerId);
      setSelectedLawyer(res.data.lawyer);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDistrictFilter("");
    setSpecFilter("");
    setSortBy("name");
    setPage(1);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasActiveFilters = searchQuery || districtFilter || specFilter || sortBy !== "name";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: "url('/images/bg-marble.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .lawyer-card { animation: fadeIn .3s ease both; }
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ padding: "28px 28px 100px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ═══ HERO HEADER ═══ */}
        <div style={{ ...GLASS, borderRadius: 20, padding: "32px 36px", position: "relative", overflow: "hidden" }}>
          {/* Accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${BLUE}, ${BLUEB})`,
              boxShadow: `0 0 16px ${BLUE}`,
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.6)", marginBottom: 8 }}>
                FREE LEGAL AID • TELANGANA
              </p>
              <p style={{ ...BN, fontSize: 42, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
                Find a Pro Bono Lawyer
              </p>
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.7, maxWidth: 600 }}>
                Browse verified lawyers from the <strong style={{ color: ICEB }}>Department of Justice Pro Bono directory</strong>.
                All listed lawyers provide <strong style={{ color: "#34d399" }}>free legal services</strong> to those in need.
              </p>
            </div>

            {/* Stats badges */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{
                background: "rgba(30,95,255,.1)",
                border: "1px solid rgba(30,95,255,.25)",
                borderRadius: 14,
                padding: "16px 22px",
                minWidth: 120,
                textAlign: "center",
              }}>
                <p style={{ ...BN, fontSize: 32, color: "#fff", lineHeight: 1 }}>
                  {total.toString().padStart(3, "0")}
                </p>
                <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", color: ICEB, textTransform: "uppercase", marginTop: 6 }}>
                  Lawyers
                </p>
              </div>

              <div style={{
                background: "rgba(52,211,153,.08)",
                border: "1px solid rgba(52,211,153,.2)",
                borderRadius: 14,
                padding: "16px 22px",
                minWidth: 120,
                textAlign: "center",
              }}>
                <p style={{ ...BN, fontSize: 32, color: "#fff", lineHeight: 1 }}>
                  100%
                </p>
                <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", color: "#34d399", textTransform: "uppercase", marginTop: 6 }}>
                  Free Aid
                </p>
              </div>

              <div style={{
                background: "rgba(168,200,255,.06)",
                border: "1px solid rgba(168,200,255,.2)",
                borderRadius: 14,
                padding: "16px 22px",
                minWidth: 120,
                textAlign: "center",
              }}>
                <p style={{ ...BN, fontSize: 32, color: "#fff", lineHeight: 1 }}>
                  {availableDistricts.length}
                </p>
                <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", color: ICEB, textTransform: "uppercase", marginTop: 6 }}>
                  Districts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SEARCH + FILTERS ═══ */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute",
              left: 18,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              opacity: 0.5,
            }}>
              🔍
            </span>
            <input
              placeholder="Search by name, enrollment, or registration number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                ...DM,
                width: "100%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12,
                padding: "14px 14px 14px 48px",
                color: "rgba(255,255,255,.85)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                transition: "border .2s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.border = `1px solid ${BLUEB}66`)}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,.08)")}
            />
          </div>

          {/* Filters row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

            <select
              value={districtFilter}
              onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
              disabled={availableDistricts.length === 0}
              style={selectStyle}
            >
              <option value="">📍 All Districts ({availableDistricts.length})</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={specFilter}
              onChange={(e) => { setSpecFilter(e.target.value); setPage(1); }}
              disabled={availableSpecs.length === 0}
              style={selectStyle}
            >
              <option value="">⚖️ All Specializations ({availableSpecs.length})</option>
              {availableSpecs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              style={selectStyle}
            >
              <option value="name">↕️ Name (A → Z)</option>
              <option value="name-z">↕️ Name (Z → A)</option>
              <option value="newest">🆕 Recently Added</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  ...DM,
                  background: "rgba(239,68,68,.1)",
                  color: "#ef4444",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(239,68,68,.2)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all .2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.1)")}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>
            {loading ? "Loading..." : <><strong style={{ color: "#fff" }}>{total}</strong> lawyer{total !== 1 ? "s" : ""} found</>}
          </p>
          {hasActiveFilters && (
            <p style={{ ...DM, fontSize: 10, color: ICEB }}>
              {[searchQuery && "search", districtFilter && "district", specFilter && "specialization"]
                .filter(Boolean)
                .length} active filter(s)
            </p>
          )}
        </div>

        {/* ═══ LAWYERS GRID ═══ */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...GLASS, borderRadius: 16, padding: 22, height: 240 }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 4, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 4 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 20, width: 120, borderRadius: 99, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 9 }} />
                  <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 9 }} />
                </div>
              </div>
            ))}
          </div>
        ) : lawyers.length === 0 ? (
          <div style={{ ...GLASS, borderRadius: 16, padding: 80, textAlign: "center" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
            <p style={{ ...DM, fontSize: 18, color: "rgba(255,255,255,.6)", marginBottom: 8, fontWeight: 600 }}>
              No lawyers found
            </p>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
              We couldn't find any lawyers matching your search.
              Try adjusting your filters or removing some criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  ...DM,
                  background: BLUE,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "11px 24px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "transform .2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {lawyers.map((l, idx) => (
                <div
                  key={l._id}
                  className="lawyer-card"
                  style={{
                    ...GLASS,
                    borderRadius: 16,
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all .25s ease",
                    cursor: "pointer",
                    animationDelay: `${idx * 50}ms`,
                  }}
                  onClick={() => handleViewProfile(l._id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(30,95,255,.2), 0 4px 16px rgba(0,0,0,.6)";
                    (e.currentTarget as HTMLElement).style.border = "1px solid rgba(30,95,255,.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4)";
                    (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.06)";
                  }}
                >
                  {/* Top accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "10%",
                      right: "10%",
                      height: 1,
                      background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
                    }}
                  />

                  {/* Header: Avatar + Name */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: getAvatarGradient(l.name),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
                        fontWeight: 700,
                        flexShrink: 0,
                        ...DM,
                        color: "#fff",
                        boxShadow: "0 4px 16px rgba(0,0,0,.4)",
                      }}
                    >
                      {getInitials(l.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        ...DM,
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {l.name}
                      </p>
                      <p style={{ ...DM, fontSize: 11, color: ICEB, marginTop: 4 }}>
                        {l.specialization || "General Practice"}
                      </p>
                      {l.district && (
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
                          📍 {l.district}, Telangana
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
                    <span
                      style={{
                        ...DM,
                        fontSize: 9,
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: "rgba(52,211,153,.1)",
                        border: "1px solid rgba(52,211,153,.25)",
                        color: "#34d399",
                        fontWeight: 600,
                      }}
                    >
                      🆓 Free Legal Aid
                    </span>
                    <span
                      style={{
                        ...DM,
                        fontSize: 9,
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: "rgba(100,150,255,.08)",
                        border: "1px solid rgba(100,150,255,.2)",
                        color: "#90B0FF",
                        fontWeight: 600,
                      }}
                    >
                      ✓ DoJ Verified
                    </span>
                  </div>

                  {/* Bar Council info */}
                  {l.barCouncilNumber && (
                    <div style={{
                      background: "rgba(0,0,0,0.35)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginBottom: 16,
                      border: "1px solid rgba(255,255,255,.04)",
                    }}>
                      <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: "0.5px", marginBottom: 2 }}>
                        ENROLLMENT NO
                      </p>
                      <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.7)", fontFamily: "monospace", fontWeight: 600 }}>
                        {l.barCouncilNumber}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewProfile(l._id); }}
                      style={{
                        ...DM,
                        flex: 1,
                        background: "rgba(30,95,255,.15)",
                        color: BLUEB,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(30,95,255,.3)",
                        cursor: "pointer",
                        transition: "all .2s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.25)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.15)";
                      }}
                    >
                      View Profile
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open("https://www.probono-doj.in", "_blank");
                      }}
                      style={{
                        ...DM,
                        flex: 1,
                        background: BLUE,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        transition: "transform .2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      Contact →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ PAGINATION ═══ */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 12 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    ...DM,
                    background: page === 1 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)",
                    color: page === 1 ? "rgba(255,255,255,.2)" : "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,.08)",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Prev
                </button>

                <div style={{
                  ...DM,
                  fontSize: 12,
                  color: "rgba(255,255,255,.6)",
                  padding: "10px 18px",
                  background: "rgba(0,0,0,.3)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.06)",
                }}>
                  Page <strong style={{ color: "#fff" }}>{page}</strong> of <strong style={{ color: "#fff" }}>{totalPages}</strong>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    ...DM,
                    background: page === totalPages ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)",
                    color: page === totalPages ? "rgba(255,255,255,.2)" : "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,.08)",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══ PROFILE MODAL ═══ */}
        {showProfile && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div
              onClick={() => setShowProfile(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", backdropFilter: "blur(10px)" }}
            />

            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 560,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "rgba(10,15,40,0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 22,
                padding: 0,
                boxShadow: "0 32px 80px rgba(0,0,0,.9), 0 8px 32px rgba(0,0,0,.7)",
                animation: "fadeIn .25s ease both",
              }}
            >
              {profileLoading ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: "3px solid rgba(255,255,255,.1)",
                      borderTop: `3px solid ${BLUEB}`,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 16px",
                    }}
                  />
                  <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>
                    Loading profile...
                  </p>
                </div>
              ) : selectedLawyer ? (
                <>
                  {/* Modal header */}
                  <div style={{
                    padding: "32px 32px 24px",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                    position: "relative",
                  }}>
                    <button
                      onClick={() => setShowProfile(false)}
                      style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(255,255,255,.08)",
                        color: "rgba(255,255,255,.5)",
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .2s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.1)";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.05)";
                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.5)";
                      }}
                    >
                      ✕
                    </button>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          background: getAvatarGradient(selectedLawyer.name),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 26,
                          fontWeight: 700,
                          ...DM,
                          color: "#fff",
                          boxShadow: "0 8px 24px rgba(0,0,0,.6)",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(selectedLawyer.name)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, paddingRight: 40 }}>
                        <p style={{ ...DM, fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                          {selectedLawyer.name}
                        </p>
                        <p style={{ ...DM, fontSize: 13, color: ICEB, marginTop: 4 }}>
                          {selectedLawyer.specialization || "General Practice"}
                        </p>
                        {selectedLawyer.district && (
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                            📍 {selectedLawyer.district}, Telangana
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                          <span
                            style={{
                              ...DM,
                              fontSize: 9,
                              padding: "4px 10px",
                              borderRadius: 99,
                              background: "rgba(52,211,153,.1)",
                              border: "1px solid rgba(52,211,153,.25)",
                              color: "#34d399",
                              fontWeight: 600,
                            }}
                          >
                            🆓 Free Legal Aid
                          </span>
                          <span
                            style={{
                              ...DM,
                              fontSize: 9,
                              padding: "4px 10px",
                              borderRadius: 99,
                              background: "rgba(100,150,255,.08)",
                              border: "1px solid rgba(100,150,255,.2)",
                              color: "#90B0FF",
                              fontWeight: 600,
                            }}
                          >
                            ✓ DoJ Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal body */}
                  <div style={{ padding: "24px 32px" }}>

                    {/* Info grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                      {[
                        { label: "Enrollment No",   value: selectedLawyer.barCouncilNumber || "N/A", copyable: !!selectedLawyer.barCouncilNumber, fieldKey: "enrollment" },
                        { label: "Pro Bono Reg No", value: selectedLawyer.proBonoRegistrationNo || "N/A", copyable: !!selectedLawyer.proBonoRegistrationNo, fieldKey: "probono" },
                        { label: "District",        value: selectedLawyer.district || "N/A", copyable: false },
                        { label: "Experience",      value: selectedLawyer.experience ? `${selectedLawyer.experience} years` : "Not disclosed", copyable: false },
                      ].map((d, i) => (
                        <div
                          key={i}
                          style={{
                            background: "rgba(0,0,0,0.4)",
                            borderRadius: 10,
                            padding: "12px 14px",
                            border: "1px solid rgba(255,255,255,.06)",
                            position: "relative",
                          }}
                        >
                          <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
                            {d.label}
                          </p>
                          <p style={{ ...DM, fontSize: 13, color: "#fff", fontWeight: 600, fontFamily: d.copyable ? "monospace" : "inherit" }}>
                            {d.value}
                          </p>
                          {d.copyable && d.value !== "N/A" && (
                            <button
                              onClick={() => handleCopy(d.value, d.fieldKey!)}
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                background: "rgba(255,255,255,.05)",
                                border: "1px solid rgba(255,255,255,.1)",
                                color: copiedField === d.fieldKey ? "#34d399" : "rgba(255,255,255,.5)",
                                fontSize: 9,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                ...DM,
                                transition: "all .2s ease",
                              }}
                            >
                              {copiedField === d.fieldKey ? "✓ Copied" : "Copy"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* About section */}
                    {selectedLawyer.bio && (
                      <div style={{ marginBottom: 24 }}>
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                          About
                        </p>
                        <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
                          {selectedLawyer.bio}
                        </p>
                      </div>
                    )}

                    {/* Limited info notice */}
                    <div
                      style={{
                        background: "rgba(251,191,36,.06)",
                        border: "1px solid rgba(251,191,36,.15)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 20,
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>ℹ️</span>
                      <p style={{ ...DM, fontSize: 11, color: "rgba(251,191,36,.85)", lineHeight: 1.6 }}>
                        Only basic info is shown here. Visit the <strong>DoJ Pro Bono portal</strong> for complete details and contact options.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <button
                        onClick={() => window.open("https://www.probono-doj.in", "_blank")}
                        style={{
                          ...DM,
                          width: "100%",
                          background: BLUE,
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          padding: "14px 20px",
                          borderRadius: 12,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 8px 24px rgba(30,95,255,.3)",
                          transition: "transform .2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                      >
                        🔗  View Full Profile on DoJ Portal
                      </button>

                      <a
                        href="tel:15100"
                        style={{
                          ...DM,
                          width: "100%",
                          background: "rgba(52,211,153,.15)",
                          color: "#34d399",
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "12px 20px",
                          borderRadius: 12,
                          border: "1px solid rgba(52,211,153,.3)",
                          cursor: "pointer",
                          textDecoration: "none",
                          textAlign: "center",
                          display: "block",
                          boxSizing: "border-box",
                          transition: "all .2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,.25)";
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,.15)";
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                      >
                        📞  Call NALSA Helpline: 15100
                      </a>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

      </div>

      {/* ═══ FLOATING HELP BAR (NALSA) ═══ */}
      <a
        href="tel:15100"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff",
          padding: "14px 22px",
          borderRadius: 99,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 700,
          ...DM,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 12px 32px rgba(16,185,129,.4), 0 4px 16px rgba(0,0,0,.4)",
          zIndex: 100,
          transition: "transform .2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <span style={{ fontSize: 18 }}>📞</span>
        <span>Need help? Call NALSA</span>
        <span style={{
          background: "rgba(255,255,255,.25)",
          padding: "2px 10px",
          borderRadius: 99,
          fontSize: 12,
          fontWeight: 700,
        }}>
          15100
        </span>
      </a>
    </div>
  );
}

// ── Shared select styling ────────────────────────────────────
const selectStyle: CSSProperties = {
  fontFamily: "'DM Sans',sans-serif",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 10,
  padding: "10px 16px",
  color: "rgba(255,255,255,.75)",
  fontSize: 12,
  outline: "none",
  cursor: "pointer",
  flex: "1 1 180px",
};