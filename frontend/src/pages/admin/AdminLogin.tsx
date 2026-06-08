import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const GOLD = "#8D7435";
const GOLD_LIGHT = "rgba(141, 116, 53, 0.22)";
const GOLD_BORDER = "rgba(141, 116, 53, 0.38)";
const GOLD_SOFT = "rgba(141, 116, 53, 0.12)";

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

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      navigate("/admin/dashboard");
    } catch {
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        ...DM,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0b16 0%, #15172a 45%, #211d16 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(10, 12, 24, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 0,
          border: `1px solid ${GOLD_BORDER}`,
          borderTop: `2px solid ${GOLD}`,
          boxShadow: "0 24px 64px rgba(0,0,0,.8)",
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: GOLD_SOFT,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: GOLD,
              margin: "0 auto 16px",
              letterSpacing: "1px",
            }}
          >
            AD
          </div>

          <p
            style={{
              fontSize: 10,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "rgba(205, 182, 117, 0.62)",
              marginBottom: 8,
            }}
          >
            Legal App
          </p>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: GOLD,
              margin: 0,
            }}
          >
            Admin Portal
          </h1>

          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,.35)",
              marginTop: 8,
            }}
          >
            Restricted access — authorized personnel only
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,.10)",
              border: "1px solid rgba(239,68,68,.24)",
              borderRadius: 0,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 12, color: "#ef8888", margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.45)",
                marginBottom: 8,
              }}
            >
              Email Address
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@legalapp.com"
              required
              style={{
                width: "100%",
                background: "rgba(0,0,0,.36)",
                border: `1px solid ${GOLD_LIGHT}`,
                borderRadius: 0,
                padding: "12px 16px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                transition: "border .2s, background .2s",
              }}
              onFocus={(e) => {
                e.target.style.border = `1px solid ${GOLD}`;
                e.target.style.background = "rgba(0,0,0,.48)";
              }}
              onBlur={(e) => {
                e.target.style.border = `1px solid ${GOLD_LIGHT}`;
                e.target.style.background = "rgba(0,0,0,.36)";
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.45)",
                marginBottom: 8,
              }}
            >
              Password
            </label>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,.36)",
                  border: `1px solid ${GOLD_LIGHT}`,
                  borderRadius: 0,
                  padding: "12px 44px 12px 16px",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border .2s, background .2s",
                }}
                onFocus={(e) => {
                  e.target.style.border = `1px solid ${GOLD}`;
                  e.target.style.background = "rgba(0,0,0,.48)";
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${GOLD_LIGHT}`;
                  e.target.style.background = "rgba(0,0,0,.36)";
                }}
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
                  fontSize: 14,
                  color: GOLD,
                  padding: 0,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...DM,
              width: "100%",
              background: loading ? "rgba(141, 116, 53, 0.45)" : GOLD,
              color: "#111",
              fontSize: 14,
              fontWeight: 700,
              padding: "14px 24px",
              borderRadius: 0,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              transition: "opacity .2s, filter .2s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.filter = "brightness(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {loading ? "Signing in..." : "Sign In to Admin Panel"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,.06)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.22)", margin: 0 }}>
            Not an admin?{" "}
            <span
              onClick={() => navigate("/")}
              style={{ color: GOLD, cursor: "pointer" }}
            >
              Go to main app
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}