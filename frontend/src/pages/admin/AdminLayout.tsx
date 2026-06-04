// frontend/src/pages/admin/AdminLayout.tsx

import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "📊" },
  { label: "Users",     path: "/admin/users",     icon: "👥" },
  { label: "Lawyers",   path: "/admin/lawyers",   icon: "⚖️"  },
  { label: "Activity",  path: "/admin/activity",  icon: "📋" },
];

interface AdminLayoutProps {
  children:  React.ReactNode;
  title:     string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Change Password State ──────────────────────────────────
  const [showPwModal,  setShowPwModal]  = useState(false);
  const [pwForm,       setPwForm]       = useState({
    currentPassword:  "",
    newPassword:      "",
    confirmPassword:  "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPw,    setShowPw]    = useState({
    current: false,
    new:     false,
    confirm: false,
  });

  // ── Auth Guard ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user  = JSON.parse(localStorage.getItem("adminUser") || "{}");
    if (!token || user.role !== "admin") {
      navigate("/admin/login");
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  // ── Change Password ────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError("All fields are required");
      return;
    }

    if (pwForm.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    if (pwForm.currentPassword === pwForm.newPassword) {
      setPwError("New password must be different from current password");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/admin/change-password", {
        method:  "PATCH",
        headers: {
          Authorization:  "Bearer " + localStorage.getItem("adminToken"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword:     pwForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPwError(data.message || "Failed to change password");
        return;
      }

      setPwSuccess("Password changed successfully! Please login again.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      // Logout after 2 seconds so they login with new password
      setTimeout(() => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      }, 2000);

    } catch {
      setPwError("Connection failed. Is the server running?");
    } finally {
      setPwLoading(false);
    }
  };

  const closePwModal = () => {
    setShowPwModal(false);
    setPwError("");
    setPwSuccess("");
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPw({ current: false, new: false, confirm: false });
  };

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

  // ── Styles ─────────────────────────────────────────────────
  const inputStyle: CSSProperties = {
    ...DM,
    width:        "100%",
    background:   "rgba(0,0,0,.4)",
    border:       "1px solid rgba(30,95,255,.25)",
    borderRadius: 10,
    padding:      "12px 44px 12px 16px",
    color:        "#fff",
    fontSize:     13,
    outline:      "none",
    boxSizing:    "border-box",
  };

  const labelStyle: CSSProperties = {
    ...DM,
    fontSize:        10,
    color:           "rgba(255,255,255,.4)",
    textTransform:   "uppercase",
    letterSpacing:   "1px",
    display:         "block",
    marginBottom:    8,
  };

  return (
    <div style={{
      ...DM,
      minHeight:  "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)",
      display:    "flex",
      color:      "#fff",
    }}>

      {/* ── Sidebar ───────────────────────────────────── */}
      <div style={{
        width:        240,
        minHeight:    "100vh",
        background:   "rgba(5,12,40,.8)",
        backdropFilter: "blur(16px)",
        borderRight:  "1px solid rgba(30,95,255,.12)",
        display:      "flex",
        flexDirection:"column",
        position:     "fixed",
        top:          0,
        left:         0,
        bottom:       0,
        zIndex:       100,
      }}>

        {/* Logo */}
        <div style={{
          padding:      "28px 24px 20px",
          borderBottom: "1px solid rgba(30,95,255,.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width:          36,
              height:         36,
              background:     "rgba(30,95,255,.2)",
              borderRadius:   10,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       18,
            }}>
              🛡️
            </div>
            <div>
              <p style={{
                fontSize:   13,
                fontWeight: 700,
                color:      "#fff",
                margin:     0,
                lineHeight: 1.2,
              }}>
                Admin Panel
              </p>
              <p style={{
                fontSize:        9,
                color:           "rgba(255,255,255,.3)",
                margin:          0,
                letterSpacing:   "1px",
                textTransform:   "uppercase",
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
                  display:        "flex",
                  alignItems:     "center",
                  gap:            12,
                  padding:        "11px 14px",
                  borderRadius:   10,
                  marginBottom:   4,
                  cursor:         "pointer",
                  background:     isActive ? "rgba(30,95,255,.2)"  : "transparent",
                  border:         isActive ? "1px solid rgba(30,95,255,.3)" : "1px solid transparent",
                  transition:     "all .2s",
                }}
                onMouseEnter={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.05)";
                }}
                onMouseLeave={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{
                  fontSize:   13,
                  fontWeight: isActive ? 600 : 400,
                  color:      isActive ? BLUEB : "rgba(255,255,255,.6)",
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{
                    marginLeft:   "auto",
                    width:        4,
                    height:       4,
                    borderRadius: "50%",
                    background:   BLUEB,
                  }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div style={{
          padding:    "16px 12px",
          borderTop:  "1px solid rgba(30,95,255,.1)",
        }}>

          {/* Admin Info */}
          <div style={{
            padding:      "10px 14px",
            borderRadius: 10,
            background:   "rgba(255,255,255,.03)",
            marginBottom: 8,
          }}>
            <p style={{
              fontSize:     12,
              fontWeight:   600,
              color:        "#fff",
              margin:       0,
              marginBottom: 2,
            }}>
              {adminUser.name || "Admin"}
            </p>
            <p style={{
              fontSize: 10,
              color:    "rgba(255,255,255,.3)",
              margin:   0,
            }}>
              {adminUser.email || ""}
            </p>
          </div>

          {/* Change Password Button */}
          <button
            onClick={() => setShowPwModal(true)}
            style={{
              ...DM,
              width:          "100%",
              background:     "rgba(30,95,255,.1)",
              color:          "rgba(168,200,255,.6)",
              border:         "1px solid rgba(30,95,255,.15)",
              borderRadius:   10,
              padding:        "10px 14px",
              fontSize:       12,
              fontWeight:     600,
              cursor:         "pointer",
              textAlign:      "left",
              display:        "flex",
              alignItems:     "center",
              gap:            8,
              marginBottom:   8,
              transition:     "all .2s",
            }}
            onMouseEnter={e =>
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(30,95,255,.2)"
            }
            onMouseLeave={e =>
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(30,95,255,.1)"
            }
          >
            <span>🔑</span> Change Password
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              ...DM,
              width:        "100%",
              background:   "rgba(239,68,68,.1)",
              color:        "#ef4444",
              border:       "1px solid rgba(239,68,68,.2)",
              borderRadius: 10,
              padding:      "10px 14px",
              fontSize:     12,
              fontWeight:   600,
              cursor:       "pointer",
              textAlign:    "left",
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              transition:   "all .2s",
            }}
            onMouseEnter={e =>
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,.2)"
            }
            onMouseLeave={e =>
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,.1)"
            }
          >
            <span>🚪</span> Logout
          </button>

        </div>
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{
        marginLeft: 240,
        flex:       1,
        padding:    "36px 32px",
        minHeight:  "100vh",
        boxSizing:  "border-box",
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize:     26,
            fontWeight:   700,
            color:        "#fff",
            margin:       0,
            marginBottom: 4,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 13,
              color:    "rgba(255,255,255,.4)",
              margin:   0,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Page Content */}
        {children}
      </div>

      {/* ── Change Password Modal ─────────────────────── */}
      {showPwModal && (
        <div
          style={{
            position:       "fixed",
            inset:          0,
            background:     "rgba(0,0,0,.8)",
            backdropFilter: "blur(8px)",
            zIndex:         2000,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        20,
          }}
          onClick={closePwModal}
        >
          <div
            style={{
              background:   "linear-gradient(135deg, #0a1628, #1a2a4a)",
              border:       "1px solid rgba(30,95,255,.2)",
              borderRadius: 20,
              width:        "100%",
              maxWidth:     420,
              padding:      32,
              boxShadow:    "0 24px 80px rgba(0,0,0,.9)",
            }}
            onClick={e => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              marginBottom:   24,
            }}>
              <h2 style={{
                ...DM,
                fontSize:   18,
                fontWeight: 700,
                color:      "#fff",
                margin:     0,
              }}>
                🔑 Change Password
              </h2>
              <button
                onClick={closePwModal}
                style={{
                  background:   "rgba(255,255,255,.05)",
                  border:       "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8,
                  color:        "rgba(255,255,255,.5)",
                  fontSize:     16,
                  cursor:       "pointer",
                  padding:      "6px 10px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {pwError && (
              <div style={{
                background:   "rgba(239,68,68,.12)",
                border:       "1px solid rgba(239,68,68,.3)",
                borderRadius: 10,
                padding:      "12px 16px",
                marginBottom: 16,
              }}>
                <p style={{ ...DM, fontSize: 12, color: "#ef4444", margin: 0 }}>
                  ⚠️ {pwError}
                </p>
              </div>
            )}

            {/* Success Message */}
            {pwSuccess && (
              <div style={{
                background:   "rgba(52,211,153,.12)",
                border:       "1px solid rgba(52,211,153,.3)",
                borderRadius: 10,
                padding:      "12px 16px",
                marginBottom: 16,
              }}>
                <p style={{ ...DM, fontSize: 12, color: "#34d399", margin: 0 }}>
                  ✅ {pwSuccess}
                </p>
              </div>
            )}

            {/* Password Fields */}
            {[
              { label: "Current Password", key: "currentPassword", showKey: "current" },
              { label: "New Password",     key: "newPassword",     showKey: "new"     },
              { label: "Confirm Password", key: "confirmPassword", showKey: "confirm" },
            ].map(({ label, key, showKey }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw[showKey as keyof typeof showPw] ? "text" : "password"}
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e =>
                      (e.target as HTMLInputElement).style.border =
                        "1px solid rgba(30,95,255,.6)"
                    }
                    onBlur={e =>
                      (e.target as HTMLInputElement).style.border =
                        "1px solid rgba(30,95,255,.25)"
                    }
                  />
                  {/* Show/Hide toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPw(prev => ({
                        ...prev,
                        [showKey]: !prev[showKey as keyof typeof prev],
                      }))
                    }
                    style={{
                      position:  "absolute",
                      right:     12,
                      top:       "50%",
                      transform: "translateY(-50%)",
                      background:"none",
                      border:    "none",
                      cursor:    "pointer",
                      fontSize:  15,
                      color:     "rgba(255,255,255,.4)",
                      padding:   0,
                    }}
                  >
                    {showPw[showKey as keyof typeof showPw] ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            ))}

            {/* Requirements hint */}
            <p style={{
              ...DM,
              fontSize:     11,
              color:        "rgba(255,255,255,.25)",
              marginBottom: 20,
            }}>
              ⚠️ Minimum 8 characters · Must be different from current
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={closePwModal}
                style={{
                  ...DM,
                  flex:         1,
                  background:   "rgba(255,255,255,.05)",
                  color:        "rgba(255,255,255,.5)",
                  border:       "1px solid rgba(255,255,255,.1)",
                  borderRadius: 10,
                  padding:      "12px 20px",
                  cursor:       "pointer",
                  fontSize:     13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                style={{
                  ...DM,
                  flex:         1,
                  background:   pwLoading
                    ? "rgba(30,95,255,.4)"
                    : "linear-gradient(135deg, #1e5fff, #4d8aff)",
                  color:        "#fff",
                  border:       "none",
                  borderRadius: 10,
                  padding:      "12px 20px",
                  cursor:       pwLoading ? "not-allowed" : "pointer",
                  fontSize:     13,
                  fontWeight:   700,
                  opacity:      pwLoading ? 0.7 : 1,
                  transition:   "all .2s",
                }}
              >
                {pwLoading ? "Changing..." : "Change Password"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}