// frontend/src/pages/admin/AdminLawyers.tsx

import { useState, useEffect, type CSSProperties } from "react";
import AdminLayout from "./AdminLayout";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const API = "http://localhost:8000/api";

const WINE = "#34021D";
const GOLD = "#C9A84C";
const GREEN = "#34d399";
const RED   = "#ef4444";

const TELANGANA_DISTRICTS = [
  "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy",
  "Vikarabad", "Hanumakonda", "Khammam", "Nalgonda",
  "Karimnagar", "Nizamabad", "Adilabad", "Kumuram Bheem Asifabad",
  "Mancherial", "Peddapalli", "Jagtial", "Rajanna Sircilla",
  "Kamareddy", "Medak", "Siddipet", "Jangaon",
  "Mahabubabad", "Warangal", "Suryapet", "Yadadri Bhuvanagiri",
  "Mahabubnagar", "Nagarkurnool", "Wanaparthy", "Jogulamba Gadwal",
  "Narayanpet", "Mulugu", "Jayashankar Bhupalpally", "Bhadradri Kothagudem",
  "Nirmal",
];

const SPECIALIZATIONS = [
  "Criminal Law", "Civil Law", "Family Law", "Corporate Law",
  "Property Law", "Labour Law", "Constitutional Law", "Taxation Law",
  "Cyber Law", "Consumer Protection Law", "Environment Law",
  "Intellectual Property Law", "Banking Law", "Insurance Law",
  "Negotiable Instruments Act", "Motor Vehicles Act", "Human Rights Law",
  "Media And Entertainment Law", "Energy Law",
];

function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  district: "Hyderabad",
  city: "",
  specialization: "",
  specializations: "",
  bio: "",
  education: "",
  isVerified: false,
};

export default function AdminLawyers() {
  // ── State ─────────────────────────────────────────────────
  const [lawyers, setLawyers]                = useState<any[]>([]);
  const [loading, setLoading]                = useState(true);
  const [search, setSearch]                  = useState("");
  const [sourceFilter, setSourceFilter]      = useState("all");
  const [districtFilter, setDistrictFilter]  = useState("");
  const [page, setPage]                      = useState(1);
  const [pagination, setPagination]          = useState<any>(null);

  const [selected, setSelected]              = useState<any>(null);
  const [showForm, setShowForm]              = useState(false);
  const [editMode, setEditMode]              = useState(false);
  const [form, setForm]                      = useState({ ...EMPTY_FORM });

  const [formLoading, setFormLoading]        = useState(false);
  const [actionLoading, setActionLoading]    = useState(false);
  const [toast, setToast]                    = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadLawyers();
  }, [search, sourceFilter, districtFilter, page]);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load Lawyers ──────────────────────────────────────────
  const loadLawyers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  "15",
        source: sourceFilter,
        ...(search          && { search }),
        ...(districtFilter  && { district: districtFilter }),
      });

      const res = await fetch(`${API}/admin/lawyers?${params}`, {
        headers: { Authorization: "Bearer " + getAdminToken() },
      });

      const data = await res.json();
      setLawyers(data.lawyers || []);
      setPagination(data.pagination || null);
    } catch {
      showToast("Failed to load lawyers", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadLawyerDetail = async (id: string) => {
    try {
      const res = await fetch(`${API}/admin/lawyers/${id}`, {
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      setSelected(data.lawyer);
    } catch {
      showToast("Failed to load lawyer details", "error");
    }
  };

  // ── Add Lawyer ────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.name || !form.district || !form.specialization) {
      showToast("Name, district and specialization are required", "error");
      return;
    }

    setFormLoading(true);
    try {
      const body = {
        name:            form.name.trim(),
        email:           form.email.trim() || null,
        phone:           form.phone.trim() || null,
        district:        form.district,
        city:            form.city.trim() || form.district,
        specialization:  form.specialization,
        specializations: form.specializations
          ? form.specializations.split(",").map((s) => s.trim()).filter(Boolean)
          : [form.specialization],
        bio:        form.bio.trim(),
        education:  form.education
          ? form.education.split(",").map((e) => e.trim()).filter(Boolean)
          : [],
        isVerified: form.isVerified,
      };

      const res = await fetch(`${API}/admin/lawyers`, {
        method: "POST",
        headers: {
          Authorization:  "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to add lawyer", "error");
        return;
      }

      showToast("Lawyer added successfully");
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      loadLawyers();
    } catch {
      showToast("Failed to add lawyer", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit Lawyer ───────────────────────────────────────────
  const handleEdit = async () => {
    if (!form.name || !form.district || !form.specialization) {
      showToast("Name, district and specialization are required", "error");
      return;
    }

    setFormLoading(true);
    try {
      const body = {
        name:            form.name.trim(),
        email:           form.email.trim() || null,
        phone:           form.phone.trim() || null,
        district:        form.district,
        city:            form.city.trim() || form.district,
        specialization:  form.specialization,
        specializations: form.specializations
          ? form.specializations.split(",").map((s) => s.trim()).filter(Boolean)
          : [form.specialization],
        bio:        form.bio.trim(),
        education:  form.education
          ? form.education.split(",").map((e) => e.trim()).filter(Boolean)
          : [],
        isVerified: form.isVerified,
      };

      const res = await fetch(`${API}/admin/lawyers/${selected._id}`, {
        method: "PATCH",
        headers: {
          Authorization:  "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to update lawyer", "error");
        return;
      }

      showToast("Lawyer updated successfully");
      setShowForm(false);
      setEditMode(false);
      setSelected(null);
      setForm({ ...EMPTY_FORM });
      loadLawyers();
    } catch {
      showToast("Failed to update lawyer", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete Lawyer ─────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will permanently delete this lawyer.")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/lawyers/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to delete lawyer", "error");
        return;
      }
      showToast("Lawyer deleted successfully");
      setSelected(null);
      loadLawyers();
    } catch {
      showToast("Failed to delete lawyer", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Open Edit Form ────────────────────────────────────────
  const openEditForm = (lawyer: any) => {
    setForm({
      name:            lawyer.name || "",
      email:           lawyer.email || "",
      phone:           lawyer.phone || "",
      district:        lawyer.district || "Hyderabad",
      city:            lawyer.city || "",
      specialization:  lawyer.specialization || "",
      specializations: (lawyer.specializations || []).join(", "),
      bio:             lawyer.bio || "",
      education:       (lawyer.education || []).join(", "),
      isVerified:      !!lawyer.isVerified,
    });
    setEditMode(true);
    setShowForm(true);
    setSelected(null);
  };

  const openAddForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditMode(false);
    setShowForm(true);
  };

  // ── Helpers ───────────────────────────────────────────────
  const sourceLabel = (sources: string[]) => {
    if (sources?.includes("admin"))   return "Admin";
    if (sources?.includes("freelaw")) return "FreeLaw";
    return "Other";
  };

  const sourceColor = (sources: string[]) => {
    if (sources?.includes("admin"))   return GOLD;
    if (sources?.includes("freelaw")) return GREEN;
    return "#94a3b8";
  };

  // ── Styles ────────────────────────────────────────────────
  const card: CSSProperties = {
    background: "rgba(52, 2, 29, 0.38)",
    border: "1px solid rgba(201, 168, 76, 0.22)",
    borderRadius: 0,
    padding: 24,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
  };

  const inputStyle: CSSProperties = {
    background: "rgba(12, 0, 7, 0.45)",
    border: "1px solid rgba(201, 168, 76, 0.22)",
    borderRadius: 0,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    ...DM,
  };

  const labelStyle: CSSProperties = {
    ...DM,
    fontSize: 10,
    color: "rgba(255,255,255,.4)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    display: "block",
    marginBottom: 6,
  };

  const badge = (color: string): CSSProperties => ({
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 6,
    background: `${color}20`,
    color,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  });

  const modalOverlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,.75)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  };

  const modalPanel: CSSProperties = {
    background: "rgba(52, 2, 29, 0.92)",
    border: "1px solid rgba(201, 168, 76, 0.3)",
    borderRadius: 0,
    width: "100%",
    maxWidth: 720,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 32,
    boxShadow: "0 24px 80px rgba(0,0,0,.75)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  };

  return (
    <AdminLayout title="" subtitle="">
      {/* ── Page Heading ───────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          ...DM, fontSize: 11, color: GOLD,
          textTransform: "uppercase", letterSpacing: "2px",
          margin: 0, marginBottom: 6, fontWeight: 700,
        }}>
          Admin
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 56, fontWeight: 500, color: WINE,
          letterSpacing: "6px", textTransform: "uppercase",
          margin: 0, lineHeight: 1,
        }}>
          Manage Lawyers
        </h1>
      </div>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "success"
            ? "rgba(52,211,153,.13)"
            : "rgba(239,68,68,.13)",
          border: `1px solid ${toast.type === "success"
            ? "rgba(52,211,153,.4)"
            : "rgba(239,68,68,.4)"}`,
          borderRadius: 0, padding: "14px 20px",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{
            ...DM, fontSize: 13, margin: 0,
            color: toast.type === "success" ? GREEN : RED,
          }}>
            {toast.msg}
          </p>
        </div>
      )}

      {/* ── Filters + Add Button ───────────────────────────── */}
      <div style={{ ...card, marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, width: "auto", minWidth: 140, cursor: "pointer" }}
          >
            <option value="all">All Sources</option>
            <option value="admin">Admin-Added</option>
            <option value="freelaw">FreeLaw</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, width: "auto", minWidth: 160, cursor: "pointer" }}
          >
            <option value="">All Districts</option>
            {TELANGANA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button
            onClick={loadLawyers}
            style={{
              ...DM, background: "rgba(201,168,76,.15)",
              color: GOLD, border: "1px solid rgba(201,168,76,.3)",
              padding: "10px 16px", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
            }}
          >
            Refresh
          </button>

          <button
            onClick={openAddForm}
            style={{
              ...DM, background: "rgba(52, 2, 29, 0.78)",
              color: "#fff", border: `1px solid ${GOLD}`,
              padding: "10px 20px", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
            }}
          >
            + Add Lawyer
          </button>
        </div>

        {pagination && (
          <p style={{
            ...DM, fontSize: 12,
            color: "rgba(255,255,255,.3)",
            margin: "12px 0 0",
          }}>
            Showing {lawyers.length} of {pagination.total} lawyers
          </p>
        )}
      </div>

      {/* ── Lawyers Table ──────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 1fr",
          gap: 12, padding: "14px 24px",
          background: "rgba(12, 0, 7, 0.38)",
          borderBottom: "1px solid rgba(201, 168, 76, 0.15)",
        }}>
          {["Name", "Specialization", "District", "City", "Source", "Verified"].map((h) => (
            <p key={h} style={{
              ...DM, fontSize: 10, fontWeight: 700,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase",
              letterSpacing: "1px", margin: 0,
            }}>
              {h}
            </p>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{
              width: 36, height: 36,
              border: "3px solid rgba(255,255,255,.1)",
              borderTop: `3px solid ${GOLD}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }} />
            <p style={{ ...DM, color: "rgba(255,255,255,.3)", fontSize: 13 }}>
              Loading lawyers...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : lawyers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ ...DM, color: "rgba(255,255,255,.3)", fontSize: 14 }}>
              No lawyers found
            </p>
            <button
              onClick={openAddForm}
              style={{
                ...DM, marginTop: 12,
                background: "rgba(52, 2, 29, 0.78)",
                color: "#fff", border: `1px solid ${GOLD}`,
                padding: "10px 24px", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
              }}
            >
              + Add First Lawyer
            </button>
          </div>
        ) : (
          lawyers.map((lawyer, i) => (
            <div
              key={lawyer._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 1fr",
                gap: 12, padding: "14px 24px",
                borderBottom: i < lawyers.length - 1
                  ? "1px solid rgba(255,255,255,.04)" : "none",
                cursor: "pointer",
                transition: "background .2s",
              }}
              onClick={() => loadLawyerDetail(lawyer._id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(201,168,76,.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(201,168,76,.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: GOLD, flexShrink: 0,
                }}>
                  {lawyer.name?.charAt(0).toUpperCase() || "L"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    ...DM, fontSize: 13, fontWeight: 600,
                    color: "#fff", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {lawyer.name}
                  </p>
                  {lawyer.email && (
                    <p style={{
                      ...DM, fontSize: 10,
                      color: "rgba(255,255,255,.3)", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {lawyer.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Specialization */}
              <p style={{
                ...DM, fontSize: 12, color: "rgba(255,255,255,.6)",
                margin: 0, alignSelf: "center",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {lawyer.specialization || "—"}
              </p>

              {/* District */}
              <p style={{
                ...DM, fontSize: 12, color: "rgba(255,255,255,.5)",
                margin: 0, alignSelf: "center",
              }}>
                {lawyer.district || "—"}
              </p>

              {/* City */}
              <p style={{
                ...DM, fontSize: 12, color: "rgba(255,255,255,.5)",
                margin: 0, alignSelf: "center",
              }}>
                {lawyer.city || "—"}
              </p>

              {/* Source */}
              <div style={{ alignSelf: "center" }}>
                <span style={badge(sourceColor(lawyer.source))}>
                  {sourceLabel(lawyer.source)}
                </span>
              </div>

              {/* Verified */}
              <div style={{ alignSelf: "center" }}>
                {lawyer.isVerified ? (
                  <span style={badge(GREEN)}>✓ Yes</span>
                ) : (
                  <span style={badge("#94a3b8")}>No</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "center",
          alignItems: "center", gap: 8, marginTop: 20,
        }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...DM, background: "rgba(201,168,76,.15)",
              color: page === 1 ? "rgba(255,255,255,.2)" : GOLD,
              border: "1px solid rgba(201,168,76,.2)",
              padding: "8px 16px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Prev
          </button>

          <span style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)" }}>
            Page <strong style={{ color: GOLD }}>{page}</strong> of{" "}
            <strong style={{ color: GOLD }}>{pagination.totalPages}</strong>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            style={{
              ...DM, background: "rgba(201,168,76,.15)",
              color: page === pagination.totalPages ? "rgba(255,255,255,.2)" : GOLD,
              border: "1px solid rgba(201,168,76,.2)",
              padding: "8px 16px",
              cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* ══ ADD / EDIT FORM MODAL ══ */}
      {showForm && (
        <div style={modalOverlay} onClick={() => setShowForm(false)}>
          <div style={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 24,
            }}>
              <h2 style={{ ...DM, fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
                {editMode ? "Edit Lawyer" : "Add New Lawyer"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditMode(false); }}
                style={{
                  width: 32, height: 32,
                  background: "rgba(201,168,76,.05)",
                  border: `1px solid ${GOLD}`, color: GOLD,
                  fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Advocate name"
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="lawyer@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>

              {/* District */}
              <div>
                <label style={labelStyle}>District *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                >
                  {TELANGANA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label style={labelStyle}>City / Area</label>
                <input
                  style={inputStyle}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Secunderabad, Banjara Hills"
                />
              </div>

              {/* Primary Specialization */}
              <div>
                <label style={labelStyle}>Primary Specialization *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* All Specializations */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  All Specializations (comma separated, optional)
                </label>
                <input
                  style={inputStyle}
                  value={form.specializations}
                  onChange={(e) => setForm({ ...form, specializations: e.target.value })}
                  placeholder="Property Law, Civil Law, Family Law"
                />
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 4 }}>
                  Leave blank to use only primary specialization
                </p>
              </div>

              {/* Education */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Education (comma separated)</label>
                <input
                  style={inputStyle}
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  placeholder="LLB - Osmania University, LLM - NALSAR"
                />
              </div>

              {/* Bio */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Bio / About</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Brief description of the lawyer's practice and expertise..."
                />
              </div>

              {/* Verified Checkbox */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer", padding: "10px 14px",
                  background: "rgba(12, 0, 7, 0.45)",
                  border: "1px solid rgba(201, 168, 76, 0.22)",
                }}>
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ ...DM, fontSize: 13, color: "#fff" }}>
                    Mark as Verified Lawyer
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={editMode ? handleEdit : handleAdd}
                disabled={formLoading}
                style={{
                  ...DM, flex: 1,
                  background: formLoading ? "rgba(201,168,76,.3)" : GOLD,
                  color: "#111", fontSize: 14, fontWeight: 700,
                  padding: "14px 20px", border: "none",
                  cursor: formLoading ? "not-allowed" : "pointer",
                }}
              >
                {formLoading
                  ? "Saving..."
                  : editMode ? "Save Changes" : "Add Lawyer"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditMode(false); }}
                style={{
                  ...DM,
                  background: "rgba(255,255,255,.05)",
                  color: "rgba(255,255,255,.6)",
                  border: "1px solid rgba(255,255,255,.1)",
                  padding: "14px 24px", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ LAWYER DETAIL MODAL ══ */}
      {selected && (
        <div style={modalOverlay} onClick={() => setSelected(null)}>
          <div style={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 24,
            }}>
              <div>
                <h2 style={{ ...DM, fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
                  {selected.name}
                </h2>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <span style={badge(sourceColor(selected.source))}>
                    {sourceLabel(selected.source)}
                  </span>
                  {selected.isVerified && <span style={badge(GREEN)}>✓ Verified</span>}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 32, height: 32,
                  background: "rgba(201,168,76,.05)",
                  border: `1px solid ${GOLD}`, color: GOLD,
                  fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            {/* Info Grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12, marginBottom: 20,
            }}>
              {[
                { label: "District",       value: selected.district     },
                { label: "City",           value: selected.city          },
                { label: "Email",          value: selected.email         },
                { label: "Phone",          value: selected.phone         },
                { label: "Specialization", value: selected.specialization },
              ].filter((d) => d.value).map((d) => (
                <div key={d.label} style={{
                  background: "rgba(255,255,255,.045)",
                  border: "1px solid rgba(255,255,255,.075)",
                  padding: "10px 14px",
                }}>
                  <p style={labelStyle}>{d.label}</p>
                  <p style={{ ...DM, fontSize: 12, color: "#fff", margin: 0 }}>
                    {d.value}
                  </p>
                </div>
              ))}
            </div>

            {/* All Specializations */}
            {selected.specializations?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>All Specializations</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selected.specializations.map((s: string) => (
                    <span key={s} style={{
                      ...DM, fontSize: 11,
                      padding: "3px 9px",
                      background: "rgba(201,168,76,.08)",
                      border: "1px solid rgba(201,168,76,.2)",
                      color: GOLD,
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {selected.education?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>Education</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {selected.education.map((e: string, i: number) => (
                    <p key={i} style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)", margin: 0 }}>
                      🎓 {e}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {selected.bio && (
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>About</p>
                <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.6, margin: 0 }}>
                  {selected.bio}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => openEditForm(selected)}
                style={{
                  ...DM, flex: 1,
                  background: GOLD, color: "#111",
                  fontSize: 13, fontWeight: 700,
                  padding: "12px 20px", border: "none",
                  cursor: "pointer",
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(selected._id)}
                disabled={actionLoading}
                style={{
                  ...DM, flex: 1,
                  background: "rgba(239,68,68,.1)",
                  color: RED,
                  border: `1px solid ${RED}`,
                  fontSize: 13, fontWeight: 700,
                  padding: "12px 20px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}