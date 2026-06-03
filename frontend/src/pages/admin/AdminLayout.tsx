// frontend/src/pages/admin/AdminLayout.tsx

import { useEffect, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

const NAV_ITEMS = [
  { label: "Dashboard",   path: "/admin/dashboard", icon: "📊" },
  { label: "Users",       path: "/admin/users",     icon: "👥" },
  { label: "Lawyers",     path: "/admin/lawyers",   icon: "⚖️"  },
  { label: "Activity",    path: "/admin/activity",  icon: "📋" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title:    string;
  subtitle?: string;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user  = JSON.parse(localStorage.getItem("adminUser") || "{}");
    if (!token || user.role !== "admin") {
      navigate("/admin/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

  return (
    <div style={{
      ...DM,
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)",
      display: "flex",
      color: "#fff",
    }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <div style={{
        width: 240,
        minHeight: "100vh",
        background: "rgba(5,12,40,.8)",
        backdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(30,95,255,.12)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>

        {/* Logo */}
        <div style={{
          padding: "28px 24px 20px",
          borderBottom: "1px solid rgba(30,95,255,.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              background: "rgba(30,95,255,.2)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}>
              🛡️
            </div>
            <div>
              <p style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                lineHeight: 1.2,
              }}>
                Admin Panel
              </p>
              <p style={{
                fontSize: 9,
                color: "rgba(255,255,255,.3)",
                margin: 0,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}>
                Legal App
              </p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 10,
                  marginBottom: 4,
                  cursor: "pointer",
                  background: isActive
                    ? "rgba(30,95,255,.2)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(30,95,255,.3)"
                    : "1px solid transparent",
                  transition: "all .2s",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,.05)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                  }
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? BLUEB
                    : "rgba(255,255,255,.6)",
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{
                    marginLeft: "auto",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: BLUEB,
                  }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Admin User + Logout */}
        <div style={{
          padding: "16px 12px",
          borderTop: "1px solid rgba(30,95,255,.1)",
        }}>
          {/* Admin info */}
          <div style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,.03)",
            marginBottom: 8,
          }}>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              margin: 0,
              marginBottom: 2,
            }}>
              {adminUser.name || "Admin"}
            </p>
            <p style={{
              fontSize: 10,
              color: "rgba(255,255,255,.3)",
              margin: 0,
            }}>
              {adminUser.email || ""}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              ...DM,
              width: "100%",
              background: "rgba(239,68,68,.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,.2)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🚪</span> Logout
          </button>
        </div>

      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <div style={{
        marginLeft: 240,
        flex: 1,
        padding: "36px 32px",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}>

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            marginBottom: 4,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 13,
              color: "rgba(255,255,255,.4)",
              margin: 0,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Page Content */}
        {children}

      </div>
    </div>
  );
}