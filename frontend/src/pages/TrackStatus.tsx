// frontend/src/pages/TrackStatus.tsx
import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { trackByCredentials, trackSavedCase, getCaptcha, } from "../services/api";
import { CASE_TYPES } from "../constants/caseTypes";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

const GLASS: CSSProperties = {
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 8px 32px rgba(0,0,0,.6)",
};

const TELANGANA_COURTS = [
  "Telangana High Court, Hyderabad",
  "District Court, Hyderabad",
  "City Civil Court, Hyderabad",
  "Family Court, Hyderabad",
  "Consumer Court, Hyderabad",
  "Labour Court, Hyderabad",
  "District Court, Rangareddy",
  "District Court, Medchal-Malkajgiri",
  "District Court, Sangareddy",
  "District Court, Warangal",
  "District Court, Karimnagar",
  "District Court, Nizamabad",
  "District Court, Khammam",
  "District Court, Nalgonda",
  "District Court, Adilabad",
  "District Court, Mahabubnagar",
  "District Court, Mancherial",
  "District Court, Peddapalli",
  "District Court, Jagtial",
  "District Court, Medak",
  "District Court, Siddipet",
  "District Court, Suryapet",
  "District Court, Yadadri Bhuvanagiri",
  "District Court, Nagarkurnool",
  "District Court, Wanaparthy",
  "Telangana State Consumer Disputes Redressal Commission",
  "Telangana Administrative Tribunal",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const inp: CSSProperties = {
  ...DM, width: "100%",
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(30,95,255,.2)",
  borderRadius: 10, padding: "11px 14px",
  color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

const lbl: CSSProperties = {
  ...DM, fontSize: 10, letterSpacing: "1.3px",
  textTransform: "uppercase",
  color: "rgba(255,255,255,.3)",
  marginBottom: 6, display: "block",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // return as-is if not a valid date
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const EMPTY_FORM = {
  court:      "",
  caseType:   "",
  mtype:      0,
  caseNumber: "",
  year:       CURRENT_YEAR,
  cnrNumber:  "",
};

export default function TrackStatus() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [requiresCNR,  setRequiresCNR]  = useState<any>(null);
  const [form,         setForm]         = useState({ ...EMPTY_FORM });

  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [sessionCookie, setSessionCookie] = useState("");
  const [captcha, setCaptcha] = useState("");
  const primary = trackingData?.rawData?.primary;

  // Background
  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  useEffect(() => {
    const loadCaptcha = async () => {
      try {
        const data = await getCaptcha();

        setCaptchaImage(data.image);
        setCaptchaId(data.captchaId);
        setSessionCookie(data.sessionCookie);
      } catch (err) {
        console.error("Captcha load failed:", err);
      }
    };

    loadCaptcha();
  }, []);

  // Auto-track from My Cases
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromSaved && state?.credentials) {
      const { court, caseType, mtype, caseNumber, year, cnrNumber } = state.credentials;
      setForm({ court, caseType, mtype, caseNumber, year, cnrNumber: cnrNumber || "" });
      if (state.savedCaseId) {
        autoTrackSaved(state.savedCaseId);
      } else {
        autoTrackManual({ court, caseType, mtype, caseNumber, year, cnrNumber });
      }
    }
  }, [location.state]);

  const autoTrackSaved = async (savedCaseId: string) => {
    setTrackingData(null);
    setLoading(true);
    setError("");
    setRequiresCNR(null);
    try {
      const res = await trackSavedCase(savedCaseId);
      if (res.data?.credentials) {
        const {
          court,
          caseType,
          mtype,
          caseNumber,
          year,
          cnrNumber,
        } = res.data.credentials;

        setForm({
          court,
          caseType,
          mtype,
          caseNumber,
          year,
          cnrNumber: cnrNumber || "",
        });
      }
      if (res.data?.requiresCNR) {
        setRequiresCNR(res.data);
      } else {
        setTrackingData(res.data);
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requiresCNR) {
        setRequiresCNR(data);
      } else {
        setError(data?.message || "Failed to fetch case data");
      }
    } finally {
      setLoading(false);
    }
  };

  const autoTrackManual = async (credentials: any) => {
    setLoading(true);
    setError("");
    setRequiresCNR(null);
    try {
      const res = await trackByCredentials(credentials);
      if (res.data?.requiresCNR) {
        setRequiresCNR(res.data);
      } else {
        setTrackingData(res.data);
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requiresCNR) {
        setRequiresCNR(data);
      } else {
        setError(data?.message || "Failed to fetch case data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!form.court || !form.caseType || !form.caseNumber || !form.year) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    setTrackingData(null);
    setRequiresCNR(null);
    try {
      const res = await trackByCredentials({
        court:      form.court,
        caseType:   form.caseType,
        caseNumber: form.caseNumber.trim(),
        year:       form.year,
        cnrNumber:  form.cnrNumber.trim(),
        captcha,
        captchaId,
        sessionCookie,

        mtype: form.mtype,
      });
      if (res.data?.requiresCNR) {
        setRequiresCNR(res.data);
      } else {
        setTrackingData(res.data);
      }
    } catch (err: any) {
        const data = err.response?.data;
        if (data?.requiresCNR) {
          setRequiresCNR(data);
        } else if (data?.triedCNR) {
          // CNR was provided but server was unavailable
          setError(data?.message || "Could not fetch data. eCourts server may be temporarily unavailable. Please try again later.");
        } else {
          setError(data?.message || "Failed to fetch case data.");
        }
      }finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTrackingData(null);
    setRequiresCNR(null);
    setError("");
    setForm({ ...EMPTY_FORM });
  };

  return (
    <CitizenLayout activeNav="track">
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        select option      { background: #0a0f2c; color: #fff; }
        ::-webkit-scrollbar       { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(30,95,255,.3); border-radius: 3px; }
      `}</style>

      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>TRACK CASES</p>
            <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Case Tracker</p>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 6 }}>
              Enter your court case credentials to fetch the latest status.
            </p>
          </div>
          <button
            onClick={() => navigate("/citizen/cases")}
            style={{ ...DM, background: "rgba(30,95,255,.12)", border: "1px solid rgba(30,95,255,.3)", color: BLUEB, fontSize: 12, fontWeight: 600, padding: "10px 18px", borderRadius: 10, cursor: "pointer" }}
          >
            📁 My Saved Cases
          </button>
        </div>

        {/* Input Form */}
        <div style={{ ...GLASS, borderRadius: 18, padding: "28px" }}>
          <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
            🔍 Enter Case Credentials
          </p>

          {/* Row 1: Court + Case Type + Case Number + Year */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Court *</label>
              <select value={form.court} onChange={(e) => setForm((f) => ({ ...f, court: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                <option value="">Select court...</option>
                {TELANGANA_COURTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Case Type *</label>
              <select
                value={form.caseType}
                onChange={(e) => {
                  const selected = CASE_TYPES.find(
                    (t) => t.label === e.target.value
                  );

                  setForm((f) => ({
                    ...f,
                    caseType: selected?.label || "",
                    mtype: selected?.mtype || 0,
                  }));
                }}
                style={{
                  ...inp,
                  cursor: "pointer",
                  background: "rgba(255,255,255,.05)",
                  color: "#fff",
                  border: "1px solid rgba(30,95,255,.2)",
                  borderRadius: 10,
                }}
              >
                <option value="">Select type...</option>

                {CASE_TYPES.map((t) => (
                  <option key={t.mtype} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Case Number *</label>
              <input
                value={form.caseNumber}
                onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
                placeholder="e.g. 1/2026"
                style={inp}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <div>
              <label style={lbl}>Year *</label>
              <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) }))} style={{ ...inp, cursor: "pointer" }}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: CNR Number (full width) */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>CNR Number (required for live tracking)</label>
            <input
              value={form.cnrNumber}
              onChange={(e) => setForm((f) => ({ ...f, cnrNumber: e.target.value.toUpperCase() }))}
              placeholder="e.g. TSHC010000012026 (16 characters)"
              maxLength={16}
              style={inp}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
            <p style={{ ...DM, fontSize: 10, color: "rgba(168,200,255,.4)", marginTop: 6 }}>
              🔑 Your CNR is printed on all court documents. Without it, live tracking is unavailable.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Captcha *</label>

            {captchaImage && (
              <div style={{ marginBottom: 10 }}>
                <img
                  src={captchaImage}
                  alt="Captcha"
                  style={{
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,.1)",
                  }}
                />
              </div>
            )}

            <input
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              placeholder="Enter captcha"
              style={inp}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={handleTrack}
              disabled={loading}
              style={{ ...DM, background: loading ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 28px", borderRadius: 11, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Fetching...
                </>
              ) : "🔍 Track Case"}
            </button>

            {(trackingData || requiresCNR) && (
              <button
                onClick={handleClear}
                style={{ ...DM, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", fontSize: 12, padding: "12px 20px", borderRadius: 11, cursor: "pointer" }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 14, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 9, padding: "11px 14px", ...DM, fontSize: 12, color: "#ef4444" }}>
              ✕ {error}
            </div>
          )}
        </div>

        {/* CNR Required Message */}
        {requiresCNR && (
          <div style={{ ...GLASS, borderRadius: 16, padding: "24px", border: "1px solid rgba(251,191,36,.2)", animation: "fadeUp .3s ease" }}>
            <p style={{ ...DM, fontSize: 15, fontWeight: 700, color: "#fbbf24", marginBottom: 12 }}>
              🔑 CNR Number Required for Live Tracking
            </p>
            <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 18, lineHeight: 1.8 }}>
              {requiresCNR.message}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {requiresCNR.instructions?.map((inst: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#fbbf24", flexShrink: 0, fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
                  <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{inst}</p>
                </div>
              ))}
            </div>
            <a
              href="https://services.ecourts.gov.in"
              target="_blank"
              rel="noreferrer"
              style={{ ...DM, fontSize: 13, color: BLUEB, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              → Find your CNR on eCourts India ↗
            </a>
            <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 14 }}>
              Once you have your CNR, enter it in the "CNR Number" field above and click Track again.
            </p>
          </div>
        )}

        {/* Cached Data Warning */}
        {trackingData?.isCached && (
          <div style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>📦</span>
            <div>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>Showing Cached Data</p>
              <p style={{ ...DM, fontSize: 12, color: "rgba(251,191,36,.7)", lineHeight: 1.7 }}>
                {trackingData.message || "Could not reach court servers. Showing last saved data."}
                {trackingData.cachedAt && ` Last updated: ${formatDate(trackingData.cachedAt)}`}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {trackingData && !trackingData.requiresCNR && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .3s ease" }}>

            {/* Case Overview */}
            <div style={{ ...GLASS, borderRadius: 18, padding: "28px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 24,
                }}
              >
                <div>
                  <p
                    style={{
                      ...DM,
                      fontSize: 11,
                      color: BLUEB,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {trackingData.source ||
                      trackingData.savedCase?.court ||
                      trackingData.credentials?.court}
                  </p>

                  <p style={{ ...BN, fontSize: 26, color: "#fff" }}>
                    {primary?.mainno ||
                      (trackingData.savedCase?.caseType &&
                      trackingData.savedCase?.caseNumber
                        ? `${trackingData.savedCase.caseType} - ${trackingData.savedCase.caseNumber}`
                        : "Case Details")}
                  </p>

                  <p
                    style={{
                      ...DM,
                      fontSize: 12,
                      color: "rgba(255,255,255,.4)",
                      marginTop: 4,
                    }}
                  >
                    {trackingData.savedCase?.year && (
                      <>Year: {trackingData.savedCase.year}</>
                    )}
                    {primary?.cnrno && ` CNR: ${primary.cnrno}`}
                  </p>
                </div>

                <div
                  style={{
                    padding: "8px 18px",
                    borderRadius: 99,
                    background: "rgba(52,211,153,.1)",
                    border: "1px solid rgba(52,211,153,.25)",
                  }}
                >
                  <p
                    style={{
                      ...DM,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#34d399",
                    }}
                  >
                    {trackingData.caseStatus ||
                      primary?.casestatus ||
                      "Status Unavailable"}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 14,
                }}
              >
                {[
                  {
                    label: "Petitioner",
                    value: trackingData.petitioner || primary?.petitioner,
                  },
                  {
                    label: "Respondent",
                    value: trackingData.respondent || primary?.respondent,
                  },
                  {
                    label: "Petitioner Advocate",
                    value: primary?.petitioneradv,
                  },
                  {
                    label: "Respondent Advocate",
                    value: primary?.respondentadv,
                  },
                  {
                    label: "Purpose",
                    value: primary?.purpose,
                  },
                  {
                    label: "Next Hearing",
                    value: formatDate(
                      trackingData.nextHearing || primary?.listingdate
                    ),
                  },
                  {
                    label: "Case Status",
                    value: trackingData.caseStatus || primary?.casestatus,
                  },
                  {
                    label: "Judge",
                    value: trackingData.judge || primary?.judges,
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  },
                  {
                    label: "District",
                    value:
                      trackingData.district ||
                      primary?.district ||
                      trackingData?.data?.trail?.district,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <p
                      style={{
                        ...DM,
                        fontSize: 9,
                        letterSpacing: "1.3px",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,.3)",
                        marginBottom: 6,
                      }}
                    >
                      {item.label}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 13,
                        color:
                          item.value && item.value !== "—"
                            ? "#fff"
                            : "rgba(255,255,255,.3)",
                        fontWeight: 500,
                      }}
                    >
                      {item.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Case History */}
            {trackingData.caseHistory && trackingData.caseHistory.length > 0 && (
              <div style={{ ...GLASS, borderRadius: 18, padding: "28px" }}>
                <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 20 }}>📋 Hearing History</p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {trackingData.caseHistory.map((h: any, i: number) => {
                    const isLast = i === trackingData.caseHistory.length - 1;
                    return (
                      <div key={i} style={{ display: "flex", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                          <div style={{ width: 12, height: 12, borderRadius: "50%", background: BLUE, border: `2px solid ${BLUEB}`, flexShrink: 0, marginTop: 4, boxShadow: `0 0 10px ${BLUE}` }} />
                          {!isLast && <div style={{ width: 2, flex: 1, minHeight: 32, background: "rgba(30,95,255,.2)", margin: "4px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff" }}>{h.purpose}</p>
                              {h.result && <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 3 }}>Result: {h.result}</p>}
                            </div>
                            <p style={{ ...DM, fontSize: 11, color: BLUEB, flexShrink: 0, marginLeft: 12 }}>{formatDate(h.date)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => navigate("/citizen/cases")}
                style={{ ...DM, background: "rgba(30,95,255,.12)", border: "1px solid rgba(30,95,255,.3)", color: BLUEB, fontSize: 12, fontWeight: 600, padding: "11px 22px", borderRadius: 10, cursor: "pointer" }}
              >
                📁 Go to My Cases
              </button>
              <button
                onClick={handleTrack}
                style={{ ...DM, background: BLUE, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, padding: "11px 22px", borderRadius: 10, cursor: "pointer" }}
              >
                🔄 Refresh Status
              </button>
            </div>
          </div>
        )}

      </div>
    </CitizenLayout>
  );
}