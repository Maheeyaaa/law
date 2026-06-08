// frontend/src/pages/admin/AdminDashboard.tsx

import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const API = "http://localhost:8000/api";
const GOLD = "#C9A84C";

function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/admin/dashboard`, {
        headers: {
          Authorization: "Bearer " + getAdminToken(),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to load");
        return;
      }

      setStats(data.stats);
      setRecentUsers(data.recentUsers || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
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

  const statCard = (_color: string): CSSProperties => ({
    background: "rgba(52, 2, 29, 0.38)",
    border: "1px solid rgba(201, 168, 76, 0.22)",
    borderRadius: 0,
    padding: 24,
    cursor: "pointer",
    transition: "transform .2s, box-shadow .2s, background .2s",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
  });

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

  const listItem: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "rgba(255,255,255,.04)",
    borderRadius: 0,
    border: "1px solid rgba(255,255,255,.07)",
    cursor: "pointer",
    transition: "background .2s",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  const activityItem: CSSProperties = {
    display: "flex",
    gap: 12,
    padding: "10px 14px",
    background: "rgba(255,255,255,.04)",
    borderRadius: 0,
    border: "1px solid rgba(255,255,255,.07)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

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

  // ── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Platform overview">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 400,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                border: "4px solid rgba(255,255,255,.1)",
                borderTop: "4px solid #C9A84C",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />

            <p
              style={{
                ...DM,
                color: "rgba(255,255,255,.4)",
                fontSize: 13,
              }}
            >
              Loading dashboard...
            </p>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────

  if (error) {
    return (
      <AdminLayout title="Dashboard" subtitle="Platform overview">
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: 48,
            borderColor: "rgba(239,68,68,.3)",
          }}
        >
          <p style={{ ...DM, color: "#ef4444", fontSize: 14 }}>{error}</p>

          <button
            onClick={loadDashboard}
            style={{
              ...DM,
              marginTop: 16,
              background: "rgba(201,168,76,0.12)",
              color: GOLD,
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 0,
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: 13,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

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
            color: "#34021D",
            letterSpacing: "6px",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Dashboard
        </h1>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Total Users */}

        <div
          style={statCard("#C9A84C")}
          onClick={() => navigate("/admin/users")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.22)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.46)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.16)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.38)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  ...DM,
                  fontSize: 11,
                  color: "rgba(255,255,255,.45)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 10,
                }}
              >
                Total Users
              </p>

              <p
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: GOLD,
                  margin: 0,
                }}
              >
                {stats?.citizens?.total ?? 0}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <span style={badge("#34d399")}>
              {stats?.citizens?.active ?? 0} active
            </span>

            <span style={badge("#ef4444")}>
              {stats?.citizens?.banned ?? 0} banned
            </span>
          </div>
        </div>

        {/* Total Lawyers */}

        <div
          style={statCard("#C9A84C")}
          onClick={() => navigate("/admin/lawyers")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.22)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.46)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.16)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.38)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  ...DM,
                  fontSize: 11,
                  color: "rgba(255,255,255,.45)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 10,
                }}
              >
                Total Lawyers
              </p>

              <p
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: GOLD,
                  margin: 0,
                }}
              >
                {stats?.lawyers?.total ?? 0}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <span style={badge("#fbbf24")}>
              {stats?.lawyers?.pending ?? 0} pending
            </span>

            <span style={badge("#34d399")}>
              {stats?.lawyers?.approved ?? 0} approved
            </span>
          </div>
        </div>

        {/* Active Users */}

        <div
          style={statCard("#C9A84C")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.22)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.46)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.16)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.38)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  ...DM,
                  fontSize: 11,
                  color: "rgba(255,255,255,.45)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 10,
                }}
              >
                Active Users
              </p>

              <p
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: GOLD,
                  margin: 0,
                }}
              >
                {stats?.citizens?.active ?? 0}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={badge("#34d399")}>
              {stats?.citizens?.total > 0
                ? Math.round(
                    (stats.citizens.active / stats.citizens.total) * 100
                  )
                : 0}
              % of total
            </span>
          </div>
        </div>

        {/* Pending Lawyers */}

        <div
          style={statCard("#C9A84C")}
          onClick={() => navigate("/admin/lawyers?status=pending")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.22)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.46)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.16)";
            e.currentTarget.style.background = "rgba(52, 2, 29, 0.38)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  ...DM,
                  fontSize: 11,
                  color: "rgba(255,255,255,.45)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 10,
                }}
              >
                Pending Approvals
              </p>

              <p
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: GOLD,
                  margin: 0,
                }}
              >
                {stats?.lawyers?.pending ?? 0}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={badge("#fbbf24")}>Lawyers awaiting review</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ────────────────────────────────────── */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {/* Recent Users */}

        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                ...DM,
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              Recent Users
            </h2>

            <button
              onClick={() => navigate("/admin/users")}
              style={{
                ...DM,
                background: "transparent",
                border: "none",
                color: GOLD,
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
              }}
            >
              View all
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <p
              style={{
                ...DM,
                color: "rgba(255,255,255,.35)",
                fontSize: 13,
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              No users yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentUsers.map((user) => (
                <div
                  key={user._id}
                  style={listItem}
                  onClick={() => navigate("/admin/users")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,.065)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,.04)";
                  }}
                >
                  {/* Avatar */}

                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(201,168,76,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                      color: GOLD,
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
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
                      {user.name}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 11,
                        color: "rgba(255,255,255,.35)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.email}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        ...DM,
                        fontSize: 10,
                        color: "rgba(255,255,255,.25)",
                        margin: 0,
                      }}
                    >
                      {timeAgo(user.createdAt)}
                    </p>

                    {user.isBanned && (
                      <span style={badge("#ef4444")}>banned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}

        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                ...DM,
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              Recent Activity
            </h2>

            <button
              onClick={() => navigate("/admin/activity")}
              style={{
                ...DM,
                background: "transparent",
                border: "none",
                color: GOLD,
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
              }}
            >
              View all
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <p
              style={{
                ...DM,
                color: "rgba(255,255,255,.35)",
                fontSize: 13,
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              No activity yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentActivity.map((act) => (
                <div key={act._id} style={activityItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        ...DM,
                        fontSize: 12,
                        color: "#fff",
                        margin: 0,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {act.text}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 10,
                        color: "rgba(255,255,255,.3)",
                        margin: 0,
                      }}
                    >
                      {act.citizen?.name || "Unknown"} —{" "}
                      {timeAgo(act.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}