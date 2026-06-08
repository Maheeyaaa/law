// frontend/src/pages/admin/AdminLawyers.tsx

import { useState, useEffect, type CSSProperties } from "react";
import AdminLayout from "./AdminLayout";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const API = "http://localhost:8000/api";

const WINE = "#34021D";
const GOLD = "#C9A84C";

const TELANGANA_DISTRICTS = [
  "Hyderabad",
  "Rangareddy",
  "Medchal-Malkajgiri",
  "Sangareddy",
  "Vikarabad",
  "Warangal Urban",
  "Warangal Rural",
  "Hanumakonda",
  "Khammam",
  "Nalgonda",
  "Karimnagar",
  "Nizamabad",
  "Adilabad",
  "Komaram Bheem Asifabad",
  "Mancherial",
  "Peddapalli",
  "Jagtial",
  "Rajanna Sircilla",
  "Kamareddy",
  "Medak",
  "Siddipet",
  "Jangaon",
  "Mahabubabad",
  "Warangal",
  "Suryapet",
  "Yadadri Bhuvanagiri",
  "Mahabubnagar",
  "Nagarkurnool",
  "Wanaparthy",
  "Jogulamba Gadwal",
  "Narayanpet",
  "Mulugu",
  "Jayashankar Bhupalpally",
  "Bhadradri Kothagudem",
];

const SPECIALIZATIONS = [
  "Criminal Law",
  "Civil Law",
  "Family Law",
  "Corporate Law",
  "Property Law",
  "Labour Law",
  "Constitutional Law",
  "Tax Law",
  "Cyber Law",
  "Consumer Law",
  "Environmental Law",
  "Immigration Law",
  "Intellectual Property",
  "Banking Law",
  "Insurance Law",
];

function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  district: "Hyderabad",
  specialization: "",
  experience: "",
  barCouncilNumber: "",
  languages: "",
  consultationFee: "",
  availability: "available",
  bio: "",
  address: "",
  courtsPracticing: "",
  education: "",
};

export default function AdminLawyers() {
  // ── State ─────────────────────────────────────────────────

  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadLawyers();
  }, [search, statusFilter, districtFilter, page]);

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
        page: String(page),
        limit: "15",
        status: statusFilter,
        ...(search && { search }),
        ...(districtFilter && { district: districtFilter }),
      });

      const res = await fetch(`${API}/admin/lawyers?${params}`, {
        headers: {
          Authorization: "Bearer " + getAdminToken(),
        },
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
      const res = await fetch(`${API}/admin/lawyers/${id}`, {
        headers: {
          Authorization: "Bearer " + getAdminToken(),
        },
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
        method: "POST",
        headers: {
          Authorization: "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience: parseInt(form.experience) || 0,
          consultationFee: parseInt(form.consultationFee) || 0,
          languages: form.languages
            ? form.languages
                .split(",")
                .map((l) => l.trim())
                .filter(Boolean)
            : [],
          education: form.education
            ? form.education
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
            : [],
          courtsPracticing: form.courtsPracticing
            ? form.courtsPracticing
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : [],
        }),
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
      const res = await fetch(`${API}/admin/lawyers/${selected._id}`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience: parseInt(form.experience) || 0,
          consultationFee: parseInt(form.consultationFee) || 0,
          languages: form.languages
            ? form.languages
                .split(",")
                .map((l: string) => l.trim())
                .filter(Boolean)
            : [],
          education: form.education
            ? form.education
                .split(",")
                .map((e: string) => e.trim())
                .filter(Boolean)
            : [],
          courtsPracticing: form.courtsPracticing
            ? form.courtsPracticing
                .split(",")
                .map((c: string) => c.trim())
                .filter(Boolean)
            : [],
        }),
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
    if (!confirm("Are you sure? This will permanently delete this lawyer.")) {
      return;
    }

    setActionLoading(true);

    try {
      const res = await fetch(`${API}/admin/lawyers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + getAdminToken(),
        },
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

  // ── Approve / Reject ──────────────────────────────────────

  const handleApprove = async (id: string) => {
    setActionLoading(true);

    try {
      const res = await fetch(`${API}/admin/lawyers/${id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + getAdminToken(),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Failed to approve lawyer", "error");
        return;
      }

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
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "" }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Failed to reject lawyer", "error");
        return;
      }

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
      name: lawyer.name || "",
      email: lawyer.email || "",
      phone: lawyer.phone || "",
      district: lawyer.district || "Hyderabad",
      specialization: lawyer.specialization || "",
      experience: String(lawyer.experience || ""),
      barCouncilNumber: lawyer.barCouncilNumber || "",
      languages: (lawyer.languages || []).join(", "),
      consultationFee: String(lawyer.consultationFee || ""),
      availability: lawyer.availability || "available",
      bio: lawyer.bio || "",
      address: lawyer.address || "",
      courtsPracticing: (lawyer.courtsPracticing || []).join(", "),
      education: (lawyer.education || []).join(", "),
    });

    setEditMode(true);
    setShowForm(true);
    setSelected(null);
  };

  // ── Helpers ───────────────────────────────────────────────

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
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
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
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
    background: "rgba(52, 2, 29, 0.72)",
    border: "1px solid rgba(201, 168, 76, 0.3)",
    borderRadius: 0,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 32,
    boxShadow: "0 24px 80px rgba(0,0,0,.75)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  };

  const infoBox: CSSProperties = {
    background: "rgba(255,255,255,.045)",
    borderRadius: 0,
    padding: "12px 16px",
    border: "1px solid rgba(255,255,255,.075)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  return (
    <AdminLayout title="" subtitle="">
      {/* ── Page Heading ───────────────────────────────────── */}

      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            ...DM,
            fontSize: 11,
            color: GOLD,
            textTransform: "uppercase",
            letterSpacing: "2px",
            margin: 0,
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          Admin
        </p>

        <h1
          style={{
            fontFamily:
              "'Cormorant Garamond', 'Playfair Display', 'Cinzel', Georgia, serif",
            fontSize: 56,
            fontWeight: 500,
            color: WINE,
            letterSpacing: "6px",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Manage Lawyers
        </h1>
      </div>

      {/* ── Toast ───────────────────────────────────────────── */}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            background:
              toast.type === "success"
                ? "rgba(52,211,153,.13)"
                : "rgba(239,68,68,.13)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(52,211,153,.4)"
                : "rgba(239,68,68,.4)"
            }`,
            borderRadius: 0,
            padding: "14px 20px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 10px 30px rgba(0,0,0,.18)",
          }}
        >
          <p
            style={{
              ...DM,
              fontSize: 13,
              margin: 0,
              color: toast.type === "success" ? "#34d399" : "#ef4444",
            }}
          >
            {toast.msg}
          </p>
        </div>
      )}

      {/* ── Filters + Add Button ───────────────────────────── */}

      <div style={{ ...card, marginBottom: 20, padding: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            placeholder="Search by name, email, bar council no..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: 140,
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setPage(1);
            }}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: 160,
              cursor: "pointer",
            }}
          >
            <option value="">All Districts</option>
            {TELANGANA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={loadLawyers}
            style={{
              ...DM,
              background: "rgba(201,168,76,.15)",
              color: GOLD,
              border: "1px solid rgba(201,168,76,.3)",
              borderRadius: 0,
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            Refresh
          </button>

          <button
            onClick={() => {
              setForm({ ...EMPTY_FORM });
              setEditMode(false);
              setShowForm(true);
            }}
            style={{
              ...DM,
              background: "rgba(52, 2, 29, 0.78)",
              color: "#fff",
              border: `1px solid ${GOLD}`,
              borderRadius: 0,
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            Add Lawyer
          </button>
        </div>

        {pagination && (
          <p
            style={{
              ...DM,
              fontSize: 12,
              color: "rgba(255,255,255,.3)",
              margin: "12px 0 0",
            }}
          >
            Showing {lawyers.length} of {pagination.total} lawyers
          </p>
        )}
      </div>

      {/* ── Lawyers Table ──────────────────────────────────── */}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {/* Header */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
            gap: 12,
            padding: "14px 24px",
            background: "rgba(12, 0, 7, 0.38)",
            borderBottom: "1px solid rgba(201, 168, 76, 0.15)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {["Name", "Specialization", "District", "Experience", "Fee", "Status"].map(
            (h) => (
              <p
                key={h}
                style={{
                  ...DM,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(255,255,255,.35)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: 0,
                }}
              >
                {h}
              </p>
            )
          )}
        </div>

        {/* Loading / Empty / Rows */}

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid rgba(255,255,255,.1)",
                borderTop: `3px solid ${GOLD}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
              }}
            />

            <p
              style={{
                ...DM,
                color: "rgba(255,255,255,.3)",
                fontSize: 13,
              }}
            >
              Loading lawyers...
            </p>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : lawyers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p
              style={{
                ...DM,
                color: "rgba(255,255,255,.3)",
                fontSize: 14,
              }}
            >
              No lawyers found
            </p>

            <button
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setEditMode(false);
                setShowForm(true);
              }}
              style={{
                ...DM,
                marginTop: 12,
                background: "rgba(52, 2, 29, 0.78)",
                color: "#fff",
                border: `1px solid ${GOLD}`,
                borderRadius: 0,
                padding: "10px 24px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              Add First Lawyer
            </button>
          </div>
        ) : (
          lawyers.map((lawyer, i) => (
            <div
              key={lawyer._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 1fr",
                gap: 12,
                padding: "14px 24px",
                borderBottom:
                  i < lawyers.length - 1
                    ? "1px solid rgba(255,255,255,.04)"
                    : "none",
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
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(201,168,76,.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: GOLD,
                    flexShrink: 0,
                  }}
                >
                  {lawyer.name?.charAt(0).toUpperCase() || "L"}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      ...DM,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lawyer.name}
                  </p>

                  {lawyer.barCouncilNumber && (
                    <p
                      style={{
                        ...DM,
                        fontSize: 10,
                        color: "rgba(255,255,255,.3)",
                        margin: 0,
                      }}
                    >
                      {lawyer.barCouncilNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Specialization */}

              <p
                style={{
                  ...DM,
                  fontSize: 12,
                  color: "rgba(255,255,255,.6)",
                  margin: 0,
                  alignSelf: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lawyer.specialization || "—"}
              </p>

              {/* District */}

              <p
                style={{
                  ...DM,
                  fontSize: 12,
                  color: "rgba(255,255,255,.5)",
                  margin: 0,
                  alignSelf: "center",
                }}
              >
                {lawyer.district || "—"}
              </p>

              {/* Experience */}

              <p
                style={{
                  ...DM,
                  fontSize: 12,
                  color: "rgba(255,255,255,.5)",
                  margin: 0,
                  alignSelf: "center",
                }}
              >
                {lawyer.experience ? `${lawyer.experience} yrs` : "—"}
              </p>

              {/* Fee */}

              <p
                style={{
                  ...DM,
                  fontSize: 12,
                  color: "rgba(255,255,255,.5)",
                  margin: 0,
                  alignSelf: "center",
                }}
              >
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

      {/* Rest of your modal/form/pagination code remains same */}

      {pagination && pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...DM,
              background: "rgba(201,168,76,.15)",
              color: page === 1 ? "rgba(255,255,255,.2)" : GOLD,
              border: "1px solid rgba(201,168,76,.2)",
              borderRadius: 0,
              padding: "8px 16px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: 13,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            Prev
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === pagination.totalPages ||
                Math.abs(p - page) <= 1
            )
            .map((p, idx, arr) => (
              <span
                key={p}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span
                    style={{
                      color: "rgba(255,255,255,.3)",
                      fontSize: 13,
                    }}
                  >
                    ...
                  </span>
                )}

                <button
                  onClick={() => setPage(p)}
                  style={{
                    ...DM,
                    background:
                      p === page
                        ? "rgba(52, 2, 29, 0.78)"
                        : "rgba(201,168,76,.1)",
                    color: "#fff",
                    border: "1px solid rgba(201,168,76,.2)",
                    borderRadius: 0,
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: p === page ? 700 : 400,
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  {p}
                </button>
              </span>
            ))}

          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
            style={{
              ...DM,
              background: "rgba(201,168,76,.15)",
              color:
                page === pagination.totalPages
                  ? "rgba(255,255,255,.2)"
                  : GOLD,
              border: "1px solid rgba(201,168,76,.2)",
              borderRadius: 0,
              padding: "8px 16px",
              cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Keep your existing Lawyer Detail Modal and Add/Edit Form Modal below unchanged */}
    </AdminLayout>
  );
}