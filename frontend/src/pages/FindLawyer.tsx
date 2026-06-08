// frontend/src/pages/FindLawyer.tsx

import { useState, useEffect, CSSProperties } from "react";

import {
  browseLawyers,
  getLawyerPublicProfile,
} from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
// Same serif font as Saved Cases page
const SERIF: CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const GOLD = "#C9A84C";
const CYAN = "#C9A84C";

// ── Single source of truth for ALL cards ─────────────────────
const CARD: CSSProperties = {
  background:   "rgba(20, 15, 10, 0.55)",
  border:       "1px solid rgba(201, 168, 76, 0.25)",
  borderRadius: 0,
  boxShadow:    "none",
};

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || "?";
}

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

  const [searchQuery, setSearchQuery]       = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [specFilter, setSpecFilter]         = useState("");
  const [sortBy, setSortBy]                 = useState("name");

  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableSpecs, setAvailableSpecs]         = useState<string[]>([]);

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const [showProfile, setShowProfile]       = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);

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

      if (res.data.filters?.districts)       setAvailableDistricts(res.data.filters.districts);
      if (res.data.filters?.specializations) setAvailableSpecs(res.data.filters.specializations);
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
        backgroundImage: "linear-gradient(rgba(15, 10, 5, 0.75), rgba(15, 10, 5, 0.75)), url('/find.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .lawyer-card { animation: fadeIn .3s ease both; }
        .skeleton {
          background: linear-gradient(90deg, rgba(201,168,76,.04) 25%, rgba(201,168,76,.08) 50%, rgba(201,168,76,.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ═══ HERO HEADER ═══ */}
        <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>

            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "#f5e6c8", marginBottom: 8 }}>
                FREE LEGAL AID - TELANGANA
              </p>

              {/* Title — Playfair Display serif (same as Saved Cases) */}
              <p style={{
                ...SERIF,
                fontWeight: 700,
                fontSize: 32,
                color: "#f5e6c8",
                lineHeight: 1,
                marginBottom: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Find a Pro Bono Lawyer
              </p>

              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.7, maxWidth: 600 }}>
                Browse verified lawyers from the{" "}
                <strong style={{ color: "#f5e6c8" }}>Department of Justice Pro Bono directory</strong>.
                All listed lawyers provide{" "}
                <strong style={{ color: "#f5e6c8" }}>free legal services</strong> to those in need.
              </p>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { value: total.toString().padStart(3, "0"), label: "Lawyers" },
                { value: "100%",                            label: "Free Aid" },
                { value: String(availableDistricts.length), label: "Districts" },
              ].map((stat) => (
                <div key={stat.label} style={{ ...CARD, padding: "16px 22px", minWidth: 120, textAlign: "center" }}>
                  <p style={{ ...SERIF, fontWeight: 700, fontSize: 30, color: "#C9A84C", lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", color: "#C9A84C", textTransform: "uppercase", marginTop: 6 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SEARCH + FILTERS ═══ */}
        <div style={{ ...CARD, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Search input */}
          <div style={{ position: "relative" }}>
            <input
              placeholder="Search by name, enrollment, or registration number..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{
                ...DM,
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(201, 168, 76, 0.2)",
                borderRadius: 0,
                padding: "14px",
                color: "rgba(255,255,255,.85)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                transition: "border .2s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.border = `1px solid ${CYAN}`)}
              onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(201, 168, 76, 0.2)")}
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
              <option value="">All Districts ({availableDistricts.length})</option>
              {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={specFilter}
              onChange={(e) => { setSpecFilter(e.target.value); setPage(1); }}
              disabled={availableSpecs.length === 0}
              style={selectStyle}
            >
              <option value="">All Specializations ({availableSpecs.length})</option>
              {availableSpecs.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              style={selectStyle}
            >
              <option value="name">Name (A - Z)</option>
              <option value="name-z">Name (Z - A)</option>
              <option value="newest">Recently Added</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  ...DM,
                  background: "rgba(239,68,68,.08)",
                  color: "#ef4444",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "10px 16px",
                  borderRadius: 0,
                  border: "1px solid rgba(239,68,68,.2)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all .2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.18)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.08)")}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>
            {loading
              ? "Loading..."
              : <><strong style={{ color: GOLD }}>{total}</strong> lawyer{total !== 1 ? "s" : ""} found</>}
          </p>
          {hasActiveFilters && (
            <p style={{ ...DM, fontSize: 10, color: GOLD }}>
              {[searchQuery && "search", districtFilter && "district", specFilter && "specialization"]
                .filter(Boolean).length} active filter(s)
            </p>
          )}
        </div>

        {/* ═══ LAWYERS GRID ═══ */}
        {loading ? (

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...CARD, padding: 22, height: 240 }}>
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

          /* ── Empty state ── */
          <div style={{ ...CARD, padding: 80, textAlign: "center" }}>
            <p style={{ ...SERIF, fontWeight: 700, fontSize: 22, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>
              No lawyers found
            </p>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", maxWidth: 400, margin: "0 auto 24px" }}>
              We couldn't find any lawyers matching your search.
              Try adjusting your filters or removing some criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  ...DM,
                  background: GOLD,
                  color: "#111",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "11px 24px",
                  borderRadius: 0,
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
                    ...CARD,
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all .25s ease",
                    cursor: "pointer",
                    animationDelay: `${idx * 50}ms`,
                  }}
                  onClick={() => handleViewProfile(l._id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform  = "translateY(-6px)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(20, 15, 10, 0.75)";
                    (e.currentTarget as HTMLElement).style.border     = `1px solid ${CYAN}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform  = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(20, 15, 10, 0.55)";
                    (e.currentTarget as HTMLElement).style.border     = "1px solid rgba(201,168,76,0.25)";
                  }}
                >
                  {/* Top accent */}
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                    background: `linear-gradient(90deg,transparent,${CYAN},transparent)`,
                  }} />

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      background: getAvatarGradient(l.name),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 17, fontWeight: 700, flexShrink: 0, ...DM,
                      color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,.4)",
                    }}>
                      {getInitials(l.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        ...SERIF, fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {l.name}
                      </p>
                      <p style={{ ...DM, fontSize: 11, color: CYAN, marginTop: 4 }}>
                        {l.specialization || "General Practice"}
                      </p>
                      {l.district && (
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
                          {l.district}, Telangana
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
                    <span style={{
                      ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.25)",
                      color: "#34d399", fontWeight: 600,
                    }}>Free Legal Aid</span>
                    <span style={{
                      ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(201,168,76,.1)", border: `1px solid ${CYAN}`,
                      color: CYAN, fontWeight: 600,
                    }}>DoJ Verified</span>
                  </div>

                  {/* Bar Council info */}
                  {l.barCouncilNumber && (
                    <div style={{
                      background: "rgba(0,0,0,0.2)", borderRadius: 0,
                      padding: "8px 12px", marginBottom: 16,
                      border: "1px solid rgba(201,168,76,0.15)",
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
                        ...DM, flex: 1, background: "rgba(201,168,76,.12)", color: CYAN,
                        fontSize: 11, fontWeight: 600, padding: "10px 14px", borderRadius: 0,
                        border: `1px solid ${CYAN}`, cursor: "pointer", transition: "all .2s ease",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.22)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.12)")}
                    >
                      View Profile
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open("https://www.probono-doj.in", "_blank"); }}
                      style={{
                        ...DM, flex: 1, background: GOLD, color: "#111",
                        fontSize: 11, fontWeight: 600, padding: "10px 14px", borderRadius: 0,
                        border: "none", cursor: "pointer", transition: "transform .2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      Contact
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
                    background: "rgba(20, 15, 10, 0.55)",
                    color: page === 1 ? "rgba(255,255,255,.2)" : "#fff",
                    fontSize: 12, fontWeight: 600, padding: "10px 18px", borderRadius: 0,
                    border: "1px solid rgba(201,168,76,.25)",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Prev
                </button>

                <div style={{
                  ...DM, fontSize: 12, color: "rgba(255,255,255,.6)",
                  padding: "10px 18px",
                  background: "rgba(20, 15, 10, 0.55)",
                  borderRadius: 0, border: "1px solid rgba(201,168,76,.25)",
                }}>
                  Page <strong style={{ color: GOLD }}>{page}</strong> of{" "}
                  <strong style={{ color: GOLD }}>{totalPages}</strong>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    ...DM,
                    background: "rgba(20, 15, 10, 0.55)",
                    color: page === totalPages ? "rgba(255,255,255,.2)" : "#fff",
                    fontSize: 12, fontWeight: 600, padding: "10px 18px", borderRadius: 0,
                    border: "1px solid rgba(201,168,76,.25)",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
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
            <div style={{
              position: "relative", width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto",
              background: "rgba(20, 15, 10, 0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${CYAN}`, borderRadius: 0, padding: 0,
              boxShadow: "0 32px 80px rgba(0,0,0,.9)",
              animation: "fadeIn .25s ease both",
            }}>
              {profileLoading ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <div style={{
                    width: 40, height: 40,
                    border: `3px solid rgba(201,168,76,0.1)`, borderTop: `3px solid ${CYAN}`,
                    borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px",
                  }} />
                  <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading profile...</p>
                </div>
              ) : selectedLawyer ? (
                <>
                  {/* Modal header */}
                  <div style={{ padding: "32px 32px 24px", borderBottom: `1px solid ${CYAN}`, position: "relative" }}>
                    <button
                      onClick={() => setShowProfile(false)}
                      style={{
                        position: "absolute", top: 20, right: 20, width: 32, height: 32,
                        borderRadius: 0, background: "rgba(201,168,76,.05)",
                        border: `1px solid ${CYAN}`, color: CYAN,
                        fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.15)";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.05)";
                        (e.currentTarget as HTMLElement).style.color = CYAN;
                      }}
                    >X</button>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: getAvatarGradient(selectedLawyer.name),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 26, fontWeight: 700, ...DM, color: "#fff",
                        boxShadow: "0 8px 24px rgba(0,0,0,.6)", flexShrink: 0,
                      }}>
                        {getInitials(selectedLawyer.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 40 }}>
                        <p style={{ ...SERIF, fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                          {selectedLawyer.name}
                        </p>
                        <p style={{ ...DM, fontSize: 13, color: CYAN, marginTop: 4 }}>
                          {selectedLawyer.specialization || "General Practice"}
                        </p>
                        {selectedLawyer.district && (
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                            {selectedLawyer.district}, Telangana
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                          <span style={{
                            ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99,
                            background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.25)",
                            color: "#34d399", fontWeight: 600,
                          }}>Free Legal Aid</span>
                          <span style={{
                            ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99,
                            background: "rgba(201,168,76,.1)", border: `1px solid ${CYAN}`,
                            color: CYAN, fontWeight: 600,
                          }}>DoJ Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal body */}
                  <div style={{ padding: "24px 32px" }}>

                    {/* Info grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                      {[
                        { label: "Enrollment No",   value: selectedLawyer.barCouncilNumber || "N/A",      copyable: !!selectedLawyer.barCouncilNumber,      fieldKey: "enrollment" },
                        { label: "Pro Bono Reg No", value: selectedLawyer.proBonoRegistrationNo || "N/A", copyable: !!selectedLawyer.proBonoRegistrationNo, fieldKey: "probono" },
                        { label: "District",        value: selectedLawyer.district || "N/A",              copyable: false },
                        { label: "Experience",      value: selectedLawyer.experience ? `${selectedLawyer.experience} years` : "Not disclosed", copyable: false },
                      ].map((d, i) => (
                        <div key={i} style={{
                          background: "rgba(20, 15, 10, 0.55)", borderRadius: 0,
                          padding: "12px 14px", border: "1px solid rgba(201,168,76,0.25)", position: "relative",
                        }}>
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
                                position: "absolute", top: 8, right: 8,
                                background: "rgba(201,168,76,.05)", border: `1px solid ${CYAN}`,
                                color: copiedField === d.fieldKey ? "#34d399" : CYAN,
                                fontSize: 9, fontWeight: 600, padding: "3px 8px",
                                borderRadius: 0, cursor: "pointer", ...DM, transition: "all .2s ease",
                              }}
                            >
                              {copiedField === d.fieldKey ? "Copied" : "Copy"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* About */}
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

                    {/* Notice */}
                    <div style={{
                      background: "rgba(201,168,76,.06)", border: `1px solid ${CYAN}`,
                      borderRadius: 0, padding: "12px 14px", marginBottom: 20,
                      display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: 16 }}>ℹ️</span>
                      <p style={{ ...DM, fontSize: 11, color: "rgba(201,168,76,.85)", lineHeight: 1.6 }}>
                        Only basic info is shown here. Visit the{" "}
                        <strong style={{ color: CYAN }}>DoJ Pro Bono portal</strong>{" "}
                        for complete details and contact options.
                      </p>
                    </div>

                    {/* CTA buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <button
                        onClick={() => window.open("https://www.probono-doj.in", "_blank")}
                        style={{
                          ...DM, width: "100%", background: GOLD, color: "#111",
                          fontSize: 13, fontWeight: 700, padding: "14px 20px", borderRadius: 0,
                          border: "none", cursor: "pointer",
                          boxShadow: "none", transition: "transform .2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                      >
                        View Full Profile on DoJ Portal
                      </button>

                      <a
                        href="tel:15100"
                        style={{
                          ...DM, width: "100%", background: "rgba(201,168,76,.1)", color: "#C9A84C",
                          fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 0,
                          border: "1px solid rgba(201,168,76,.25)", cursor: "pointer",
                          textDecoration: "none", textAlign: "center", display: "block",
                          boxSizing: "border-box", transition: "all .2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.2)";
                          (e.currentTarget as HTMLElement).style.transform  = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.1)";
                          (e.currentTarget as HTMLElement).style.transform  = "translateY(0)";
                        }}
                      >
                        Call NALSA Helpline: 15100
                      </a>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

      </div>

      {/* ═══ FLOATING NALSA BUTTON ═══ */}
      <a
        href="tel:15100"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          background: GOLD,
          color: "#111",
          padding: "14px 22px",
          borderRadius: 8,
          boxShadow: "none",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 700,
          ...DM,
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 100,
          transition: "transform .2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <span>📞</span>
        <span>Need help? Call NALSA</span>
        <span style={{
          background: "rgba(0,0,0,0.15)",
          padding: "2px 10px",
          borderRadius: 4,
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
  background: "rgba(20, 15, 10, 0.55)",
  border: "1px solid rgba(201, 168, 76, 0.25)",
  borderRadius: 0,
  padding: "10px 16px",
  color: "rgba(255,255,255,.75)",
  fontSize: 12,
  outline: "none",
  cursor: "pointer",
  flex: "1 1 180px",
};
