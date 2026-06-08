// src/pages/VerifyEmail.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerifyEmail() {
  const [status, setStatus]   = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail]     = useState("");

  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    fetch(`http://localhost:8000/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else if (data.expired) {
          setStatus("expired");
          setEmail(data.email || "");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  const handleResend = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message);
    } catch {
      alert("Failed to resend. Please try again.");
    }
  };

  return (
    <div style={authPageWrapper}>
      <div style={{ ...authCard, alignItems: "center", textAlign: "center" }}>
        <div style={authLogo}>
          <span style={{ fontSize: "28px" }}>⚖️</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
        </div>

        {status === "loading" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h2 style={authTitle}>Verifying your email…</h2>
            <p style={authSubtitle}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ ...authTitle, color: "#00C853" }}>Email Verified!</h2>
            <p style={{ ...authSubtitle, marginBottom: "24px" }}>
              Your account is now active. You can log in.
            </p>
            <button
              style={authPrimaryButton}
              onClick={() => navigate("/", { state: { openSignIn: true } })}
            >
              Go to Login
            </button>
          </>
        )}

        {status === "expired" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏰</div>
            <h2 style={{ ...authTitle, color: "#FFA500" }}>Link Expired</h2>
            <p style={{ ...authSubtitle, marginBottom: "24px" }}>
              Your verification link has expired. Click below to get a new one.
            </p>
            <button style={authPrimaryButton} onClick={handleResend}>
              Resend Verification Email
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
            <h2 style={{ ...authTitle, color: "#FF4D4D" }}>Verification Failed</h2>
            <p style={{ ...authSubtitle, marginBottom: "24px" }}>{message}</p>
            <button style={authPrimaryButton} onClick={() => navigate("/")}>
              Go Back Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── STYLES (same as Home.tsx) ─── */
const authPageWrapper: React.CSSProperties = {
  minHeight: "100vh", backgroundColor: "#0d1117",
  display: "flex", justifyContent: "center", alignItems: "center",
  padding: "40px 20px",
};

const authCard: React.CSSProperties = {
  width: "100%", maxWidth: "440px",
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px", padding: "40px",
  display: "flex", flexDirection: "column",
};

const authLogo: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "10px",
  justifyContent: "center", marginBottom: "24px",
};

const authTitle: React.CSSProperties = {
  color: "white", fontSize: "26px", fontWeight: "bold",
  textAlign: "center", margin: "0 0 8px 0",
};

const authSubtitle: React.CSSProperties = {
  color: "rgba(255,255,255,0.5)", textAlign: "center",
  fontSize: "14px", margin: "0 0 24px 0",
};

const authPrimaryButton: React.CSSProperties = {
  width: "100%", padding: "14px", backgroundColor: "#ffffff",
  border: "none", borderRadius: "8px", color: "#000",
  fontWeight: "bold", fontSize: "15px", cursor: "pointer",
  marginTop: "24px",
};