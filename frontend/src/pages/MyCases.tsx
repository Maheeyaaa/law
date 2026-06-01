// frontend/src/pages/MyCases.tsx
import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import {
  getSavedCases,
  addSavedCase,
  deleteSavedCase,
} from "../services/api";
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
  "District Court, Jogulamba Gadwal",
  "District Court, Narayanpet",
  "District Court, Mulugu",
  "District Court, Jayashankar Bhupalpally",
  "District Court, Bhadradri Kothagudem",
  "Telangana State Consumer Disputes Redressal Commission",
  "Telangana Administrative Tribunal",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const inp: CSSProperties = {
  ...DM,
  width: "100%",
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(30,95,255,.2)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const lbl: CSSProperties = {
  ...DM,
  fontSize: 10,
  letterSpacing: "1.3px",
  textTransform: "uppercase",
  color: "rgba(255,255,255,.3)",
  marginBottom: 6,
  display: "block",
};

export default function MyCases() {
  const navigate = useNavigate();

  const [savedCases, setSavedCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    court: "",
    caseType: "",
    mtype: 0,
    caseNumber: "",
    year: CURRENT_YEAR,
    label: "",
    cnrNumber: "",
  });

  useEffect(() => { loadSavedCases(); }, []);

  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
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

  const resetForm = () => ({
    court: "",
    caseType: "",
    mtype: 0,
    caseNumber: "",
    year: CURRENT_YEAR,
    label: "",
    cnrNumber: "",
  });

  const handleAdd = async () => {
    if (!form.court || !form.caseType || !form.caseNumber || !form.year) {
      setErrorMsg("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await addSavedCase({
        court:      form.court,
        caseType:   form.caseType,
        mtype:      form.mtype,
        caseNumber: form.caseNumber.trim(),
        year:       form.year,
        label:      form.label.trim(),
        cnrNumber:  form.cnrNumber.trim(),
      });
      setSavedCases((prev) => [res.data.savedCase, ...prev]);
      setSuccessMsg("Case saved successfully!");
      setForm(resetForm());
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
        fromSaved:    true,
        savedCaseId:  savedCase._id,
        credentials: {
          court:      savedCase.court,
          caseType:   savedCase.caseType,
          mtype:      savedCase.mtype,
          caseNumber: savedCase.caseNumber,
          year:       savedCase.year,
          cnrNumber:  savedCase.cnrNumber || "",
        },
      },
    });
  };

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
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>MY CASES</p>
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
              cursor: "pointer", transition: "all .2s",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {showForm ? "✕ Cancel" : "+ Save New Case"}
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div style={{ ...DM, fontSize: 13, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", borderRadius: 10, padding: "12px 16px", color: "#34d399", animation: "fadeUp .2s ease" }}>
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ ...DM, fontSize: 13, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "12px 16px", color: "#ef4444", animation: "fadeUp .2s ease" }}>
            ✕ {errorMsg}
          </div>
        )}

        {/* Add Case Form */}
        {showForm && (
          <div style={{ ...GLASS, borderRadius: 18, padding: "28px", animation: "fadeUp .25s ease", border: "1px solid rgba(30,95,255,.25)" }}>
            <p style={{ ...DM, fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#fff" }}>
              📁 Save Court Case Credentials
            </p>

            {/* Row 1: Court (full width) */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Court *</label>
              <select
                value={form.court}
                onChange={(e) => setForm((f) => ({ ...f, court: e.target.value }))}
                style={{ ...inp, cursor: "pointer" }}
              >
                <option value="">Select court...</option>
                {TELANGANA_COURTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Row 2: Case Type + Year */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
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
                  style={inp}
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
                <label style={lbl}>Year *</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) }))}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Case Number + Label */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Case Number *</label>
                <input
                  value={form.caseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
                  placeholder="e.g. 1/2026"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Label / Nickname (optional)</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Property dispute case"
                  style={inp}
                />
              </div>
            </div>

            {/* Row 4: CNR Number (full width) */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>CNR Number (optional — required for live tracking)</label>
              <input
                value={form.cnrNumber}
                onChange={(e) => setForm((f) => ({ ...f, cnrNumber: e.target.value.toUpperCase() }))}
                placeholder="e.g. TSHC010000012026 (16 characters)"
                maxLength={16}
                style={inp}
              />
              <p style={{ ...DM, fontSize: 10, color: "rgba(168,200,255,.5)", marginTop: 6 }}>
                💡 Find your CNR on your court filing receipt or hearing notice. Required for live status tracking.
              </p>
            </div>

            {/* Info note */}
            <div style={{ background: "rgba(30,95,255,.07)", border: "1px solid rgba(30,95,255,.15)", borderRadius: 9, padding: "10px 14px", marginBottom: 20 }}>
              <p style={{ ...DM, fontSize: 11, color: "rgba(168,200,255,.6)", lineHeight: 1.7 }}>
                💡 Enter credentials exactly as they appear on your court documents.
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setShowForm(false); setErrorMsg(""); }}
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
            { label: "Courts", value: new Set(savedCases.map((c) => c.court)).size },
            { label: "Years Span", value: savedCases.length > 0 ? `${Math.min(...savedCases.map((c) => c.year))} – ${Math.max(...savedCases.map((c) => c.year))}` : "—" },
          ].map((stat, i) => (
            <div key={i} style={{ ...GLASS, borderRadius: 14, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BLUE }} />
              <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 8 }}>{stat.label}</p>
              <p style={{ ...BN, fontSize: 28, color: "#fff" }}>
                {typeof stat.value === "number" ? String(stat.value).padStart(2, "0") : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Cases List */}
        <div style={{ ...GLASS, borderRadius: 18, padding: "24px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ width: 36, height: 36, border: `3px solid rgba(30,95,255,.2)`, borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 14px" }} />
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.4)" }}>Loading saved cases...</p>
            </div>
          ) : savedCases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 20px" }}>
              <p style={{ fontSize: 40, marginBottom: 14 }}>📁</p>
              <p style={{ ...DM, fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>No saved cases yet</p>
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
                  <p key={h} style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.25)" }}>{h}</p>
                ))}
              </div>

              {/* Rows */}
              {savedCases.map((sc, i) => (
                <div
                  key={sc._id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 0.6fr 0.8fr 1fr",
                    gap: 12, padding: "14px 16px", borderRadius: 10,
                    background: i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent",
                    border: "1px solid transparent",
                    alignItems: "center", marginBottom: 4,
                    transition: "all .15s ease",
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
                  {/* Court */}
                  <div>
                    <p style={{ ...DM, fontSize: 12, color: "#fff", fontWeight: 500 }}>{sc.court}</p>
                    {sc.label && <p style={{ ...DM, fontSize: 10, color: BLUEB, marginTop: 2 }}>🏷 {sc.label}</p>}
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 2 }}>
                      Added {new Date(sc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Case Type */}
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)" }}>{sc.caseType}</p>

                  {/* Case Number */}
                  <p style={{ ...DM, fontSize: 12, color: BLUEB, fontWeight: 600, fontFamily: "monospace" }}>{sc.caseNumber}</p>

                  {/* Year */}
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)" }}>{sc.year}</p>

                  {/* CNR */}
                  <p style={{ ...DM, fontSize: 10, color: sc.cnrNumber ? "#34d399" : "rgba(255,255,255,.2)", fontFamily: "monospace" }}>
                    {sc.cnrNumber || "—"}
                  </p>

                  {/* Actions */}
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
              ))}
            </>
          )}
        </div>

        {/* How it works */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "22px 24px", border: "1px solid rgba(30,95,255,.15)" }}>
          <p style={{ ...DM, fontSize: 13, fontWeight: 700, color: BLUEB, marginBottom: 14 }}>💡 How Saved Cases Work</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "💾", title: "Save Credentials", desc: "Enter court, case type, number, year and optionally your CNR number." },
              { icon: "🔑", title: "Add CNR for Live Data", desc: "CNR number (on court documents) enables real-time tracking from eCourts." },
              { icon: "🔍", title: "Track Anytime", desc: "Click Track to fetch the latest status, hearing dates and case history." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{item.title}</p>
                  <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </CitizenLayout>
  );
}