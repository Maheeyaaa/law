// frontend/src/pages/MyCases.tsx
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import {
  getSavedCases,
  addSavedCase,
  deleteSavedCase,
  getECourtsDistricts,
  getECourtsComplexes,
  getECourtsCaseTypes,
} from "../services/api";
import { CASE_TYPES } from "../constants/caseTypes";

const DM:  CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN:  CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE  = "#1e5fff";
const BLUEB = "#4d8aff";

const GLASS: CSSProperties = {
  background:           "rgba(0,0,0,0.45)",
  backdropFilter:       "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:               "1px solid rgba(255,255,255,0.06)",
  boxShadow:            "0 8px 32px rgba(0,0,0,.6)",
};

const inp: CSSProperties = {
  ...DM, width: "100%",
  background:   "rgba(255,255,255,.05)",
  border:       "1px solid rgba(30,95,255,.2)",
  borderRadius: 10, padding: "10px 14px",
  color: "#fff", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

const lbl: CSSProperties = {
  ...DM, fontSize: 10, letterSpacing: "1.3px",
  textTransform: "uppercase",
  color:         "rgba(255,255,255,.3)",
  marginBottom:  6, display: "block",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

// ✅ Court Types (same as TrackStatus)
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
  label:        "",
  cnrNumber:    "",
};

// ✅ Build court name same way as TrackStatus
function buildCourtName(form: typeof EMPTY_FORM): string {
  if (form.courtType === "tshc") return "Telangana High Court, Hyderabad";
  if (form.courtType === "ecourts" && form.distName) {
    return form.complexName
      ? `${form.complexName}, ${form.distName}`
      : `District Court, ${form.distName}`;
  }
  return "";
}

export default function MyCases() {
  const navigate = useNavigate();

  const [savedCases,  setSavedCases]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState("");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [form,        setForm]        = useState({ ...EMPTY_FORM });

  // ✅ Dropdown data states (same as TrackStatus)
  const [districts,        setDistricts]        = useState<Array<{ code: string; name: string }>>([]);
  const [complexes,        setComplexes]        = useState<Array<{ code: string; name: string }>>([]);
  const [caseTypes,        setCaseTypes]        = useState<Array<{ code: string; name: string }>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingComplexes, setLoadingComplexes] = useState(false);
  const [loadingCaseTypes, setLoadingCaseTypes] = useState(false);

  useEffect(() => { loadSavedCases(); }, []);

  useEffect(() => {
    document.body.style.backgroundImage      = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize       = "cover";
    document.body.style.backgroundPosition   = "center";
    document.body.style.backgroundRepeat     = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  const loadSavedCases = async () => {
    try {
      setLoading(true);
      const res = await getSavedCases();
      setSavedCases(res.data.savedCases || []);
    } catch {
      setErrorMsg("Failed to load saved cases");
    } finally {
      setLoading(false);
    }
  };

  // ── Load Districts ──────────────────────────────────────────────
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

  // ── Load Court Complexes ────────────────────────────────────────
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

  // ── Load Case Types ─────────────────────────────────────────────
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

  // ── Court Type change ───────────────────────────────────────────
  const handleCourtTypeChange = (courtType: string) => {
    setForm({
      courtType,
      distCode:    "",
      distName:    "",
      complexCode: "",
      complexName: "",
      caseType:    "",
      mtype:       0,
      caseNumber:  "",
      year:        CURRENT_YEAR,
      label:       "",
      cnrNumber:   "",
    });

    setComplexes([]);
    setCaseTypes([]);

    if (courtType === "ecourts") {
      loadDistricts();
    }
  };

  // ── District change ─────────────────────────────────────────────
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

    if (distCode) loadComplexes(distCode);
  };

  // ── Complex change ──────────────────────────────────────────────
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

    if (complexCode && form.distCode) {
      loadCaseTypes(form.distCode, complexCode);
    }
  };

  // ── Add saved case ──────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.courtType) {
      setErrorMsg("Please select a court type");
      return;
    }

    const courtTypeConfig = COURT_TYPES.find((c) => c.id === form.courtType);
    if (!courtTypeConfig?.supported) {
      setErrorMsg(`${courtTypeConfig?.label} support is coming soon`);
      return;
    }

    if (form.courtType === "ecourts") {
      if (!form.distCode)    { setErrorMsg("Please select a district");      return; }
      if (!form.complexCode) { setErrorMsg("Please select a court complex"); return; }
    }

    if (!form.caseType || !form.caseNumber || !form.year) {
      setErrorMsg("Please fill case type, number, and year");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const courtName = buildCourtName(form);

      const res = await addSavedCase({
        court:        courtName,
        courtComplex: form.complexName || "",
        caseType:     form.caseType,
        mtype:        form.mtype,
        caseNumber:   form.caseNumber.trim(),
        year:         form.year,
        label:        form.label.trim(),
        cnrNumber:    form.cnrNumber.trim(),
        // ✅ NEW — eCourts hierarchy
        distCode:     form.distCode,
        distName:     form.distName,
        complexCode:  form.complexCode,
        complexName:  form.complexName,
      });

      setSavedCases((prev) => [res.data.savedCase, ...prev]);
      setSuccessMsg("Case saved successfully!");
      setForm({ ...EMPTY_FORM });
      setComplexes([]);
      setCaseTypes([]);
      setShowForm(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to save case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Remove "${label || "this case"}" from saved cases?`)) return;
    setDeletingId(id);
    try {
      await deleteSavedCase(id);
      setSavedCases((prev) => prev.filter((c) => c._id !== id));
      setSuccessMsg("Case removed");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch {
      setErrorMsg("Failed to delete case");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Navigate to Track Status (with full credentials) ───────────
  const handleTrack = (savedCase: any) => {
    navigate("/citizen/track", {
      state: {
        fromSaved:   true,
        savedCaseId: savedCase._id,
        credentials: {
          court:        savedCase.court,
          courtComplex: savedCase.courtComplex || "",
          caseType:     savedCase.caseType,
          mtype:        savedCase.mtype,
          caseNumber:   savedCase.caseNumber,
          year:         savedCase.year,
          cnrNumber:    savedCase.cnrNumber || "",
          // ✅ NEW — restore eCourts hierarchy
          distCode:     savedCase.distCode    || "",
          distName:     savedCase.distName    || "",
          complexCode:  savedCase.complexCode || "",
          complexName:  savedCase.complexName || "",
        },
      },
    });
  };

  // ── Provider badge helper ───────────────────────────────────────
  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "TELANGANA_HC":  return { label: "HC Portal",  color: "#a78bfa" };
      case "ECOURTS":        return { label: "eCourts",    color: "#34d399" };
      case "CONSUMER_COURT": return { label: "CONFONET",   color: "#fbbf24" };
      default:               return { label: "Unknown",    color: "#94a3b8" };
    }
  };

  const courtTypeConfig = COURT_TYPES.find((c) => c.id === form.courtType);
  const isTSHC          = form.courtType === "tshc";
  const isECourts       = form.courtType === "ecourts";

  // Available case types based on selection
  const availableCaseTypes = isTSHC
    ? CASE_TYPES.map((t: any) => ({ code: String(t.mtype), name: t.label }))
    : caseTypes;

  return (
    <CitizenLayout activeNav="cases">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(30,95,255,.3); border-radius: 3px; }
        select option { background: #0a0f2c; color: #fff; }
      `}</style>

      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>
              MY CASES
            </p>
            <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Saved Cases</p>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 6, lineHeight: 1.6 }}>
              Save your court case credentials to quickly track them anytime.
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setErrorMsg(""); }}
            style={{
              ...DM,
              background: showForm ? "rgba(255,255,255,.07)" : BLUE,
              color: "#fff", fontSize: 13, fontWeight: 600,
              padding: "11px 22px", borderRadius: 11,
              border: showForm ? "1px solid rgba(255,255,255,.12)" : "none",
              cursor: "pointer",
            }}
          >
            {showForm ? "✕ Cancel" : "+ Save New Case"}
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div style={{ ...DM, fontSize: 13, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", borderRadius: 10, padding: "12px 16px", color: "#34d399" }}>
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ ...DM, fontSize: 13, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "12px 16px", color: "#ef4444" }}>
            ✕ {errorMsg}
          </div>
        )}

        {/* ── Add Case Form ── */}
        {showForm && (
          <div style={{ ...GLASS, borderRadius: 18, padding: "28px", animation: "fadeUp .25s ease", border: "1px solid rgba(30,95,255,.25)" }}>
            <p style={{ ...DM, fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#fff" }}>
              📁 Save Court Case Credentials
            </p>

            {/* ── Court Type Pills ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Court Type *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {COURT_TYPES.map((ct) => {
                  const isActive = form.courtType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => handleCourtTypeChange(ct.id)}
                      disabled={!ct.supported}
                      style={{
                        ...DM,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "10px 18px",
                        borderRadius: 10,
                        cursor: ct.supported ? "pointer" : "not-allowed",
                        opacity:  ct.supported ? 1 : 0.5,
                        border: isActive
                          ? `1.5px solid ${BLUE}`
                          : "1px solid rgba(255,255,255,.1)",
                        background: isActive ? "rgba(30,95,255,.18)" : "rgba(255,255,255,.04)",
                        color: isActive ? "#fff" : "rgba(255,255,255,.55)",
                        display: "flex", alignItems: "center", gap: 8,
                        transition: "all .15s",
                      }}
                    >
                      {ct.label}
                      {!ct.supported && (
                        <span style={{ ...DM, fontSize: 8, color: "#fbbf24", letterSpacing: "0.8px" }}>
                          SOON
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
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

            {/* ── Case Type + Year ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Case Type *</label>
                <select
                  value={form.caseType}
                  onChange={(e) => {
                    const selected = availableCaseTypes.find((t) => t.name === e.target.value);
                    setForm((f) => ({
                      ...f,
                      caseType: selected?.name || "",
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

            {/* ── Case Number + Label ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Case Number *</label>
                <input
                  value={form.caseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
                  placeholder="e.g. 1234"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Label / Nickname (optional)</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Property dispute"
                  style={inp}
                />
              </div>
            </div>

            {/* ── CNR ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>CNR Number (optional)</label>
              <input
                value={form.cnrNumber}
                onChange={(e) => setForm((f) => ({ ...f, cnrNumber: e.target.value.toUpperCase() }))}
                placeholder="16-character CNR e.g. TSHC010000012026"
                maxLength={16}
                style={inp}
              />
              <p style={{ ...DM, fontSize: 10, color: "rgba(168,200,255,.5)", marginTop: 6 }}>
                💡 Find your CNR on court filing receipt. Enables real-time tracking.
              </p>
            </div>

            <div style={{ background: "rgba(30,95,255,.07)", border: "1px solid rgba(30,95,255,.15)", borderRadius: 9, padding: "10px 14px", marginBottom: 20 }}>
              <p style={{ ...DM, fontSize: 11, color: "rgba(168,200,255,.6)", lineHeight: 1.7 }}>
                💡 Enter credentials exactly as they appear on your court documents.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  setErrorMsg("");
                  setForm({ ...EMPTY_FORM });
                  setComplexes([]);
                  setCaseTypes([]);
                }}
                style={{ ...DM, flex: 1, padding: "11px", borderRadius: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                style={{ ...DM, flex: 2, padding: "11px", borderRadius: 10, background: submitting ? "rgba(30,95,255,.4)" : BLUE, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {submitting ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Saving...
                  </>
                ) : "💾 Save Case"}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Total Saved", value: savedCases.length },
            { label: "Courts",      value: new Set(savedCases.map((c) => c.court)).size },
            { label: "Years Span",  value: savedCases.length > 0 ? `${Math.min(...savedCases.map((c) => c.year))} – ${Math.max(...savedCases.map((c) => c.year))}` : "—" },
          ].map((stat, i) => (
            <div key={i} style={{ ...GLASS, borderRadius: 14, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BLUE }} />
              <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 8 }}>
                {stat.label}
              </p>
              <p style={{ ...BN, fontSize: 28, color: "#fff" }}>
                {typeof stat.value === "number" ? String(stat.value).padStart(2, "0") : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Cases List */}
        <div style={{ ...GLASS, borderRadius: 18, padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ width: 36, height: 36, border: `3px solid rgba(30,95,255,.2)`, borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 14px" }} />
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading...</p>
            </div>
          ) : savedCases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 20px" }}>
              <p style={{ fontSize: 40, marginBottom: 14 }}>📁</p>
              <p style={{ ...DM, fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>
                No saved cases yet
              </p>
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.25)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 20px" }}>
                Save your court case credentials to track case status quickly.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{ ...DM, background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "11px 24px", borderRadius: 10, border: "none", cursor: "pointer" }}
              >
                + Save Your First Case
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.6fr 0.8fr 1fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 8 }}>
                {["Court", "Case Type", "Case No.", "Year", "CNR", "Actions"].map((h) => (
                  <p key={h} style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.25)" }}>
                    {h}
                  </p>
                ))}
              </div>

              {/* Rows */}
              {savedCases.map((sc, i) => {
                const badge = getProviderBadge(sc.provider || "TELANGANA_HC");
                return (
                  <div
                    key={sc._id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 0.6fr 0.8fr 1fr",
                      gap: 12, padding: "14px 16px", borderRadius: 10,
                      background: i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent",
                      border: "1px solid transparent",
                      alignItems: "center", marginBottom: 4,
                      opacity: deletingId === sc._id ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.07)";
                      (e.currentTarget as HTMLElement).style.border = "1px solid rgba(30,95,255,.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent";
                      (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                    }}
                  >
                    <div>
                      <p style={{ ...DM, fontSize: 12, color: "#fff", fontWeight: 500 }}>
                        {sc.court}
                      </p>
                      {sc.courtComplex && (
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 2 }}>
                          📍 {sc.courtComplex}
                        </p>
                      )}
                      {sc.label && (
                        <p style={{ ...DM, fontSize: 10, color: BLUEB, marginTop: 2 }}>
                          🏷 {sc.label}
                        </p>
                      )}
                      <span style={{
                        ...DM, fontSize: 9, fontWeight: 600,
                        color: badge.color,
                        background: `${badge.color}18`,
                        border: `1px solid ${badge.color}30`,
                        padding: "2px 8px", borderRadius: 99,
                        display: "inline-block", marginTop: 4,
                      }}>
                        {badge.label}
                      </span>
                    </div>

                    <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)" }}>
                      {sc.caseType}
                    </p>

                    <p style={{ ...DM, fontSize: 12, color: BLUEB, fontWeight: 600, fontFamily: "monospace" }}>
                      {sc.caseNumber}
                    </p>

                    <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)" }}>
                      {sc.year}
                    </p>

                    <p style={{ ...DM, fontSize: 10, color: sc.cnrNumber ? "#34d399" : "rgba(255,255,255,.2)", fontFamily: "monospace" }}>
                      {sc.cnrNumber || "—"}
                    </p>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleTrack(sc)}
                        style={{ ...DM, background: BLUE, color: "#fff", fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        🔍 Track
                      </button>
                      <button
                        onClick={() => handleDelete(sc._id, sc.label || sc.caseNumber)}
                        disabled={deletingId === sc._id}
                        style={{ ...DM, background: "rgba(239,68,68,.1)", color: "#ef4444", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.2)", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* How it works */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "22px 24px", border: "1px solid rgba(30,95,255,.15)" }}>
          <p style={{ ...DM, fontSize: 13, fontWeight: 700, color: BLUEB, marginBottom: 14 }}>
            💡 How Saved Cases Work
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "💾", title: "Save Credentials",    desc: "Enter court, case type, number, year. For district courts, select the correct court complex." },
              { icon: "🔑", title: "Add CNR for Live Data", desc: "CNR number (on court documents) enables real-time tracking." },
              { icon: "🔍", title: "Track Anytime",        desc: "Click Track to fetch latest status, hearing dates and case history." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                    {item.title}
                  </p>
                  <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", lineHeight: 1.7 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </CitizenLayout>
  );
}