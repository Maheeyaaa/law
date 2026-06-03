// frontend/src/pages/admin/AdminLogin.tsx

import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api";
const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const BLUE = "#1e5fff";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store admin token separately
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      navigate("/admin/dashboard");
    } catch (err) {
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...DM,
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "rgba(10,20,60,0.6)",
        backdropFilter: "blur(16px)",
        borderRadius: 20,
        border: "1px solid rgba(30,95,255,.2)",
        boxShadow: "0 24px 64px rgba(0,0,0,.8)",
        padding: 40,
      }}>

        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64,
            height: 64,
            background: "rgba(30,95,255,.15)",
            border: "1px solid rgba(30,95,255,.3)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 16px",
          }}>
            🛡️
          </div>
          <p style={{
            fontSize: 10,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "rgba(168,200,255,.5)",
            marginBottom: 8,
          }}>
            Legal App
          </p>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
          }}>
            Admin Portal
          </h1>
          <p style={{
            fontSize: 12,
            color: "rgba(255,255,255,.35)",
            marginTop: 8,
          }}>
            Restricted access — authorized personnel only
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,.12)",
            border: "1px solid rgba(239,68,68,.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block",
              fontSize: 10,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.4)",
              marginBottom: 8,
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@legalapp.com"
              required
              style={{
                width: "100%",
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(30,95,255,.25)",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                transition: "border .2s",
              }}
              onFocus={e => e.target.style.border = "1px solid rgba(30,95,255,.6)"}
              onBlur={e  => e.target.style.border = "1px solid rgba(30,95,255,.25)"}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontSize: 10,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.4)",
              marginBottom: 8,
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,.4)",
                  border: "1px solid rgba(30,95,255,.25)",
                  borderRadius: 10,
                  padding: "12px 44px 12px 16px",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border .2s",
                }}
                onFocus={e => e.target.style.border = "1px solid rgba(30,95,255,.6)"}
                onBlur={e  => e.target.style.border = "1px solid rgba(30,95,255,.25)"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "rgba(255,255,255,.4)",
                  padding: 0,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...DM,
              width: "100%",
              background: loading
                ? "rgba(30,95,255,.4)"
                : "linear-gradient(135deg, #1e5fff, #4d8aff)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              padding: "14px 24px",
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              transition: "opacity .2s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In to Admin Panel"}
          </button>

        </form>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,.06)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.2)", margin: 0 }}>
            Not an admin?{" "}
            <span
              onClick={() => navigate("/")}
              style={{ color: "rgba(77,138,255,.6)", cursor: "pointer" }}
            >
              Go to main app
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}