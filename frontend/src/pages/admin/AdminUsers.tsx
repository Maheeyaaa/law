// frontend/src/pages/admin/AdminUsers.tsx

import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const API = "http://localhost:8000/api";
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

export default function AdminUsers() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [status, setStatus]         = useState("all");
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selected, setSelected]     = useState<any>(null);  // user detail modal
  const [banReason, setBanReason]   = useState("");
  const [showBanModal, setShowBanModal]     = useState(false);
  const [banTarget, setBanTarget]           = useState<any>(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [search, status, page]);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load Users ────────────────────────────────────────────
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  "15",
        status,
        ...(search && { search }),
      });

      const res = await fetch(`${API}/admin/users?${params}`, {
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Load User Detail ──────────────────────────────────────
  const loadUserDetail = async (id: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      setSelected(data);
    } catch {
      showToast("Failed to load user details", "error");
    }
  };

  // ── Ban User ──────────────────────────────────────────────
  const handleBan = async () => {
    if (!banTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/users/${banTarget._id}/ban`, {
        method:  "PATCH",
        headers: {
          Authorization:  "Bearer " + getAdminToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: banReason }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      showToast("User banned successfully");
      setShowBanModal(false);
      setBanReason("");
      setBanTarget(null);
      setSelected(null);
      loadUsers();
    } catch {
      showToast("Failed to ban user", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Unban User ────────────────────────────────────────────
  const handleUnban = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/users/${id}/unban`, {
        method:  "PATCH",
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      showToast("User unbanned successfully");
      setSelected(null);
      loadUsers();
    } catch {
      showToast("Failed to unban user", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete User ───────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will permanently delete the user and all their activity.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method:  "DELETE",
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      showToast("User deleted successfully");
      setSelected(null);
      loadUsers();
    } catch {
      showToast("Failed to delete user", "error");
    } finally {
      setActionLoading(false);
    }
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

  const activityIcon = (type: string) => {
    const icons: Record<string, string> = {
      case_created: "📁", case_updated: "✏️",
      document_uploaded: "📎", document_deleted: "🗑️",
      ai_used: "🤖", voice_used: "🎙️",
      profile_updated: "👤", support: "💬", general: "📌",
    };
    return icons[type] || "📌";
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
    ...DM,
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
      title="👥 Manage Users"
      subtitle="View, search and manage all citizen accounts"
    >

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          background: toast.type === "success"
            ? "rgba(52,211,153,.15)"
            : "rgba(239,68,68,.15)",
          border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,.4)" : "rgba(239,68,68,.4)"}`,
          borderRadius: 12,
          padding: "14px 20px",
          zIndex: 9999,
          backdropFilter: "blur(16px)",
        }}>
          <p style={{
            ...DM,
            fontSize: 13,
            color: toast.type === "success" ? "#34d399" : "#ef4444",
            margin: 0,
          }}>
            {toast.type === "success" ? "✅" : "❌"} {toast.msg}
          </p>
        </div>
      )}

      {/* ── Search & Filters ────────────────────────────── */}
      <div style={{ ...card, marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

          {/* Search */}
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            placeholder="🔍  Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />

          {/* Status Filter */}
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{ ...inputStyle, cursor: "pointer", minWidth: 140 }}
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          {/* Refresh */}
          <button
            onClick={loadUsers}
            style={{
              ...DM,
              background: "rgba(30,95,255,.15)",
              color: BLUEB,
              border: "1px solid rgba(30,95,255,.3)",
              borderRadius: 10,
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats row */}
        {pagination && (
          <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.3)", margin: "12px 0 0" }}>
            Showing {users.length} of {pagination.total} users
          </p>
        )}
      </div>

      {/* ── Users Table ─────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>

        {/* Table Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
          gap: 16,
          padding: "14px 24px",
          background: "rgba(0,0,0,.3)",
          borderBottom: "1px solid rgba(30,95,255,.1)",
        }}>
          {["Name", "Email", "District", "Joined", "Status"].map(h => (
            <p key={h} style={{
              ...DM,
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: 0,
            }}>
              {h}
            </p>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{
              width: 36,
              height: 36,
              border: "3px solid rgba(255,255,255,.1)",
              borderTop: "3px solid #1e5fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }} />
            <p style={{ ...DM, color: "rgba(255,255,255,.3)", fontSize: 13 }}>
              Loading users...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>👤</p>
            <p style={{ ...DM, color: "rgba(255,255,255,.3)", fontSize: 14 }}>
              No users found
            </p>
          </div>
        ) : (
          users.map((user, i) => (
            <div
              key={user._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
                gap: 16,
                padding: "14px 24px",
                borderBottom: i < users.length - 1
                  ? "1px solid rgba(255,255,255,.04)"
                  : "none",
                cursor: "pointer",
                transition: "background .2s",
                background: "transparent",
              }}
              onClick={() => loadUserDetail(user._id)}
              onMouseEnter={e =>
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(30,95,255,.05)"
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent"
              }
            >
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(30,95,255,.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: BLUEB,
                  flexShrink: 0,
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <p style={{
                  ...DM,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {user.name}
                </p>
              </div>

              {/* Email */}
              <p style={{
                ...DM,
                fontSize: 12,
                color: "rgba(255,255,255,.5)",
                margin: 0,
                alignSelf: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {user.email}
              </p>

              {/* District */}
              <p style={{
                ...DM,
                fontSize: 12,
                color: "rgba(255,255,255,.5)",
                margin: 0,
                alignSelf: "center",
              }}>
                {user.district || "—"}
              </p>

              {/* Joined */}
              <p style={{
                ...DM,
                fontSize: 12,
                color: "rgba(255,255,255,.4)",
                margin: 0,
                alignSelf: "center",
              }}>
                {timeAgo(user.createdAt)}
              </p>

              {/* Status */}
              <div style={{ alignSelf: "center" }}>
                {user.isBanned ? (
                  <span style={badge("#ef4444")}>Banned</span>
                ) : (
                  <span style={badge("#34d399")}>Active</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...DM,
              background: "rgba(30,95,255,.15)",
              color: page === 1 ? "rgba(255,255,255,.2)" : BLUEB,
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === pagination.totalPages ||
              Math.abs(p - page) <= 1)
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
                    background: p === page
                      ? BLUE
                      : "rgba(30,95,255,.1)",
                    color: "#fff",
                    border: "1px solid rgba(30,95,255,.2)",
                    borderRadius: 8,
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: 13,
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
                ? "rgba(255,255,255,.2)"
                : BLUEB,
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: page === pagination.totalPages
                ? "not-allowed"
                : "pointer",
              fontSize: 13,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── User Detail Modal ────────────────────────────── */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.7)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0a1628, #1a2a4a)",
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 32,
              boxShadow: "0 24px 80px rgba(0,0,0,.9)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(30,95,255,.2)",
                  border: "2px solid rgba(30,95,255,.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: BLUEB,
                }}>
                  {selected.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ ...DM, fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                    {selected.user?.name}
                  </h2>
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", margin: 0 }}>
                    {selected.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,.5)",
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "6px 10px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: 20 }}>
              {selected.user?.isBanned ? (
                <div style={{
                  background: "rgba(239,68,68,.1)",
                  border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}>
                  <p style={{ ...DM, fontSize: 13, color: "#ef4444", margin: 0, fontWeight: 600 }}>
                    🚫 This user is banned
                  </p>
                  {selected.user?.bannedReason && (
                    <p style={{ ...DM, fontSize: 12, color: "rgba(239,68,68,.7)", margin: "4px 0 0" }}>
                      Reason: {selected.user.bannedReason}
                    </p>
                  )}
                </div>
              ) : (
                <span style={badge("#34d399")}>✓ Active Account</span>
              )}
            </div>

            {/* User Info Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 24,
            }}>
              {[
                { label: "District",   value: selected.user?.district    || "—" },
                { label: "Phone",      value: selected.user?.phone        || "—" },
                { label: "Joined",     value: new Date(selected.user?.createdAt).toLocaleDateString() },
                { label: "Last Login", value: selected.user?.lastLogin
                    ? timeAgo(selected.user.lastLogin)
                    : "—" },
                { label: "Language",   value: selected.user?.preferredLanguage || "—" },
                { label: "Verified",   value: selected.user?.isVerified ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,.03)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    border: "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" }}>
                    {label}
                  </p>
                  <p style={{ ...DM, fontSize: 13, color: "#fff", margin: 0, fontWeight: 500 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            {selected.activity?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ ...DM, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
                  Recent Activity
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.activity.slice(0, 5).map((act: any) => (
                    <div
                      key={act._id}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "10px 12px",
                        background: "rgba(255,255,255,.03)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,.05)",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{activityIcon(act.type)}</span>
                      <div>
                        <p style={{ ...DM, fontSize: 12, color: "#fff", margin: 0 }}>
                          {act.text}
                        </p>
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", margin: 0 }}>
                          {timeAgo(act.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selected.user?.isBanned ? (
                <button
                  onClick={() => handleUnban(selected.user._id)}
                  disabled={actionLoading}
                  style={{
                    ...DM,
                    flex: 1,
                    background: "rgba(52,211,153,.15)",
                    color: "#34d399",
                    border: "1px solid rgba(52,211,153,.3)",
                    borderRadius: 10,
                    padding: "12px 20px",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  ✓ Unban User
                </button>
              ) : (
                <button
                  onClick={() => {
                    setBanTarget(selected.user);
                    setShowBanModal(true);
                  }}
                  style={{
                    ...DM,
                    flex: 1,
                    background: "rgba(251,191,36,.12)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251,191,36,.3)",
                    borderRadius: 10,
                    padding: "12px 20px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  🚫 Ban User
                </button>
              )}

              <button
                onClick={() => handleDelete(selected.user._id)}
                disabled={actionLoading}
                style={{
                  ...DM,
                  flex: 1,
                  background: "rgba(239,68,68,.12)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,.25)",
                  borderRadius: 10,
                  padding: "12px 20px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                🗑️ Delete User
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Ban Reason Modal ─────────────────────────────── */}
      {showBanModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            backdropFilter: "blur(8px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, #0a1628, #1a2a4a)",
            border: "1px solid rgba(239,68,68,.3)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 420,
            padding: 28,
            boxShadow: "0 24px 80px rgba(0,0,0,.9)",
          }}>
            <h3 style={{ ...DM, fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              🚫 Ban User
            </h3>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 20 }}>
              Banning <strong style={{ color: "#fff" }}>{banTarget?.name}</strong> will prevent them from logging in.
            </p>

            <label style={{
              ...DM,
              fontSize: 10,
              color: "rgba(255,255,255,.4)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "block",
              marginBottom: 8,
            }}>
              Reason (optional)
            </label>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="e.g. Spam, abusive behavior..."
              rows={3}
              style={{
                ...DM,
                width: "100%",
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(239,68,68,.25)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setBanTarget(null);
                }}
                style={{
                  ...DM,
                  flex: 1,
                  background: "rgba(255,255,255,.05)",
                  color: "rgba(255,255,255,.5)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 10,
                  padding: "11px 20px",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading}
                style={{
                  ...DM,
                  flex: 1,
                  background: "rgba(239,68,68,.2)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,.4)",
                  borderRadius: 10,
                  padding: "11px 20px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}