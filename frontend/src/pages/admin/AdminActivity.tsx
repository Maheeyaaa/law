// frontend/src/pages/admin/AdminActivity.tsx

import { useState, useEffect, type CSSProperties } from "react";
import AdminLayout from "./AdminLayout";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const API = "http://localhost:8000/api";
const BLUEB = "#4d8aff";

function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

const ACTIVITY_TYPES = [
  { value: "all",               label: "All Activity"         },
  { value: "case_created",      label: "Case Created"         },
  { value: "case_updated",      label: "Case Updated"         },
  { value: "document_uploaded", label: "Document Uploaded"    },
  { value: "document_deleted",  label: "Document Deleted"     },
  { value: "ai_used",           label: "AI Used"              },
  { value: "voice_used",        label: "Voice Used"           },
  { value: "profile_updated",   label: "Profile Updated"      },
  { value: "support",           label: "Support"              },
  { value: "general",           label: "General"              },
];

const TYPE_COLORS: Record<string, string> = {
  case_created:      "#4d8aff",
  case_updated:      "#a78bfa",
  document_uploaded: "#34d399",
  document_deleted:  "#ef4444",
  ai_used:           "#fbbf24",
  voice_used:        "#f472b6",
  profile_updated:   "#60a5fa",
  support:           "#fb923c",
  general:           "#9ca3af",
};

const TYPE_ICONS: Record<string, string> = {
  case_created:      "📁",
  case_updated:      "✏️",
  document_uploaded: "📎",
  document_deleted:  "🗑️",
  ai_used:           "🤖",
  voice_used:        "🎙️",
  profile_updated:   "👤",
  support:           "💬",
  general:           "📌",
};

export default function AdminActivity() {
  const [activities, setActivities]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [typeFilter, setTypeFilter]   = useState("all");
  const [page, setPage]               = useState(1);
  const [pagination, setPagination]   = useState<any>(null);
  const [toast, setToast]             = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Type Counts ───────────────────────────────────────────
  const [typeCounts, setTypeCounts]   = useState<Record<string, number>>({});

  useEffect(() => { loadActivity(); }, [typeFilter, page]);
  useEffect(() => { loadTypeCounts(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadActivity = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "20",
        type:  typeFilter,
      });
      const res  = await fetch(`${API}/admin/activity?${params}`, {
        headers: { Authorization: "Bearer " + getAdminToken() },
      });
      const data = await res.json();
      setActivities(data.activities || []);
      setPagination(data.pagination || null);
    } catch {
      showToast("Failed to load activity", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load counts per type for the summary cards
  const loadTypeCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        ACTIVITY_TYPES.filter(t => t.value !== "all").map(async (t) => {
          const res  = await fetch(
            `${API}/admin/activity?type=${t.value}&limit=1`, {
              headers: { Authorization: "Bearer " + getAdminToken() },
            }
          );
          const data = await res.json();
          counts[t.value] = data.pagination?.total || 0;
        })
      );
      setTypeCounts(counts);
    } catch { /* silent */ }
  };

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

  return (
    <AdminLayout
      title="📋 System Activity"
      subtitle="Monitor all user actions across the platform"
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

      {/* ── Summary Cards ────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12, marginBottom: 24,
      }}>
        {ACTIVITY_TYPES.filter(t => t.value !== "all").map(t => (
          <div
            key={t.value}
            onClick={() => { setTypeFilter(t.value); setPage(1); }}
            style={{
              background: typeFilter === t.value
                ? `${TYPE_COLORS[t.value]}18`
                : "rgba(10,20,60,0.4)",
              backdropFilter: "blur(16px)",
              borderRadius: 12,
              border: `1px solid ${typeFilter === t.value
                ? `${TYPE_COLORS[t.value]}50`
                : "rgba(30,95,255,.1)"}`,
              padding: "14px 16px",
              cursor: "pointer",
              transition: "all .2s",
            }}
            onMouseEnter={e =>
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"
            }
            onMouseLeave={e =>
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
            }
          >
            <p style={{ fontSize: 20, margin: "0 0 6px" }}>
              {TYPE_ICONS[t.value]}
            </p>
            <p style={{
              ...DM, fontSize: 18, fontWeight: 700, margin: "0 0 4px",
              color: TYPE_COLORS[t.value],
            }}>
              {typeCounts[t.value] ?? "—"}
            </p>
            <p style={{
              ...DM, fontSize: 10, color: "rgba(255,255,255,.4)",
              margin: 0, textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              {t.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────────── */}
      <div style={{ ...card, marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ ...inputStyle, minWidth: 180, cursor: "pointer" }}
          >
            {ACTIVITY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <button
            onClick={() => { loadActivity(); loadTypeCounts(); }}
            style={{
              ...DM,
              background: "rgba(30,95,255,.15)", color: BLUEB,
              border: "1px solid rgba(30,95,255,.3)", borderRadius: 10,
              padding: "10px 16px", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>

          {typeFilter !== "all" && (
            <button
              onClick={() => { setTypeFilter("all"); setPage(1); }}
              style={{
                ...DM,
                background: "rgba(255,255,255,.05)",
                color: "rgba(255,255,255,.5)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 10, padding: "10px 16px",
                cursor: "pointer", fontSize: 13,
              }}
            >
              ✕ Clear Filter
            </button>
          )}

          {pagination && (
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.3)", marginLeft: "auto" }}>
              {pagination.total} total records
            </p>
          )}
        </div>
      </div>

      {/* ── Activity List ────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>

        {/* Table Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "40px 2fr 3fr 1fr",
          gap: 16, padding: "14px 24px",
          background: "rgba(0,0,0,.3)",
          borderBottom: "1px solid rgba(30,95,255,.1)",
        }}>
          {["", "User", "Action", "Time"].map((h, i) => (
            <p key={i} style={{
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
              Loading activity...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
            <p style={{ ...DM, color: "rgba(255,255,255,.3)", fontSize: 14 }}>
              No activity found
            </p>
          </div>
        ) : (
          activities.map((act, i) => (
            <div
              key={act._id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 2fr 3fr 1fr",
                gap: 16, padding: "14px 24px",
                borderBottom: i < activities.length - 1
                  ? "1px solid rgba(255,255,255,.04)" : "none",
                transition: "background .2s",
              }}
              onMouseEnter={e =>
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(30,95,255,.04)"
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLDivElement).style.background = "transparent"
              }
            >
              {/* Icon */}
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: `${TYPE_COLORS[act.type] || "#9ca3af"}18`,
                border: `1px solid ${TYPE_COLORS[act.type] || "#9ca3af"}30`,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14,
              }}>
                {TYPE_ICONS[act.type] || "📌"}
              </div>

              {/* User */}
              <div style={{ alignSelf: "center", minWidth: 0 }}>
                <p style={{
                  ...DM, fontSize: 13, fontWeight: 600,
                  color: "#fff", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {act.citizen?.name || "Unknown User"}
                </p>
                <p style={{
                  ...DM, fontSize: 11,
                  color: "rgba(255,255,255,.3)", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {act.citizen?.email || ""}
                </p>
              </div>

              {/* Action Text */}
              <div style={{ alignSelf: "center", minWidth: 0 }}>
                <p style={{
                  ...DM, fontSize: 13, color: "rgba(255,255,255,.8)",
                  margin: "0 0 4px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {act.text}
                </p>
                <span style={{
                  display: "inline-block",
                  fontSize: 9, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 4,
                  background: `${TYPE_COLORS[act.type] || "#9ca3af"}18`,
                  color: TYPE_COLORS[act.type] || "#9ca3af",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  {act.type?.replace(/_/g, " ") || "general"}
                </span>
              </div>

              {/* Time */}
              <p style={{
                ...DM, fontSize: 12,
                color: "rgba(255,255,255,.3)",
                margin: 0, alignSelf: "center",
                whiteSpace: "nowrap",
              }}>
                {timeAgo(act.createdAt)}
              </p>
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
                    background: p === page ? "#1e5fff" : "rgba(30,95,255,.1)",
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

    </AdminLayout>
  );
}