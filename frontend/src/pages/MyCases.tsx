import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSavedCases,
  addSavedCase,
  deleteSavedCase,
  getECourtsDistricts,
  getECourtsComplexes,
  getECourtsCaseTypes,
} from "../services/api";
import { CASE_TYPES } from "../constants/caseTypes";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#a8acd2";

const GLASS: CSSProperties = {
  background: "rgba(20, 30, 38, 0.55)",
  border: "1px solid rgba(201, 168, 76, 0.3)",
  boxShadow: "0 4px 24px rgba(0,0,0,.3)",
};

const GOLD = "#c9a84c";

const inp: CSSProperties = {
  ...DM,
  width: "100%",
  background: "rgba(15, 25, 35, 0.6)",
  border: "1px solid rgba(201,168,76,0.2)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .2s ease",
};

const lbl: CSSProperties = {
  ...DM,
  fontSize: 10,
  letterSpacing: "1.3px",
  textTransform: "uppercase",
  color: "rgba(201,168,76,.6)",
  marginBottom: 6,
  display: "block",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const COURT_TYPES = [
  { id: "tshc", label: "Telangana High Court", supported: true, provider: "TELANGANA_HC" },
  { id: "ecourts", label: "District Court", supported: true, provider: "ECOURTS" },
  { id: "consumer", label: "Consumer Court", supported: false, provider: "CONSUMER" },
  { id: "tribunal", label: "Tribunal", supported: false, provider: "TRIBUNAL" },
];

const EMPTY_FORM = {
  courtType: "",
  distCode: "",
  distName: "",
  complexCode: "",
  complexName: "",
  caseType: "",
  mtype: 0,
  caseNumber: "",
  year: CURRENT_YEAR,
  label: "",
  cnrNumber: "",
};

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

  const [savedCases, setSavedCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [districts, setDistricts] = useState<Array<{ code: string; name: string }>>([]);
  const [complexes, setComplexes] = useState<Array<{ code: string; name: string }>>([]);
  const [caseTypes, setCaseTypes] = useState<Array<{ code: string; name: string }>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingComplexes, setLoadingComplexes] = useState(false);
  const [loadingCaseTypes, setLoadingCaseTypes] = useState(false);

  useEffect(() => {
    loadSavedCases();
  }, []);

  useEffect(() => {
    document.body.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/cases.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => {
      document.body.style.backgroundImage = "";
    };
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

  const handleCourtTypeChange = (courtType: string) => {
    setForm({
      courtType,
      distCode: "",
      distName: "",
      complexCode: "",
      complexName: "",
      caseType: "",
      mtype: 0,
      caseNumber: "",
      year: CURRENT_YEAR,
      label: "",
      cnrNumber: "",
    });

    setComplexes([]);
    setCaseTypes([]);

    if (courtType === "ecourts") {
      loadDistricts();
    }
  };

  const handleDistrictChange = (distCode: string) => {
    const dist = districts.find((d) => d.code === distCode);
    setForm((f) => ({
      ...f,
      distCode,
      distName: dist?.name || "",
      complexCode: "",
      complexName: "",
      caseType: "",
      mtype: 0,
    }));
    setComplexes([]);
    setCaseTypes([]);

    if (distCode) loadComplexes(distCode);
  };

  const handleComplexChange = (complexCode: string) => {
    const complex = complexes.find((c) => c.code === complexCode);
    setForm((f) => ({
      ...f,
      complexCode,
      complexName: complex?.name || "",
      caseType: "",
      mtype: 0,
    }));
    setCaseTypes([]);

    if (complexCode && form.distCode) {
      loadCaseTypes(form.distCode, complexCode);
    }
  };

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
      if (!form.distCode) {
        setErrorMsg("Please select a district");
        return;
      }
      if (!form.complexCode) {
        setErrorMsg("Please select a court complex");
        return;
      }
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
        court: courtName,
        courtComplex: form.complexName || "",
        caseType: form.caseType,
        mtype: form.mtype,
        caseNumber: form.caseNumber.trim(),
        year: form.year,
        label: form.label.trim(),
        cnrNumber: form.cnrNumber.trim(),
        distCode: form.distCode,
        distName: form.distName,
        complexCode: form.complexCode,
        complexName: form.complexName,
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

  const handleTrack = (savedCase: any) => {
    navigate("/citizen/track", {
      state: {
        fromSaved: true,
        savedCaseId: savedCase._id,
        credentials: {
          court: savedCase.court,
          courtComplex: savedCase.courtComplex || "",
          caseType: savedCase.caseType,
          mtype: savedCase.mtype,
          caseNumber: savedCase.caseNumber,
          year: savedCase.year,
          cnrNumber: savedCase.cnrNumber || "",
          distCode: savedCase.distCode || "",
          distName: savedCase.distName || "",
          complexCode: savedCase.complexCode || "",
          complexName: savedCase.complexName || "",
        },
      },
    });
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "TELANGANA_HC":
        return { label: "HC Portal", color: "#a78bfa" };
      case "ECOURTS":
        return { label: "eCourts", color: "#34d399" };
      case "CONSUMER_COURT":
        return { label: "CONFONET", color: "#fbbf24" };
      default:
        return { label: "Unknown", color: "#94a3b8" };
    }
  };

  const courtTypeConfigSelected = COURT_TYPES.find((c) => c.id === form.courtType);
  const isTSHC = form.courtType === "tshc";
  const isECourts = form.courtType === "ecourts";

  const availableCaseTypes = isTSHC
    ? CASE_TYPES.map((t: any) => ({ code: String(t.mtype), name: t.label }))
    : caseTypes;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(30,95,255,.3); border-radius: 3px; }
        select option { background: rgba(15, 25, 35, 0.6); color: #fff; }
        input:focus, select:focus {
          border-color: rgba(201,168,76,.55) !important;
          box-shadow: 0 0 0 1px rgba(201,168,76,.15) !important;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "36px 36px 8px",
          zIndex: 10,
          position: "relative",
        }}
      >
        <div>
          <p
            style={{
              ...DM,
              fontSize: 8,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 6,
            }}
          >
            MY CASES
          </p>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgb(20, 30, 38)", marginTop: 0, lineHeight: 1 }}>
            Saved Cases
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setErrorMsg("");
          }}
          style={{
            ...DM,
            background: showForm ? "transparent" : GOLD,
            color: showForm ? GOLD : "#111",
            fontSize: 13,
            fontWeight: 600,
            padding: "11px 22px",
            borderRadius: 11,
            border: showForm ? `1px solid rgba(201,168,76,0.4)` : "none",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ Save New Case"}
        </button>
      </div>

      <div
        style={{
          padding: "28px 28px 60px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          margin: "0 auto",
          maxWidth: "92%",
          width: "100%",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      >

        {successMsg && (
          <div
            style={{
              ...DM,
              fontSize: 13,
              background: "rgba(20, 30, 38, 0.55)",
              border: "1px solid rgba(52,211,153,.25)",
              borderRadius: 0,
              padding: "12px 16px",
              color: "#34d399",
            }}
          >
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div
            style={{
              ...DM,
              fontSize: 13,
              background: "rgba(20, 30, 38, 0.55)",
              border: "1px solid rgba(201, 168, 76, 0.3)",
              borderLeftWidth: 2,
              borderLeftColor: "rgba(201,168,76,0.5)",
              borderRadius: 0,
              padding: "12px 16px",
              color: GOLD,
            }}
          >
            {errorMsg}
          </div>
        )}

        {showForm && (
          <div
            style={{
              ...GLASS,
              border: "1px solid rgba(201, 168, 76, 0.3)",
              borderRadius: 0,
              padding: "28px",
              animation: "fadeUp .25s ease",
            }}
          >
            <p
              style={{
                ...DM,
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 20,
                color: GOLD,
              }}
            >
              Save Court Case Credentials
            </p>

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
                        opacity: ct.supported ? 1 : 0.5,
                        border: isActive
                          ? "1px solid rgba(201,168,76,0.5)"
                          : "1px solid rgba(255,255,255,0.15)",
                        background: isActive
                          ? "rgba(201,168,76,.12)"
                          : "rgba(255,255,255,.04)",
                        color: isActive ? GOLD : "rgba(255,255,255,.55)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all .15s",
                      }}
                    >
                      {ct.label}
                      {!ct.supported && (
                        <span
                          style={{
                            ...DM,
                            fontSize: 8,
                            color: "rgba(201,168,76,.55)",
                            letterSpacing: "0.8px",
                          }}
                        >
                          SOON
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {isECourts && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label style={lbl}>District *</label>
                  <select
                    value={form.distCode}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    style={{ ...inp, cursor: "pointer" }}
                    disabled={loadingDistricts}
                  >
                    <option value="">
                      {loadingDistricts
                        ? "Loading districts..."
                        : "Select district..."}
                    </option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
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
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={lbl}>Case Type *</label>
                <select
                  value={form.caseType}
                  onChange={(e) => {
                    const selected = availableCaseTypes.find(
                      (t) => t.name === e.target.value
                    );
                    setForm((f) => ({
                      ...f,
                      caseType: selected?.name || "",
                      mtype: selected ? parseInt(selected.code) : 0,
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
                    <option key={t.code} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Year *</label>
                <select
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: parseInt(e.target.value),
                    }))
                  }
                  style={{ ...inp, cursor: "pointer" }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={lbl}>Case Number *</label>
                <input
                  value={form.caseNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, caseNumber: e.target.value }))
                  }
                  placeholder="e.g. 1234"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Label / Nickname (optional)</label>
                <input
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                  placeholder="e.g. Property dispute"
                  style={inp}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>CNR Number (optional)</label>
              <input
                value={form.cnrNumber}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cnrNumber: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="16-character CNR e.g. TSHC010000012026"
                maxLength={16}
                style={inp}
              />
              <p
                style={{
                  ...DM,
                  fontSize: 10,
                  color: "rgba(168,200,255,.5)",
                  marginTop: 6,
                }}
              >
                Find your CNR on court filing receipt. Enables real-time
                tracking.
              </p>
            </div>

            <div
              style={{
                background: "rgba(30,95,255,.07)",
                border: "1px solid rgba(30,95,255,.15)",
                borderRadius: 9,
                padding: "10px 14px",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  ...DM,
                  fontSize: 11,
                  color: "rgba(168,200,255,.6)",
                  lineHeight: 1.7,
                }}
              >
                Enter credentials exactly as they appear on your court
                documents.
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
                style={{
                  ...DM,
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  background: GOLD,
                  border: "none",
                  color: "#111",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                style={{
                  ...DM,
                  flex: 2,
                  padding: "11px",
                  borderRadius: 10,
                  background: submitting ? "rgba(201,168,76,.4)" : GOLD,
                  border: "none",
                  color: "#111",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(17,17,17,.3)",
                        borderTop: "2px solid #111",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Saving...
                  </>
                ) : (
                  "Save Case"
                )}
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {[
            { label: "Total Saved", value: savedCases.length },
            {
              label: "Courts",
              value: new Set(savedCases.map((c) => c.court)).size,
            },
            {
              label: "Years Span",
              value:
                savedCases.length > 0
                  ? `${Math.min(...savedCases.map((c) => c.year))} – ${Math.max(...savedCases.map((c) => c.year))}`
                  : "-",
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                ...GLASS,
                borderRadius: 0,
                padding: "18px 22px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "rgba(201, 168, 76, 0.3)",
                }}
              />
              <p
                style={{
                  ...DM,
                  fontSize: 9,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#7aa8c0",
                  marginBottom: 8,
                }}
              >
                {stat.label}
              </p>
              <p style={{ ...BN, fontSize: 28, color: GOLD }}>
                {typeof stat.value === "number"
                  ? String(stat.value).padStart(2, "0")
                  : stat.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ ...GLASS, borderRadius: 0, padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid rgba(30,95,255,.2)`,
                  borderTop: `3px solid ${BLUE}`,
                  borderRadius: "50%",
                  animation: "spin 0.9s linear infinite",
                  margin: "0 auto 14px",
                }}
              />
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                Loading...
              </p>
            </div>
          ) : savedCases.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "56px 20px",
                border: "1px solid rgba(201, 168, 76, 0.3)",
                borderRadius: 0,
                background: "rgba(20, 30, 38, 0.55)",
              }}
            >
              <p style={{ fontSize: 40, marginBottom: 14 }}></p>
              <p
                style={{
                  ...DM,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.5)",
                  marginBottom: 8,
                }}
              >
                No saved cases yet
              </p>
              <p
                style={{
                  ...DM,
                  fontSize: 13,
                  color: "rgba(255,255,255,.25)",
                  lineHeight: 1.7,
                  maxWidth: 380,
                  margin: "0 auto 20px",
                }}
              >
                Save your court case credentials to track case status quickly.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  ...DM,
                  background: GOLD,
                  color: "#111",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "11px 24px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Save Your First Case
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 0.6fr 0.8fr 1fr",
                  gap: 12,
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                  marginBottom: 8,
                }}
              >
                {["Court", "Case Type", "Case No.", "Year", "CNR", "Actions"].map(
                  (h) => (
                    <p
                      key={h}
                      style={{
                        ...DM,
                        fontSize: 9,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,.25)",
                      }}
                    >
                      {h}
                    </p>
                  )
                )}
              </div>

              {savedCases.map((sc, i) => {
                const badge = getProviderBadge(sc.provider || "TELANGANA_HC");
                return (
                  <div
                    key={sc._id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 0.6fr 0.8fr 1fr",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 10,
                      background:
                        i % 2 === 0
                          ? "rgba(255,255,255,.03)"
                          : "transparent",
                      border: "1px solid transparent",
                      alignItems: "center",
                      marginBottom: 4,
                      opacity: deletingId === sc._id ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLElement
                      ).style.background = "rgba(30,95,255,.07)";
                      (
                        e.currentTarget as HTMLElement
                      ).style.border = "1px solid rgba(30,95,255,.15)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLElement
                      ).style.background =
                        i % 2 === 0
                          ? "rgba(255,255,255,.03)"
                          : "transparent";
                      (
                        e.currentTarget as HTMLElement
                      ).style.border = "1px solid transparent";
                    }}
                  >
                    <div>
                      <p
                        style={{
                          ...DM,
                          fontSize: 12,
                          color: "#fff",
                          fontWeight: 500,
                        }}
                      >
                        {sc.court}
                      </p>
                      {sc.courtComplex && (
                        <p
                          style={{
                            ...DM,
                            fontSize: 10,
                            color: "rgba(255,255,255,.35)",
                            marginTop: 2,
                          }}
                        >
                          {sc.courtComplex}
                        </p>
                      )}
                      {sc.label && (
                        <p
                          style={{
                            ...DM,
                            fontSize: 10,
                            color: BLUEB,
                            marginTop: 2,
                          }}
                        >
                          {sc.label}
                        </p>
                      )}
                      <span
                        style={{
                          ...DM,
                          fontSize: 9,
                          fontWeight: 600,
                          color: badge.color,
                          background: `${badge.color}18`,
                          border: `1px solid ${badge.color}30`,
                          padding: "2px 8px",
                          borderRadius: 99,
                          display: "inline-block",
                          marginTop: 4,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p
                      style={{
                        ...DM,
                        fontSize: 12,
                        color: "rgba(255,255,255,.6)",
                      }}
                    >
                      {sc.caseType}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 12,
                        color: BLUEB,
                        fontWeight: 600,
                        fontFamily: "monospace",
                      }}
                    >
                      {sc.caseNumber}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 12,
                        color: "rgba(255,255,255,.6)",
                      }}
                    >
                      {sc.year}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 10,
                        color: sc.cnrNumber
                          ? "#34d399"
                          : "rgba(255,255,255,.2)",
                        fontFamily: "monospace",
                      }}
                    >
                      {sc.cnrNumber || "-"}
                    </p>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleTrack(sc)}
                        style={{
                          ...DM,
                          background: BLUE,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "7px 14px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Track
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(sc._id, sc.label || sc.caseNumber)
                        }
                        disabled={deletingId === sc._id}
                        style={{
                          ...DM,
                          background: "rgba(239,68,68,.1)",
                          color: "#ef4444",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "7px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(239,68,68,.2)",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div
          style={{
            ...GLASS,
            borderRadius: 0,
            padding: "22px 24px",
          }}
        >
          <p
            style={{
              ...DM,
              fontSize: 13,
              fontWeight: 700,
              color: GOLD,
              marginBottom: 14,
            }}
          >
            How Saved Cases Work
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {[
              {
                icon: "",
                title: "Save Credentials",
                desc: "Enter court, case type, number, year. For district courts, select the correct court complex.",
              },
              {
                icon: "",
                title: "Add CNR for Live Data",
                desc: "CNR number (on court documents) enables real-time tracking.",
              },
              {
                icon: "",
                title: "Track Anytime",
                desc: "Click Track to fetch latest status, hearing dates and case history.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p
                    style={{
                      ...DM,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      ...DM,
                      fontSize: 11,
                      color: "rgba(255,255,255,.4)",
                      lineHeight: 1.7,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
