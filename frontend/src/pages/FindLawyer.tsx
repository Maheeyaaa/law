// frontend/src/pages/FindLawyer.tsx

import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { browseLawyers, getLawyerProfile, sendLawyerRequest, getMyLawyerRequests, cancelLawyerRequest, getMyCases } from "../services/api";

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

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || "?";
}

function requestStatusColor(status: string): string {
  switch (status) {
    case "pending": return "#fbbf24";
    case "accepted": return "#34d399";
    case "rejected": return "#ef4444";
    default: return "#6aadff";
  }
}

export default function FindLawyer() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"browse" | "requests">("browse");

  // Browse state
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [lawyerActiveCases, setLawyerActiveCases] = useState(0);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestCaseId, setRequestCaseId] = useState("");
  const [requestLawyerId, setRequestLawyerId] = useState("");
  const [requestLawyerName, setRequestLawyerName] = useState("");
  const [sending, setSending] = useState(false);
  const [requestMsg, setRequestMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cases for linking
  const [cases, setCases] = useState<any[]>([]);

  // My Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [requestCounts, setRequestCounts] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [requestFilter, setRequestFilter] = useState("");
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    fetchLawyers();
    fetchCases();
  }, [searchQuery, specFilter, page]);

  useEffect(() => {
    if (tab === "requests") fetchRequests();
  }, [tab, requestFilter]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (specFilter) params.specialization = specFilter;

      const res = await browseLawyers(params);
      setLawyers(res.data.lawyers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      if (res.data.specializations) setSpecializations(res.data.specializations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await getMyCases({});
      setCases(res.data.cases.filter((c: any) => c.status !== "Resolved" && c.status !== "Closed" && !c.assignedLawyer));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await getMyLawyerRequests(requestFilter || undefined);
      setRequests(res.data.requests);
      setRequestCounts(res.data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleViewProfile = async (lawyerId: string) => {
    try {
      setProfileLoading(true);
      setShowProfile(true);
      const res = await getLawyerProfile(lawyerId);
      setSelectedLawyer(res.data.lawyer);
      setLawyerActiveCases(res.data.activeCases);
      setAlreadyRequested(res.data.alreadyRequested);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const openRequestModal = (lawyerId: string, lawyerName: string) => {
    setRequestLawyerId(lawyerId);
    setRequestLawyerName(lawyerName);
    setRequestMessage("");
    setRequestCaseId("");
    setRequestMsg(null);
    setShowRequestModal(true);
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      setRequestMsg({ type: "error", text: "Please enter a message" });
      return;
    }

    try {
      setSending(true);
      setRequestMsg(null);

      const data: any = { lawyerId: requestLawyerId, message: requestMessage.trim() };
      if (requestCaseId) data.caseId = requestCaseId;

      await sendLawyerRequest(data);
      setRequestMsg({ type: "success", text: "Request sent successfully!" });

      setTimeout(() => {
        setShowRequestModal(false);
        setShowProfile(false);
        fetchLawyers();
      }, 1500);
    } catch (err: any) {
      setRequestMsg({ type: "error", text: err.response?.data?.message || "Failed to send request" });
    } finally {
      setSending(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm("Cancel this request?")) return;
    try {
      await cancelLawyerRequest(id);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CitizenLayout activeNav="law">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>FIND LAWYER</p>
          <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Legal Professionals</p>
        </div>

        {/* Tab Switch */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setTab("browse")} style={{ ...DM, fontSize: 12, fontWeight: 600, padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: tab === "browse" ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: tab === "browse" ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
            Browse Lawyers
          </button>
          <button onClick={() => setTab("requests")} style={{ ...DM, fontSize: 12, fontWeight: 600, padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: tab === "requests" ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: tab === "requests" ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease", display: "flex", alignItems: "center", gap: 8 }}>
            My Requests
            {requestCounts.pending > 0 && (
              <span style={{ ...DM, background: "#fbbf24", color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>{requestCounts.pending}</span>
            )}
          </button>
        </div>

        {/* ═══ BROWSE TAB ═══ */}
        {tab === "browse" && (
          <>
            {/* Search + Filter */}
            <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <input placeholder="Search by name or specialization..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} style={{ ...DM, flex: 1, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none" }} />
              <select value={specFilter} onChange={e => { setSpecFilter(e.target.value); setPage(1); }} style={{ ...DM, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", cursor: "pointer", minWidth: 180 }}>
                <option value="">All Specializations</option>
                {specializations.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)" }}>{total} lawyer{total !== 1 ? "s" : ""} found</p>

            {/* Lawyers Grid */}
            {loading ? (
              <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading lawyers...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : lawyers.length === 0 ? (
              <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
                <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No lawyers found</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                  {lawyers.map((l) => (
                    <div key={l._id} style={{ ...GLASS, borderRadius: 16, padding: "22px", position: "relative", overflow: "hidden", transition: "transform .2s ease" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                      <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.4),transparent)", pointerEvents: "none" }} />

                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, ...DM, color: "#fff", boxShadow: `0 0 16px rgba(30,95,255,.4)` }}>
                          {getInitials(l.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: "#fff" }}>{l.name}</p>
                          <p style={{ ...DM, fontSize: 11, color: ICEB, marginTop: 2 }}>{l.specialization || "General Practice"}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {l.experience && (
                          <span style={{ ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99, background: "rgba(30,95,255,.12)", border: "1px solid rgba(30,95,255,.25)", color: BLUEB }}>
                            {l.experience} yrs exp
                          </span>
                        )}
                        {l.barCouncilNumber && (
                          <span style={{ ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.25)", color: "#34d399" }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleViewProfile(l._id)} style={{ ...DM, flex: 1, background: "rgba(30,95,255,.15)", color: BLUEB, fontSize: 11, fontWeight: 600, padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(30,95,255,.3)", cursor: "pointer", transition: "all .2s ease" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.25)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.15)"}>
                          View Profile
                        </button>
                        <button onClick={() => openRequestModal(l._id, l.name)} style={{ ...DM, flex: 1, background: BLUE, color: "#fff", fontSize: 11, fontWeight: 600, padding: "9px 14px", borderRadius: 9, border: "none", cursor: "pointer", transition: "transform .2s ease" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                          Send Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 8 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...DM, background: page === 1 ? "rgba(255,255,255,.05)" : "rgba(30,95,255,.2)", color: page === 1 ? "rgba(255,255,255,.2)" : "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(30,95,255,.3)", cursor: page === 1 ? "not-allowed" : "pointer" }}>← Prev</button>
                    <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.5)" }}>Page {page} of {totalPages}</p>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...DM, background: page === totalPages ? "rgba(255,255,255,.05)" : "rgba(30,95,255,.2)", color: page === totalPages ? "rgba(255,255,255,.2)" : "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(30,95,255,.3)", cursor: page === totalPages ? "not-allowed" : "pointer" }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ═══ REQUESTS TAB ═══ */}
        {tab === "requests" && (
          <>
            {/* Request Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "Total Requests", value: requestCounts.total, color: BLUEB },
                { label: "Pending", value: requestCounts.pending, color: "#fbbf24" },
                { label: "Accepted", value: requestCounts.accepted, color: "#34d399" },
                { label: "Rejected", value: requestCounts.rejected, color: "#ef4444" },
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

            {/* Request Filters */}
            <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 10 }}>
              {[
                { id: "", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "accepted", label: "Accepted" },
                { id: "rejected", label: "Rejected" },
              ].map(f => (
                <button key={f.id} onClick={() => setRequestFilter(f.id)} style={{ ...DM, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: requestFilter === f.id ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: requestFilter === f.id ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Requests List */}
            <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

              {requestsLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No requests found</p>
                  <button onClick={() => setTab("browse")} style={{ ...DM, background: BLUE, color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", marginTop: 16 }}>Browse Lawyers</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {requests.map(r => (
                    <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.06)", transition: "all .2s ease" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.06)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.4)"}>

                      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, ...DM, color: "#fff" }}>
                          {r.lawyer ? getInitials(r.lawyer.name) : "?"}
                        </div>
                        <div>
                          <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.lawyer?.name || "Unknown"}</p>
                          <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
                            {r.lawyer?.specialization || "General"} • {r.case ? r.case.title : "No linked case"}
                          </p>
                          <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 4 }}>"{r.message}"</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <span style={{ ...DM, fontSize: 9, padding: "5px 12px", borderRadius: 99, background: `${requestStatusColor(r.status)}15`, border: `1px solid ${requestStatusColor(r.status)}44`, color: requestStatusColor(r.status), fontWeight: 600 }}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                        {r.status === "pending" && (
                          <button onClick={() => handleCancelRequest(r._id)} style={{ ...DM, background: "rgba(239,68,68,.15)", color: "#ef4444", fontSize: 10, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", cursor: "pointer" }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ PROFILE MODAL ═══ */}
        {showProfile && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={() => setShowProfile(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }} />
            <div style={{ position: "relative", width: 520, maxHeight: "80vh", overflowY: "auto", background: "rgba(8,16,45,0.95)", border: "1px solid rgba(30,95,255,.3)", borderRadius: 20, padding: "32px", boxShadow: SH_CARD }}>

              {profileLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading profile...</p>
                </div>
              ) : selectedLawyer ? (
                <>
                  {/* Close */}
                  <button onClick={() => setShowProfile(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 18, cursor: "pointer" }}>✕</button>

                  {/* Lawyer Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, ...DM, color: "#fff", boxShadow: `0 0 20px rgba(30,95,255,.5)` }}>
                      {getInitials(selectedLawyer.name)}
                    </div>
                    <div>
                      <p style={{ ...DM, fontSize: 20, fontWeight: 700, color: "#fff" }}>{selectedLawyer.name}</p>
                      <p style={{ ...DM, fontSize: 12, color: ICEB }}>{selectedLawyer.specialization || "General Practice"}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    {[
                      { label: "Experience", value: selectedLawyer.experience ? `${selectedLawyer.experience} years` : "N/A" },
                      { label: "Active Cases", value: String(lawyerActiveCases) },
                      { label: "Bar Council", value: selectedLawyer.barCouncilNumber || "N/A" },
                      { label: "Status", value: "✓ Verified" },
                    ].map((d, i) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(30,95,255,.1)" }}>
                        <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{d.label}</p>
                        <p style={{ ...DM, fontSize: 13, color: "#fff", fontWeight: 600 }}>{d.value}</p>
                      </div>
                    ))}
                  </div>

                  {selectedLawyer.bio && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>About</p>
                      <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.7 }}>{selectedLawyer.bio}</p>
                    </div>
                  )}

                  {/* Action */}
                  {alreadyRequested ? (
                    <div style={{ ...DM, background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.3)", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#fbbf24", textAlign: "center" }}>
                      ⏳ You already have a pending request to this lawyer
                    </div>
                  ) : (
                    <button onClick={() => { setShowProfile(false); openRequestModal(selectedLawyer._id, selectedLawyer.name); }} style={{ ...DM, width: "100%", background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                      Send Request to {selectedLawyer.name}
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* ═══ REQUEST MODAL ═══ */}
        {showRequestModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={() => setShowRequestModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }} />
            <div style={{ position: "relative", width: 480, background: "rgba(8,16,45,0.95)", border: "1px solid rgba(30,95,255,.3)", borderRadius: 20, padding: "32px", boxShadow: SH_CARD }}>

              <button onClick={() => setShowRequestModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 18, cursor: "pointer" }}>✕</button>

              <p style={{ ...DM, fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Send Request</p>
              <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 24 }}>to {requestLawyerName}</p>

              {requestMsg && (
                <div style={{ ...DM, background: requestMsg.type === "success" ? "rgba(52,211,153,.15)" : "rgba(255,107,107,.15)", border: `1px solid ${requestMsg.type === "success" ? "rgba(52,211,153,.3)" : "rgba(255,107,107,.3)"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: requestMsg.type === "success" ? "#34d399" : "#ff6b6b", marginBottom: 16 }}>
                  {requestMsg.type === "success" ? "✅" : "❌"} {requestMsg.text}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>Link to Case (Optional)</p>
                  <select value={requestCaseId} onChange={e => setRequestCaseId(e.target.value)} style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 8, padding: "10px 12px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                    <option value="">-- No case link --</option>
                    {cases.map(c => (
                      <option key={c._id} value={c._id}>{c.caseId} - {c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>Message *</p>
                  <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} rows={4} placeholder="Describe why you need this lawyer's help..." style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 8, padding: "10px 12px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>

                <button onClick={handleSendRequest} disabled={sending} style={{ ...DM, background: sending ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 10, border: "none", cursor: sending ? "not-allowed" : "pointer", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                  onMouseEnter={e => { if (!sending) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                  {sending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CitizenLayout>
  );
}