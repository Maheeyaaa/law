// frontend/src/pages/admin/AdminLawyers.tsx

import { useState, useEffect, type CSSProperties } from "react";
import AdminLayout from "./AdminLayout";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const API = "http://localhost:8000/api";
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

const TELANGANA_DISTRICTS = [
  "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy",
  "Vikarabad", "Warangal Urban", "Warangal Rural", "Hanumakonda",
  "Khammam", "Nalgonda", "Karimnagar", "Nizamabad", "Adilabad",
  "Komaram Bheem Asifabad", "Mancherial", "Peddapalli", "Jagtial",
  "Rajanna Sircilla", "Kamareddy", "Medak", "Siddipet", "Jangaon",
  "Mahabubabad", "Warangal", "Suryapet", "Yadadri Bhuvanagiri",
  "Mahabubnagar", "Nagarkurnool", "Wanaparthy", "Jogulamba Gadwal",
  "Narayanpet", "Mulugu", "Jayashankar Bhupalpally", "Bhadradri Kothagudem",
];

const SPECIALIZATIONS = [
  "Criminal Law", "Civil Law", "Family Law", "Corporate Law",
  "Property Law", "Labour Law", "Constitutional Law", "Tax Law",
  "Cyber Law", "Consumer Law", "Environmental Law", "Immigration Law",
  "Intellectual Property", "Banking Law", "Insurance Law",
];

function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

const EMPTY_FORM = {
  name: "", email: "", phone: "", district: "Hyderabad",
  specialization: "", experience: "", barCouncilNumber: "",
  languages: "", consultationFee: "", availability: "available",
  bio: "", address: "", courtsPracticing: "", education: "",
};

export default function AdminLawyers() {
  // ── State ─────────────────────────────────────────────────
  const [lawyers, setLawyers]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("");
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState<any>(null);

  const [selected, setSelected]         = useState<any>(null); // detail modal
  const [showForm, setShowForm]         = useState(false);     // add/edit form
  const [editMode, setEditMode]         = useState(false);
  const [form, setForm]                 = useState({ ...EMPTY_FORM });
  const [formLoading, setFormLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => { loadLawyers(); }, [search, statusFilter, districtFilter, page]);

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
        page:  String(page),
        limit: "15",
        status: statusFilter,
        ...(search         && { search }),
        ...(districtFilter && { district: districtFilter }),
      });
      const res  = await fetch(`${API}/admin/lawyers?${params}`, {
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

  // ── Load Lawyer Detail ────────────────────────────────────
  const loadLawyerDetail = async (id: string) => {
    try {
      const res  = await fetch(`${API}/admin/lawyers/${id}`, {
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
      const res = await fetch(`${API}/admin/lawyers`, {
        method:  "POST",
        headers: {
          Authorization:  "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience:      parseInt(form.experience)      || 0,
          consultationFee: parseInt(form.consultationFee) || 0,
          languages:       form.languages
            ? form.languages.split(",").map(l => l.trim()).filter(Boolean)
            : [],
          education:       form.education
            ? form.education.split(",").map(e => e.trim()).filter(Boolean)
            : [],
          courtsPracticing: form.courtsPracticing
            ? form.courtsPracticing.split(",").map(c => c.trim()).filter(Boolean)
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
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
      const res = await fetch(`${API}/admin/lawyers/${selected._id}`, {
        method:  "PATCH",
        headers: {
          Authorization:  "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience:      parseInt(form.experience)      || 0,
          consultationFee: parseInt(form.consultationFee) || 0,
          languages:       form.languages
            ? form.languages.split(",").map((l: string) => l.trim()).filter(Boolean)
            : [],
          education:       form.education
            ? form.education.split(",").map((e: string) => e.trim()).filter(Boolean)
            : [],
          courtsPracticing: form.courtsPracticing
            ? form.courtsPracticing.split(",").map((c: string) => c.trim()).filter(Boolean)
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
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
        method:  "DELETE",
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      showToast("Lawyer deleted successfully");
      setSelected(null);
      loadLawyers();
    } catch {
      showToast("Failed to delete lawyer", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Approve / Reject ──────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/lawyers/${id}/approve`, {
        method:  "PATCH",
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      showToast("Lawyer approved successfully");
      setSelected(null);
      loadLawyers();
    } catch {
      showToast("Failed to approve lawyer", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/lawyers/${id}/reject`, {
        method:  "PATCH",
        headers: {
          Authorization:  "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "" }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      showToast("Lawyer rejected");
      setSelected(null);
      loadLawyers();
    } catch {
      showToast("Failed to reject lawyer", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Open Edit Form ────────────────────────────────────────
  const openEditForm = (lawyer: any) => {
    setForm({
      name:             lawyer.name             || "",
      email:            lawyer.email            || "",
      phone:            lawyer.phone            || "",
      district:         lawyer.district         || "Hyderabad",
      specialization:   lawyer.specialization   || "",
      experience:       String(lawyer.experience || ""),
      barCouncilNumber: lawyer.barCouncilNumber || "",
      languages:        (lawyer.languages        || []).join(", "),
      consultationFee:  String(lawyer.consultationFee || ""),
      availability:     lawyer.availability     || "available",
      bio:              lawyer.bio              || "",
      address:          lawyer.address          || "",
      courtsPracticing: (lawyer.courtsPracticing || []).join(", "),
      education:        (lawyer.education        || []).join(", "),
    });
    setEditMode(true);
    setShowForm(true);
    setSelected(null);
  };

  // ── Helpers ───────────────────────────────────────────────
  const timeAgo = (date: string) => {
    const diff  = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return "Just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "#34d399";
    if (s === "rejected") return "#ef4444";
    return "#fbbf24";
  };

  // ── Styles ────────────────────────────────────────────────
  const card: CSSProperties = {
    background: "rgba(10,20,60,0.5)",
    backdropFilter: "blur(16px)",
    borderRadius: 16,
    border: "1px solid rgba(30,95,255,.15)",
    boxShadow: "0 8px 32px rgba(0,0,0,.4)",
    padding: 24,
  };

  const inputStyle: CSSProperties = {
    background: "rgba(0,0,0,.4)",
    border: "1px solid rgba(30,95,255,.25)",
    borderRadius: 10,
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

  return (
    <AdminLayout
      title="⚖️ Manage Lawyers"
      subtitle="Add, edit and manage the Telangana lawyer directory"
    >
      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "success"
            ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.15)",
          border: `1px solid ${toast.type === "success"
            ? "rgba(52,211,153,.4)" : "rgba(239,68,68,.4)"}`,
          borderRadius: 12, padding: "14px 20px",
          backdropFilter: "blur(16px)",
        }}>
          <p style={{ ...DM, fontSize: 13, margin: 0,
            color: toast.type === "success" ? "#34d399" : "#ef4444" }}>
            {toast.type === "success" ? "✅" : "❌"} {toast.msg}
          </p>
        </div>
      )}

      {/* ── Filters + Add Button ─────────────────────────── */}
      <div style={{ ...card, marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

          <input
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            placeholder="🔍  Search by name, email, bar council no..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, width: "auto", minWidth: 140, cursor: "pointer" }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={districtFilter}
            onChange={e => { setDistrictFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, width: "auto", minWidth: 160, cursor: "pointer" }}
          >
            <option value="">All Districts</option>
            {TELANGANA_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button
            onClick={loadLawyers}
            style={{
              ...DM,
              background: "rgba(30,95,255,.15)", color: BLUEB,
              border: "1px solid rgba(30,95,255,.3)", borderRadius: 10,
              padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>

          <button
            onClick={() => {
              setForm({ ...EMPTY_FORM });
              setEditMode(false);
              setShowForm(true);
            }}
            style={{
              ...DM,
              background: BLUE, color: "#fff", border: "none",
              borderRadius: 10, padding: "10px 20px",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}
          >
            + Add Lawyer
          </button>
        </div>

        {pagination && (
          <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.3)", margin: "12px 0 0" }}>
            Showing {lawyers.length} of {pagination.total} lawyers
          </p>
        )}
      </div>

      {/* ── Lawyers Table ────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
          gap: 12, padding: "14px 24px",
          background: "rgba(0,0,0,.3)",
          borderBottom: "1px solid rgba(30,95,255,.1)",
        }}>
          {["Name", "Specialization", "District", "Experience", "Fee", "Status"].map(h => (
            <p key={h} style={{
              ...DM, fontSize: 10, fontWeight: 700,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase", letterSpacing: "1px", margin: 0,
            }}>
              {h}
            </p>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{
              width: 36, height: 36,
              border: "3px solid rgba(255,255,255,.1)",
              borderTop: "3px solid #1e5fff",
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
            <p style={{ fontSize: 32, marginBottom: 8 }}>⚖️</p>
            <p style={{ ...DM, color: "rgba(255,255,255,.3)", fontSize: 14 }}>
              No lawyers found
            </p>
            <button
              onClick={() => { setForm({ ...EMPTY_FORM }); setEditMode(false); setShowForm(true); }}
              style={{
                ...DM, marginTop: 12,
                background: BLUE, color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 24px",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
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
                gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                gap: 12, padding: "14px 24px",
                borderBottom: i < lawyers.length - 1
                  ? "1px solid rgba(255,255,255,.04)" : "none",
                cursor: "pointer", transition: "background .2s",
              }}
              onClick={() => loadLawyerDetail(lawyer._id)}
              onMouseEnter={e =>
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(30,95,255,.05)"
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLDivElement).style.background = "transparent"
              }
            >
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(167,139,250,.15)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#a78bfa", flexShrink: 0,
                }}>
                  {lawyer.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    ...DM, fontSize: 13, fontWeight: 600, color: "#fff",
                    margin: 0, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {lawyer.name}
                  </p>
                  {lawyer.barCouncilNumber && (
                    <p style={{
                      ...DM, fontSize: 10, color: "rgba(255,255,255,.3)",
                      margin: 0,
                    }}>
                      {lawyer.barCouncilNumber}
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

              {/* Experience */}
              <p style={{
                ...DM, fontSize: 12, color: "rgba(255,255,255,.5)",
                margin: 0, alignSelf: "center",
              }}>
                {lawyer.experience ? `${lawyer.experience} yrs` : "—"}
              </p>

              {/* Fee */}
              <p style={{
                ...DM, fontSize: 12, color: "rgba(255,255,255,.5)",
                margin: 0, alignSelf: "center",
              }}>
                {lawyer.consultationFee ? `₹${lawyer.consultationFee}` : "—"}
              </p>

              {/* Status */}
              <div style={{ alignSelf: "center" }}>
                <span style={badge(statusColor(lawyer.verificationStatus))}>
                  {lawyer.verificationStatus || "pending"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "center",
          alignItems: "center", gap: 8, marginTop: 20,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...DM,
              background: "rgba(30,95,255,.15)",
              color: page === 1 ? "rgba(255,255,255,.2)" : BLUEB,
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 8, padding: "8px 16px",
              cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13,
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span key={`dots-${p}`} style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>
                    ...
                  </span>
                )}
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    ...DM,
                    background: p === page ? BLUE : "rgba(30,95,255,.1)",
                    color: "#fff",
                    border: "1px solid rgba(30,95,255,.2)",
                    borderRadius: 8, padding: "8px 14px",
                    cursor: "pointer", fontSize: 13,
                    fontWeight: p === page ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              </>
            ))}

          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            style={{
              ...DM,
              background: "rgba(30,95,255,.15)",
              color: page === pagination.totalPages
                ? "rgba(255,255,255,.2)" : BLUEB,
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 8, padding: "8px 16px",
              cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Lawyer Detail Modal ──────────────────────────── */}
      {selected && !showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.75)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0a1628, #1a2a4a)",
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 20, width: "100%", maxWidth: 620,
              maxHeight: "85vh", overflowY: "auto",
              padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,.9)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 24,
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(167,139,250,.15)",
                  border: "2px solid rgba(167,139,250,.3)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22, fontWeight: 700, color: "#a78bfa",
                }}>
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ ...DM, fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                    {selected.name}
                  </h2>
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", margin: 0 }}>
                    {selected.specialization || "No specialization"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, color: "rgba(255,255,255,.5)",
                  fontSize: 16, cursor: "pointer", padding: "6px 10px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 20 }}>
              <span style={badge(statusColor(selected.verificationStatus))}>
                {selected.verificationStatus || "pending"}
              </span>
              {selected.isVerified && (
                <span style={{ ...badge("#4d8aff"), marginLeft: 8 }}>
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Info Grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12, marginBottom: 24,
            }}>
              {[
                { label: "Email",           value: selected.email            || "—" },
                { label: "Phone",           value: selected.phone            || "—" },
                { label: "District",        value: selected.district         || "—" },
                { label: "Bar Council No",  value: selected.barCouncilNumber || "—" },
                { label: "Experience",      value: selected.experience ? `${selected.experience} years` : "—" },
                { label: "Consultation Fee",value: selected.consultationFee ? `₹${selected.consultationFee}` : "—" },
                { label: "Availability",    value: selected.availability     || "—" },
                { label: "Added",           value: timeAgo(selected.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,.03)",
                  borderRadius: 10, padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,.06)",
                }}>
                  <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" }}>
                    {label}
                  </p>
                  <p style={{ ...DM, fontSize: 13, color: "#fff", margin: 0, fontWeight: 500 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Languages */}
            {selected.languages?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                  Languages
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selected.languages.map((lang: string) => (
                    <span key={lang} style={badge("#4d8aff")}>{lang}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {selected.bio && (
              <div style={{
                background: "rgba(255,255,255,.03)",
                borderRadius: 10, padding: "12px 16px",
                border: "1px solid rgba(255,255,255,.06)",
                marginBottom: 20,
              }}>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>
                  Bio
                </p>
                <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.7)", margin: 0, lineHeight: 1.6 }}>
                  {selected.bio}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Approve */}
              {selected.verificationStatus !== "approved" && (
                <button
                  onClick={() => handleApprove(selected._id)}
                  disabled={actionLoading}
                  style={{
                    ...DM, flex: 1,
                    background: "rgba(52,211,153,.15)", color: "#34d399",
                    border: "1px solid rgba(52,211,153,.3)", borderRadius: 10,
                    padding: "12px 16px", cursor: actionLoading ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 600, opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  ✓ Approve
                </button>
              )}

              {/* Reject */}
              {selected.verificationStatus !== "rejected" && (
                <button
                  onClick={() => handleReject(selected._id)}
                  disabled={actionLoading}
                  style={{
                    ...DM, flex: 1,
                    background: "rgba(251,191,36,.12)", color: "#fbbf24",
                    border: "1px solid rgba(251,191,36,.3)", borderRadius: 10,
                    padding: "12px 16px", cursor: actionLoading ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 600, opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  ✕ Reject
                </button>
              )}

              {/* Edit */}
              <button
                onClick={() => openEditForm(selected)}
                style={{
                  ...DM, flex: 1,
                  background: "rgba(30,95,255,.15)", color: BLUEB,
                  border: "1px solid rgba(30,95,255,.3)", borderRadius: 10,
                  padding: "12px 16px", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                ✏️ Edit
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(selected._id)}
                disabled={actionLoading}
                style={{
                  ...DM, flex: 1,
                  background: "rgba(239,68,68,.12)", color: "#ef4444",
                  border: "1px solid rgba(239,68,68,.25)", borderRadius: 10,
                  padding: "12px 16px", cursor: actionLoading ? "not-allowed" : "pointer",
                  fontSize: 13, fontWeight: 600, opacity: actionLoading ? 0.6 : 1,
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Form Modal ────────────────────────── */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.75)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: 20,
          }}
          onClick={() => { setShowForm(false); setEditMode(false); }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0a1628, #1a2a4a)",
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 20, width: "100%", maxWidth: 640,
              maxHeight: "90vh", overflowY: "auto",
              padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,.9)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Form Header */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 28,
            }}>
              <h2 style={{ ...DM, fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                {editMode ? "✏️ Edit Lawyer" : "➕ Add New Lawyer"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditMode(false); }}
                style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, color: "rgba(255,255,255,.5)",
                  fontSize: 16, cursor: "pointer", padding: "6px 10px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Name */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Ravi Kumar"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="lawyer@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={inputStyle}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* District */}
              <div>
                <label style={labelStyle}>District *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                >
                  {TELANGANA_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label style={labelStyle}>Specialization *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.specialization}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label style={labelStyle}>Experience (years)</label>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="e.g. 10"
                  value={form.experience}
                  onChange={e => setForm({ ...form, experience: e.target.value })}
                />
              </div>

              {/* Bar Council Number */}
              <div>
                <label style={labelStyle}>Bar Council Number</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. TS/123/2010"
                  value={form.barCouncilNumber}
                  onChange={e => setForm({ ...form, barCouncilNumber: e.target.value })}
                />
              </div>

              {/* Consultation Fee */}
              <div>
                <label style={labelStyle}>Consultation Fee (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="e.g. 500"
                  value={form.consultationFee}
                  onChange={e => setForm({ ...form, consultationFee: e.target.value })}
                />
              </div>

              {/* Availability */}
              <div>
                <label style={labelStyle}>Availability</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.availability}
                  onChange={e => setForm({ ...form, availability: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              {/* Languages */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Languages (comma separated)</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Telugu, English, Hindi"
                  value={form.languages}
                  onChange={e => setForm({ ...form, languages: e.target.value })}
                />
              </div>

              {/* Education */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Education (comma separated)</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. LLB - Osmania University, LLM - NALSAR"
                  value={form.education}
                  onChange={e => setForm({ ...form, education: e.target.value })}
                />
              </div>

              {/* Courts Practicing */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Courts Practicing (comma separated)</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Telangana High Court, District Court Hyderabad"
                  value={form.courtsPracticing}
                  onChange={e => setForm({ ...form, courtsPracticing: e.target.value })}
                />
              </div>

              {/* Address */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Office Address</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. 123, MG Road, Hyderabad"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* Bio */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                  placeholder="Brief description about the lawyer..."
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                />
              </div>

            </div>

            {/* Submit Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => { setShowForm(false); setEditMode(false); }}
                style={{
                  ...DM, flex: 1,
                  background: "rgba(255,255,255,.05)",
                  color: "rgba(255,255,255,.5)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 10, padding: "12px 20px",
                  cursor: "pointer", fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={editMode ? handleEdit : handleAdd}
                disabled={formLoading}
                style={{
                  ...DM, flex: 2,
                  background: formLoading ? "rgba(30,95,255,.4)" : BLUE,
                  color: "#fff", border: "none",
                  borderRadius: 10, padding: "12px 20px",
                  cursor: formLoading ? "not-allowed" : "pointer",
                  fontSize: 13, fontWeight: 700,
                  opacity: formLoading ? 0.7 : 1,
                }}
              >
                {formLoading
                  ? (editMode ? "Saving..." : "Adding...")
                  : (editMode ? "Save Changes" : "Add Lawyer")}
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}