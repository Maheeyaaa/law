// frontend/src/pages/TrackStatus.tsx

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  trackByCredentials,
  trackSavedCase,
  getCaptcha,
  getECourtsDistricts,
  getECourtsComplexes,
  getECourtsCaseTypes,
} from "../services/api";
import { CASE_TYPES } from "../constants/caseTypes";

let _captchaLoadedForSession = "";

// ── Styles ─────────────────────────────────────────────────────────
const DM:  CSSProperties = { fontFamily: "'Inter','DM Sans',sans-serif" };
const BN:  CSSProperties = { fontFamily: "'Cormorant Garamond','Playfair Display',Georgia,serif", fontWeight: 600 };
const BLUE  = "#1e5fff";
const BLUEB = "#4d8aff";
const GOLD = "#c9a84c";

const GLASS: CSSProperties = {
  background:           "rgba(35, 22, 12, 0.65)",
  border:               "1px solid rgba(201, 168, 76, 0.25)",
  boxShadow:            "0 4px 24px rgba(0,0,0,.3)",
};

const inp: CSSProperties = {
  ...DM, width: "100%",
  background:   "rgba(45, 28, 15, 0.7)",
  border:       "1px solid rgba(201, 168, 76, 0.3)",
  borderRadius: 0, padding: "11px 14px",
  color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

const lbl: CSSProperties = {
  ...DM, fontSize: 10, letterSpacing: "1.3px",
  textTransform: "uppercase",
  color: "rgba(201,168,76,.6)",
  marginBottom: 6, display: "block",
};

// ── Constants ──────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const COURT_TYPES = [
  { id: "tshc",     label: "Telangana High Court", supported: true,  provider: "TELANGANA_HC" },
  { id: "ecourts",  label: "District Court",       supported: true,  provider: "ECOURTS" },
  { id: "consumer", label: "Consumer Court",       supported: false, provider: "CONSUMER" },
  { id: "tribunal", label: "Tribunal",             supported: false, provider: "TRIBUNAL" },
];

const EMPTY_FORM = {
  courtType:    "",
  distCode:     "",
  distName:     "",
  complexCode:  "",
  complexName:  "",
  caseType:     "",
  mtype:        0,
  caseNumber:   "",
  year:         CURRENT_YEAR,
  cnrNumber:    "",
};

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function buildCourtName(form: typeof EMPTY_FORM): string {
  if (form.courtType === "tshc") return "Telangana High Court, Hyderabad";
  if (form.courtType === "ecourts" && form.distName) {
    return form.complexName
      ? `${form.complexName}, ${form.distName}`
      : `District Court, ${form.distName}`;
  }
  return "";
}

function courtNeedsCaptcha(courtType: string): boolean {
  return courtType === "tshc" || courtType === "ecourts";
}

// ── Provider Badge ─────────────────────────────────────────────────
function ProviderBadge({ courtType }: { courtType: string }) {
  if (!courtType) return null;

  const badgeMap: Record<string, {
    label: string; color: string; bg: string; border: string;
  }> = {
    tshc:     { label: "Telangana HC Portal", color: "#c9a84c", bg: "rgba(201,168,76,.1)",  border: "rgba(201,168,76,.3)"  },
    ecourts:  { label: "eCourts India",       color: "#34d399", bg: "rgba(52,211,153,.1)",  border: "rgba(52,211,153,.3)"  },
    consumer: { label: "CONFONET",            color: "#fbbf24", bg: "rgba(251,191,36,.1)",  border: "rgba(251,191,36,.3)"  },
    tribunal: { label: "Tribunal Portal",     color: "#fb7185", bg: "rgba(251,113,133,.1)", border: "rgba(251,113,133,.3)" },
  };

  const badge = badgeMap[courtType];
  if (!badge) return null;

  const type = COURT_TYPES.find((c) => c.id === courtType);
  const isComingSoon = type && !type.supported;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 99,
      background: badge.bg, border: `1px solid ${badge.border}`,
      marginTop: 8,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: badge.color, boxShadow: `0 0 6px ${badge.color}`,
      }} />
      <span style={{ ...DM, fontSize: 10, color: badge.color, fontWeight: 600, letterSpacing: "0.8px" }}>
        {badge.label}
      </span>
      {isComingSoon && (
        <span style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.3)", marginLeft: 4 }}>
          • COMING SOON
        </span>
      )}
    </div>
  );
}

// ── Coming Soon Banner ─────────────────────────────────────────────
function ComingSoonBanner({ courtType }: { courtType: string }) {
  const type = COURT_TYPES.find((c) => c.id === courtType);
  if (!type || type.supported) return null;

  return (
    <div style={{
      ...GLASS, borderRadius: 0, padding: "20px 24px",
      border: "1px solid rgba(251,191,36,.2)",
      display: "flex", gap: 16, alignItems: "flex-start",
    }}>
      <div>
        <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>
          Coming Soon — {type.label}
        </p>
        <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.8 }}>
          Live tracking for this court type is not yet available.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function TrackStatus() {
  const navigate = useNavigate();
  const location = useLocation();

  const captchaInputRef   = useRef<HTMLInputElement>(null);
  const captchaLoadingRef = useRef(false);

  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [trackingData,   setTrackingData]   = useState<any>(null);
  const [requiresCNR,    setRequiresCNR]    = useState<any>(null);
  const [form,           setForm]           = useState({ ...EMPTY_FORM });
  const [captchaImage,   setCaptchaImage]   = useState("");
  const [captchaId,      setCaptchaId]      = useState("");
  const [sessionCookie,  setSessionCookie]  = useState("");
  const [captcha,        setCaptcha]        = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [districts,        setDistricts]        = useState<Array<{ code: string; name: string }>>([]);
  const [complexes,        setComplexes]        = useState<Array<{ code: string; name: string }>>([]);
  const [caseTypes,        setCaseTypes]        = useState<Array<{ code: string; name: string }>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingComplexes, setLoadingComplexes] = useState(false);
  const [loadingCaseTypes, setLoadingCaseTypes] = useState(false);

  const primary = trackingData?.rawData?.primary;

  // ── Background ──────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.backgroundImage      = "linear-gradient(rgba(15,8,3,0.75), rgba(15,8,3,0.75)), url('/track.jpg')";
    document.body.style.backgroundSize       = "cover";
    document.body.style.backgroundPosition   = "center";
    document.body.style.backgroundRepeat     = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  // ── Load captcha ───────────────────────────────────────────────
  const loadCaptcha = useCallback(async (courtName: string) => {
    if (!courtName) {
      setCaptchaImage("");
      setCaptchaId("");
      setSessionCookie("");
      return;
    }

    if (captchaLoadingRef.current) return;
    captchaLoadingRef.current = true;
    setCaptchaLoading(true);

    try {
      const data = await getCaptcha(courtName);
      setCaptchaImage(data.data?.image          || "");
      setCaptchaId(data.data?.captchaId         || "");
      setSessionCookie(data.data?.sessionCookie || "");
      console.log("[loadCaptcha] Loaded for:", courtName);
    } catch (err) {
      console.error("[loadCaptcha] Failed:", err);
      setCaptchaImage("");
      setCaptchaId("");
      setSessionCookie("");
    } finally {
      setCaptchaLoading(false);
      captchaLoadingRef.current = false;
    }
  }, []);

  // ── Load Districts ─────────────────────────────────────────────
  const loadDistricts = useCallback(async () => {
    if (districts.length > 0) return;
    setLoadingDistricts(true);
    try {
      const res = await getECourtsDistricts();
      setDistricts(res.data?.data || []);
    } catch (err) {
      console.error("[loadDistricts] Failed:", err);
    } finally {
      setLoadingDistricts(false);
    }
  }, [districts.length]);

  // ── Load Court Complexes ───────────────────────────────────────
  const loadComplexes = useCallback(async (distCode: string) => {
    if (!distCode) return;
    setLoadingComplexes(true);
    setComplexes([]);
    try {
      const res = await getECourtsComplexes(distCode);
      setComplexes(res.data?.data || []);
    } catch (err) {
      console.error("[loadComplexes] Failed:", err);
    } finally {
      setLoadingComplexes(false);
    }
  }, []);

  // ── Load Case Types ────────────────────────────────────────────
  const loadCaseTypes = useCallback(async (distCode: string, complexCode: string) => {
    if (!distCode || !complexCode) return;
    setLoadingCaseTypes(true);
    setCaseTypes([]);
    try {
      const res = await getECourtsCaseTypes(distCode, complexCode);
      setCaseTypes(res.data?.data || []);
    } catch (err) {
      console.error("[loadCaseTypes] Failed:", err);
    } finally {
      setLoadingCaseTypes(false);
    }
  }, []);

  // ── Load saved case from URL param (notification click) ────────
  const loadSavedCaseAndTrack = async (savedCaseId: string) => {
    try {
      setLoading(true);
      setError("");

      const res = await trackSavedCase(savedCaseId);
      const sc  = res.data?.savedCase;
      const creds = res.data?.credentials;
      const data = creds || sc;

      if (!data) {
        setError("Saved case not found");
        setLoading(false);
        return;
      }

      let courtType = "ecourts";
      if (data.court?.toLowerCase().includes("high court")) courtType = "tshc";

      setForm({
        courtType,
        distCode:    data.distCode    || "",
        distName:    data.distName    || "",
        complexCode: data.complexCode || "",
        complexName: data.complexName || "",
        caseType:    data.caseType    || "",
        mtype:       data.mtype       || 0,
        caseNumber:  data.caseNumber  || "",
        year:        data.year        || CURRENT_YEAR,
        cnrNumber:   data.cnrNumber   || "",
      });

      if (res.data?.cachedTrackingData) {
        setTrackingData(res.data.cachedTrackingData);
      }

      if (courtType === "ecourts") {
        loadDistricts();
        if (data.distCode) loadComplexes(data.distCode);
        if (data.distCode && data.complexCode) {
          loadCaseTypes(data.distCode, data.complexCode);
        }
      }

      if (courtNeedsCaptcha(courtType)) {
        const courtName = buildCourtName({
          ...EMPTY_FORM,
          courtType,
          distName:    data.distName    || "",
          complexName: data.complexName || "",
        });
        if (courtName && _captchaLoadedForSession !== courtName) {
          _captchaLoadedForSession = courtName;
          loadCaptcha(courtName);
        }
      }

    } catch (err: any) {
      console.error("[loadSavedCaseAndTrack] Failed:", err);
      setError(err.response?.data?.message || "Failed to load case from notification");
    } finally {
      setLoading(false);
    }
  };

  // ── On mount ───────────────────────────────────────────────────
  useEffect(() => {
    const state = location.state as any;
    const urlParams = new URLSearchParams(location.search);
    const savedCaseIdFromUrl = urlParams.get("savedCase");

    if (savedCaseIdFromUrl) {
      loadSavedCaseAndTrack(savedCaseIdFromUrl);
      return;
    }

    if (state?.fromSaved && state?.credentials) {
      const creds = state.credentials;

      let courtType = "ecourts";
      if (creds.court?.toLowerCase().includes("high court")) courtType = "tshc";

      setForm({
        courtType,
        distCode:    creds.distCode    || "",
        distName:    creds.distName    || "",
        complexCode: creds.complexCode || "",
        complexName: creds.complexName || "",
        caseType:    creds.caseType    || "",
        mtype:       creds.mtype       || 0,
        caseNumber:  creds.caseNumber  || "",
        year:        creds.year        || CURRENT_YEAR,
        cnrNumber:   creds.cnrNumber   || "",
      });

      const courtName = buildCourtName({
        ...EMPTY_FORM,
        courtType,
        distName:    creds.distName    || "",
        complexName: creds.complexName || "",
      });

      if (courtNeedsCaptcha(courtType) && _captchaLoadedForSession !== courtName) {
        _captchaLoadedForSession = courtName;
        loadCaptcha(courtName);
      }

      if (courtType === "ecourts") {
        loadDistricts();
        if (creds.distCode) loadComplexes(creds.distCode);
        if (creds.distCode && creds.complexCode) loadCaseTypes(creds.distCode, creds.complexCode);
      }

      if (state.savedCaseId) autoTrackSaved(state.savedCaseId);

    } else {
      const defaultCourtName = "Telangana High Court, Hyderabad";
      setForm((f) => ({ ...f, courtType: "tshc" }));

      if (_captchaLoadedForSession !== defaultCourtName) {
        _captchaLoadedForSession = defaultCourtName;
        loadCaptcha(defaultCourtName);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-track saved case ──────────────────────────────────────
  const autoTrackSaved = async (savedCaseId: string) => {
    setTrackingData(null);
    setLoading(true);
    setError("");
    setRequiresCNR(null);
    try {
      const res = await trackSavedCase(savedCaseId);
      if (res.data?.requiresCNR) {
        setRequiresCNR(res.data);
      } else {
        setTrackingData(res.data);
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requiresCNR) setRequiresCNR(data);
      else setError(data?.message || "Failed to load saved case");
    } finally {
      setLoading(false);
    }
  };

  // ── Court Type change ──────────────────────────────────────────
  const handleCourtTypeChange = (courtType: string) => {
    _captchaLoadedForSession  = "";
    captchaLoadingRef.current = false;

    setForm({ ...EMPTY_FORM, courtType });
    setTrackingData(null);
    setRequiresCNR(null);
    setError("");
    setCaptcha("");
    setComplexes([]);
    setCaseTypes([]);

    if (courtType === "tshc") {
      const courtName = "Telangana High Court, Hyderabad";
      _captchaLoadedForSession = courtName;
      loadCaptcha(courtName);
    } else if (courtType === "ecourts") {
      loadDistricts();
      setCaptchaImage("");
      setCaptchaId("");
      setSessionCookie("");
    } else {
      setCaptchaImage("");
      setCaptchaId("");
      setSessionCookie("");
    }
  };

  // ── District change ────────────────────────────────────────────
  const handleDistrictChange = (distCode: string) => {
    const dist = districts.find((d) => d.code === distCode);
    setForm((f) => ({
      ...f,
      distCode,
      distName:    dist?.name || "",
      complexCode: "",
      complexName: "",
      caseType:    "",
      mtype:       0,
    }));
    setComplexes([]);
    setCaseTypes([]);
    setCaptchaImage("");
    setCaptchaId("");
    setSessionCookie("");
    setCaptcha("");

    if (distCode) loadComplexes(distCode);
  };

  // ── Complex change ─────────────────────────────────────────────
  const handleComplexChange = (complexCode: string) => {
    const complex = complexes.find((c) => c.code === complexCode);
    setForm((f) => ({
      ...f,
      complexCode,
      complexName: complex?.name || "",
      caseType:    "",
      mtype:       0,
    }));
    setCaseTypes([]);
    setCaptcha("");

    if (complexCode && form.distCode) {
      loadCaseTypes(form.distCode, complexCode);

      const courtName = `${complex?.name || ""}, ${form.distName}`;
      _captchaLoadedForSession  = courtName;
      captchaLoadingRef.current = false;
      loadCaptcha(courtName);
    }
  };

  // ── Track handler ──────────────────────────────────────────────
  const handleTrack = async () => {
    if (!form.courtType) { setError("Please select a court type"); return; }

    const courtTypeConfig = COURT_TYPES.find((c) => c.id === form.courtType);

    if (!courtTypeConfig?.supported) {
      setError(`${courtTypeConfig?.label} tracking is coming soon.`);
      return;
    }

    if (form.courtType === "ecourts") {
      if (!form.distCode)    { setError("Please select a district");      return; }
      if (!form.complexCode) { setError("Please select a court complex"); return; }
    }

    if (!form.caseType || !form.caseNumber || !form.year) {
      setError("Please fill case type, number, and year");
      return;
    }

    const needsCaptchaInput = courtNeedsCaptcha(form.courtType);
    if (needsCaptchaInput && !captcha) {
      setError("Please enter the captcha");
      return;
    }

    setLoading(true);
    setError("");
    setTrackingData(null);
    setRequiresCNR(null);

    try {
      const courtName = buildCourtName(form);

      const res = await trackByCredentials({
        court:         courtName,
        caseType:      form.caseType,
        caseNumber:    form.caseNumber.trim(),
        year:          form.year,
        cnrNumber:     form.cnrNumber.trim(),
        captcha:       captcha       || "",
        captchaId:     captchaId     || "",
        sessionCookie: sessionCookie || "",
        mtype:         form.mtype,
        distCode:      form.distCode    || "",
        complexCode:   form.complexCode || "",
      } as any);

      if (res.data?.requiresCNR) {
        setRequiresCNR(res.data);
      } else {
        setTrackingData(res.data);
      }

    } catch (err: any) {
      const data = err.response?.data;

      if (data?.invalidCaptcha) {
        setError("Wrong captcha — image refreshed. Please try again.");
        setCaptcha("");
        const courtName = buildCourtName(form);
        _captchaLoadedForSession  = courtName;
        captchaLoadingRef.current = false;
        loadCaptcha(courtName);
        setTimeout(() => captchaInputRef.current?.focus(), 600);
      } else if (data?.requiresCNR) {
        setRequiresCNR(data);
      } else if (data?.comingSoon) {
        setError(`${courtTypeConfig?.label} tracking is coming soon.`);
      } else {
        setError(data?.message || "Failed to fetch case data.");
        if (needsCaptchaInput) {
          const courtName = buildCourtName(form);
          _captchaLoadedForSession  = courtName;
          captchaLoadingRef.current = false;
          loadCaptcha(courtName);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Clear ──────────────────────────────────────────────────────
  const handleClear = () => {
    _captchaLoadedForSession  = "";
    captchaLoadingRef.current = false;
    setTrackingData(null);
    setRequiresCNR(null);
    setError("");
    setForm({ ...EMPTY_FORM });
    setCaptcha("");
    setCaptchaImage("");
    setCaptchaId("");
    setSessionCookie("");
    setComplexes([]);
    setCaseTypes([]);
  };

  // ── Derived values ─────────────────────────────────────────────
  const courtTypeConfig = COURT_TYPES.find((c) => c.id === form.courtType);
  const needsCaptcha    = courtNeedsCaptcha(form.courtType);
  const isTSHC          = form.courtType === "tshc";
  const isECourts       = form.courtType === "ecourts";

  const availableCaseTypes = isTSHC
    ? CASE_TYPES.map((t: any) => ({ code: String(t.mtype), name: t.label }))
    : caseTypes;

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');

        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        select option     { background: #1a0f06; color: #fff; }

        /* Brown + gold scrollbar */
        ::-webkit-scrollbar         { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track   { background: rgba(25,15,8,0.6); }
        ::-webkit-scrollbar-thumb   {
          background: linear-gradient(180deg, #c9a84c 0%, #8a6f2e 100%);
          border: 1px solid rgba(25,15,8,0.8);
        }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #e0bf63 0%, #a18534 100%); }

        /* Firefox */
        * { scrollbar-width: thin; scrollbar-color: #c9a84c rgba(25,15,8,0.6); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "36px 36px 8px",
        zIndex: 10,
        position: "relative",
      }}>
        <div style={{ flex: 1, marginRight: 48 }}>
          <p style={{
            ...DM,
            fontSize: 8,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: 6,
          }}>
            TELANGANA COURTS
          </p>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#23160c",
            marginTop: 0,
            lineHeight: 1,
          }}>
            CASE TRACKER
          </p>
        </div>
        <button
          onClick={() => navigate("/citizen/cases")}
          style={{
            ...DM,
            background: GOLD,
            color: "#111",
            fontSize: 13,
            fontWeight: 600,
            padding: "11px 22px",
            borderRadius: 11,
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          My Saved Cases
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{
        padding: "28px 28px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        margin: "0 auto",
        maxWidth: "92%",
        width: "100%",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}>

        {/* ── Input Form ── */}
        <div style={{ ...GLASS, borderRadius: 0, padding: "28px" }}>
          <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 20 }}>
            Enter Case Credentials
          </p>

          {/* ── Court Type Selector ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Court Type *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {COURT_TYPES.map((ct) => {
                const isActive = form.courtType === ct.id;
                return (
                  <button
                    key={ct.id}
                    onClick={() => handleCourtTypeChange(ct.id)}
                    style={{
                      ...DM,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "10px 18px",
                      borderRadius: 0,
                      cursor: "pointer",
                      border: isActive
                        ? "1px solid rgba(201,168,76,0.5)"
                        : "1px solid rgba(201,168,76,0.25)",
                      background: isActive ? "rgba(201,168,76,.12)" : "rgba(35,22,12,0.6)",
                      color: isActive ? GOLD : "rgba(255,255,255,.55)",
                      display: "flex", alignItems: "center", gap: 8,
                      transition: "all .15s",
                    }}
                  >
                    {ct.label}
                    {!ct.supported && (
                      <span style={{ ...DM, fontSize: 8, color: "rgba(201,168,76,.55)", letterSpacing: "0.8px" }}>
                        SOON
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {form.courtType && <ProviderBadge courtType={form.courtType} />}
          </div>

          {/* ── eCourts: District + Complex ── */}
          {isECourts && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={lbl}>District *</label>
                <select
                  value={form.distCode}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }}
                  disabled={loadingDistricts}
                >
                  <option value="">
                    {loadingDistricts ? "Loading districts..." : "Select district..."}
                  </option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Court Complex *</label>
                <select
                  value={form.complexCode}
                  onChange={(e) => handleComplexChange(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }}
                  disabled={!form.distCode || loadingComplexes}
                >
                  <option value="">
                    {!form.distCode
                      ? "Select district first..."
                      : loadingComplexes
                      ? "Loading complexes..."
                      : "Select court complex..."}
                  </option>
                  {complexes.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Case Type + Number + Year ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.6fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Case Type *</label>
              <select
                value={form.caseType}
                onChange={(e) => {
                  const selected = availableCaseTypes.find((t) => t.name === e.target.value);
                  setForm((f) => ({
                    ...f,
                    caseType: selected?.name      || "",
                    mtype:    selected ? parseInt(selected.code) : 0,
                  }));
                }}
                style={{ ...inp, cursor: "pointer" }}
                disabled={
                  !form.courtType ||
                  (isECourts && !form.complexCode) ||
                  loadingCaseTypes
                }
              >
                <option value="">
                  {!form.courtType
                    ? "Select court type first..."
                    : isECourts && !form.complexCode
                    ? "Select court complex first..."
                    : loadingCaseTypes
                    ? "Loading case types..."
                    : "Select case type..."}
                </option>
                {availableCaseTypes.map((t) => (
                  <option key={t.code} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Case Number *</label>
              <input
                value={form.caseNumber}
                onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
                placeholder="e.g. 1234"
                style={inp}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <div>
              <label style={lbl}>Year *</label>
              <select
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) }))}
                style={{ ...inp, cursor: "pointer" }}
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* ── CNR Number ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>
              CNR Number
              {isECourts ? " (recommended for District Courts)" : " (optional)"}
            </label>
            <input
              value={form.cnrNumber}
              onChange={(e) => setForm((f) => ({ ...f, cnrNumber: e.target.value.toUpperCase() }))}
              placeholder="e.g. TSHC010000012026 (16 characters)"
              maxLength={16}
              style={inp}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
            <p style={{ ...DM, fontSize: 10, color: "rgba(201,168,76,.5)", marginTop: 6 }}>
              {isECourts
                ? "CNR enables direct case lookup. Find it on your court filing receipt."
                : "CNR is printed on all court documents. Speeds up case lookup."}
            </p>
          </div>

          {/* ── Captcha ── */}
          {needsCaptcha && (
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>
                Captcha *
                {isECourts && (
                  <span style={{ color: "#34d399", marginLeft: 8, fontSize: 9, fontWeight: 400 }}>
                    (eCourts India)
                  </span>
                )}
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                {captchaLoading ? (
                  <div style={{
                    width: 140, height: 50, background: "rgba(255,255,255,.04)",
                    borderRadius: 0, border: "1px solid rgba(255,255,255,.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,.2)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%", animation: "spin 0.8s linear infinite",
                    }} />
                  </div>
                ) : captchaImage ? (
                  <img
                    src={captchaImage} alt="Captcha"
                    style={{
                      borderRadius: 0, border: "1px solid rgba(255,255,255,.15)",
                      maxHeight: 60, background: "#fff", padding: "2px",
                    }}
                  />
                ) : (
                  <div style={{
                    ...DM, fontSize: 12, color: "rgba(255,255,255,.3)",
                    padding: "12px 16px", background: "rgba(255,255,255,.03)",
                    borderRadius: 0, border: "1px solid rgba(255,255,255,.08)",
                  }}>
                    {isECourts && !form.complexCode
                      ? "Select court complex to load captcha"
                      : "No captcha loaded"}
                  </div>
                )}

                <button
                  onClick={() => {
                    const courtName = buildCourtName(form);
                    if (!courtName) return;
                    captchaLoadingRef.current = false;
                    _captchaLoadedForSession  = courtName;
                    loadCaptcha(courtName);
                  }}
                  disabled={isECourts && !form.complexCode}
                  style={{
                    ...DM, fontSize: 11,
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.1)",
                    color: "rgba(255,255,255,.5)", padding: "8px 14px",
                    borderRadius: 0,
                    cursor: isECourts && !form.complexCode ? "not-allowed" : "pointer",
                    opacity:  isECourts && !form.complexCode ? 0.4 : 1,
                  }}
                >
                  Refresh
                </button>
              </div>

              <input
                ref={captchaInputRef}
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="Enter captcha (case-insensitive)"
                style={inp}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />

              <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
                Case-insensitive. Click Refresh if image is unclear.
              </p>
            </div>
          )}

          {/* ── Track Button ── */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleTrack}
              disabled={loading || !courtTypeConfig?.supported}
              style={{
                ...DM,
                background: loading || !courtTypeConfig?.supported ? "rgba(201,168,76,.4)" : GOLD,
                color: "#111", fontSize: 13, fontWeight: 700,
                padding: "12px 28px", borderRadius: 0, border: "none",
                cursor: loading || !courtTypeConfig?.supported ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(17,17,17,.3)",
                    borderTop: "2px solid #111",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  Fetching...
                </>
              ) : "Track Case"}
            </button>

            {(trackingData || requiresCNR || error) && (
              <button
                onClick={handleClear}
                style={{
                  ...DM, background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.5)",
                  fontSize: 12, padding: "12px 20px", borderRadius: 0, cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              marginTop: 14, background: "rgba(239,68,68,.1)",
              border: "1px solid rgba(239,68,68,.25)",
              borderRadius: 0, padding: "11px 14px", ...DM, fontSize: 12, color: "#ef4444",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Coming Soon Banner ── */}
        {form.courtType && !courtTypeConfig?.supported && (
          <ComingSoonBanner courtType={form.courtType} />
        )}

        {/* ── CNR Required ── */}
        {requiresCNR && (
          <div style={{
            ...GLASS, borderRadius: 0, padding: "24px",
            border: "1px solid rgba(251,191,36,.2)", animation: "fadeUp .3s ease",
          }}>
            <p style={{ ...DM, fontSize: 15, fontWeight: 700, color: "#fbbf24", marginBottom: 12 }}>
              CNR Number Required for Live Tracking
            </p>
            <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 18, lineHeight: 1.8 }}>
              {requiresCNR.message}
            </p>
            {requiresCNR.instructions?.map((inst: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ color: "#fbbf24", flexShrink: 0, fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
                <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{inst}</p>
              </div>
            ))}
            <a href="https://services.ecourts.gov.in" target="_blank" rel="noreferrer"
              style={{ ...DM, fontSize: 13, color: BLUEB, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16 }}>
              Find your CNR on eCourts India
            </a>
          </div>
        )}

        {/* ── Cached Data Warning ── */}
        {trackingData?.isCached && (
          <div style={{
            background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)",
            borderRadius: 0, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>
                Showing Cached Data
              </p>
              <p style={{ ...DM, fontSize: 12, color: "rgba(251,191,36,.7)", lineHeight: 1.7 }}>
                {trackingData.message}
                {trackingData.cachedAt &&  `Last updated: ${formatDate(trackingData.cachedAt)}`}
              </p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {trackingData && !trackingData.requiresCNR && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .3s ease" }}>

            {/* Case Overview */}
            <div style={{ ...GLASS, borderRadius: 0, padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <p style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600, marginBottom: 4 }}>
                    {trackingData.source || trackingData.court}
                  </p>
                  <p style={{ ...BN, fontSize: 26, color: "#fff" }}>
                    {primary?.mainno ||
                      (trackingData.caseType && trackingData.caseNumber
                        ? `${trackingData.caseType} — ${trackingData.caseNumber}`
                        : "Case Details")}
                  </p>
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                    {trackingData.year && <>Year: {trackingData.year}</>}
                    {(trackingData.cnrNumber || primary?.cnrno) &&
                      `· CNR: ${trackingData.cnrNumber || primary?.cnrno}`}
                  </p>
                  {trackingData.provider && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      marginTop: 8, padding: "3px 10px", borderRadius: 99,
                      background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.2)",
                    }}>
                      <span style={{ ...DM, fontSize: 9, color: "#34d399", letterSpacing: "0.8px" }}>
                        via {trackingData.provider.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{
                  padding: "8px 18px", borderRadius: 99,
                  background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.25)",
                  flexShrink: 0, marginLeft: 16,
                }}>
                  <p style={{ ...DM, fontSize: 12, fontWeight: 700, color: "#34d399" }}>
                    {trackingData.caseStatus || primary?.casestatus || "Status Unavailable"}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {[
                  { label: "Petitioner",          value: trackingData.petitioner || primary?.petitioner },
                  { label: "Respondent",           value: trackingData.respondent || primary?.respondent },
                  { label: "Petitioner Advocate",  value: trackingData.rawData?.petAdvocate || primary?.petitioneradv },
                  { label: "Respondent Advocate",  value: trackingData.rawData?.resAdvocate || primary?.respondentadv || "Not Appointed" },
                  { label: "Filing Number",        value: trackingData.rawData?.filingNumber },
                  { label: "Next Hearing",         value: formatDate(trackingData.nextHearing || primary?.listingdate) },
                  { label: "Case Status",          value: trackingData.caseStatus || primary?.casestatus },
                  { label: "Judge",                value: trackingData.judge      || primary?.judges },
                  { label: "District",             value: trackingData.district   || primary?.district },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 0, padding: "14px 16px",
                  }}>
                    <p style={{ ...DM, fontSize: 9, letterSpacing: "1.3px", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 6 }}>
                      {item.label}
                    </p>
                    <p style={{ ...DM, fontSize: 13, color: item.value && item.value !== "—" ? "#fff" : "rgba(255,255,255,.3)", fontWeight: 500 }}>
                      {item.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Case History */}
            {trackingData.caseHistory && trackingData.caseHistory.length > 0 && (
              <div style={{ ...GLASS, borderRadius: 0, padding: "28px" }}>
                <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
                  Hearing History
                </p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {trackingData.caseHistory.map((h: any, i: number) => {
                    const isLast = i === trackingData.caseHistory.length - 1;
                    return (
                      <div key={i} style={{ display: "flex", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                          <div style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: BLUE, border: `2px solid ${BLUEB}`,
                            flexShrink: 0, marginTop: 4, boxShadow: `0 0 10px ${BLUE}`,
                          }} />
                          {!isLast && <div style={{ width: 2, flex: 1, minHeight: 32, background: "rgba(30,95,255,.2)", margin: "4px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff" }}>{h.purpose}</p>
                              {h.result && (
                                <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 3 }}>
                                  Result: {h.result}
                                </p>
                              )}
                            </div>
                            <p style={{ ...DM, fontSize: 11, color: BLUEB, flexShrink: 0, marginLeft: 12 }}>
                              {formatDate(h.date)}
                            </p>
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
                style={{ ...DM, background: "transparent", border: "1px solid rgba(201,168,76,0.4)", color: GOLD, fontSize: 12, fontWeight: 600, padding: "11px 22px", borderRadius: 0, cursor: "pointer" }}
              >
                Go to My Cases
              </button>
              <button
                onClick={handleTrack}
                style={{ ...DM, background: GOLD, border: "none", color: "#111", fontSize: 12, fontWeight: 600, padding: "11px 22px", borderRadius: 0, cursor: "pointer" }}
              >
                Refresh Status
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
