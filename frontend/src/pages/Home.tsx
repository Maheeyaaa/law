import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

/* ─── PASSWORD STRENGTH ─── */
function getPasswordStrength(password: string) {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;

  let level = "Weak";
  let color = "#FF4D4D";
  let width = "20%";
  if (passed === 3) { level = "Fair";   color = "#FFA500"; width = "40%";  }
  if (passed === 4) { level = "Good";   color = "#FFD700"; width = "70%";  }
  if (passed === 5) { level = "Strong"; color = "#00C853"; width = "100%"; }

  return { checks, passed, level, color, width };
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { checks, level, color, width } = getPasswordStrength(password);

  const requirements = [
    { key: "length",    label: "At least 8 characters"         },
    { key: "uppercase", label: "One uppercase letter (A–Z)"    },
    { key: "lowercase", label: "One lowercase letter (a–z)"    },
    { key: "number",    label: "One number (0–9)"              },
    { key: "special",   label: "One special character (!@#$…)" },
  ];

  return (
    <div style={{ marginTop: "8px", marginBottom: "4px" }}>
      <div style={{
        height: "4px", backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: "4px", overflow: "hidden", marginBottom: "8px",
      }}>
        <div style={{
          height: "100%", width, backgroundColor: color,
          borderRadius: "4px",
          transition: "width 0.4s ease, background-color 0.4s ease",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "10px",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
          Password Strength
        </span>
        <span style={{ color, fontSize: "12px", fontWeight: 700 }}>{level}</span>
      </div>
      <div style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px", padding: "10px 14px",
        display: "flex", flexDirection: "column", gap: "6px",
      }}>
        {requirements.map(({ key, label }) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: "8px", fontSize: "12px",
            color: checks[key as keyof typeof checks] ? "#00C853" : "rgba(255,255,255,0.35)",
            transition: "color 0.3s ease",
          }}>
            <span style={{ fontSize: "13px" }}>
              {checks[key as keyof typeof checks] ? "✓" : "○"}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p style={{ color: "#FF6B6B", fontSize: "12px", margin: "4px 0 0 2px" }}>
      ⚠ {msg}
    </p>
  );
}

/* ─── VERIFY EMAIL PAGE ─── */
/* Shown when user clicks the link in their email → /verify-email?token=xxx */
function VerifyEmailPage() {
  const [status, setStatus]   = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail]     = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

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
  }, []);

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
      <div style={{ ...authCard, maxWidth: "440px", alignItems: "center", textAlign: "center" }}>
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
              onClick={() => { window.location.href = "/"; }}
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
            <button
              style={authPrimaryButton}
              onClick={() => { window.location.href = "/"; }}
            >
              Go Back Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── HOME ─── */
export default function Home() {
  const heroRef     = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const contactRef  = useRef<HTMLDivElement>(null);

  const [page, setPage]                 = useState("home");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const location = useLocation();

  const navigateTo = (newPage: string, role: string | null = null) => {
    window.history.pushState({ page: newPage, role }, "", `#${newPage}`);
    setPage(newPage);
    if (role) setSelectedRole(role);
  };

   useEffect(() => {
    if (location.state?.openSignIn) {
      navigateTo("signin", "Citizens");
    }
  }, [location.state]);


  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const state = e.state;
      if (state?.page) {
        setPage(state.page);
        if (state.role) setSelectedRole(state.role);
      } else {
        setPage("home");
        setSelectedRole(null);
      }
    };
    window.addEventListener("popstate", onPop);
    window.history.replaceState({ page: "home", role: null }, "", "#home");
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (page === "signin") return (
    <SignInPage
      role={selectedRole}
      onRegister={() => navigateTo("register", selectedRole)}
      onBack={() => navigateTo("home")}
    />
  );
  if (page === "register") return (
    <RegisterPage
      role={selectedRole}
      onSignIn={() => navigateTo("signin", selectedRole)}
      onBack={() => navigateTo("home")}
    />
  );

  return (
    <>
      {/* HERO */}
      <div
        ref={heroRef}
        style={{
          backgroundColor: "#000",
          backgroundImage: "url('/images/hall.jpeg')",
          backgroundSize: "cover", backgroundPosition: "center",
          backgroundRepeat: "no-repeat", backgroundAttachment: "fixed",
          width: "100%", height: "100vh",
          position: "relative", overflowX: "hidden",
        }}
      >
        {/* Navbar */}
        <nav style={{
          position: "fixed", top: "0", zIndex: 999,
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          color: "white", padding: "10px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          margin: "10px", borderRadius: "20px",
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 1000px 10px 10px" }}>
            LegalMind
          </h1>
          <div style={{ display: "flex", gap: "30px" }}>
            <span style={{ cursor: "pointer" }}
              onClick={() => heroRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Home
            </span>
            <span style={{ cursor: "pointer" }}
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Services
            </span>
            <span style={{ cursor: "pointer" }}
              onClick={() => contactRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Contact
            </span>
          </div>
        </nav>

        {/* Glass Box */}
        <div style={{
          position: "absolute", top: "240px", left: "150px",
          width: "770px", height: "430px",
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", padding: "40px", zIndex: 1,
        }}>
          <h1 style={{ fontSize: "48px", marginBottom: "10px", margin: "0" }}>LegalMind</h1>
          <h2 style={{ fontSize: "24px", margin: "30px 0 8px 0" }}>
            Digitizing Justice. Simplifying Courts.
          </h2>
          <p style={{
            fontSize: "18px", color: "rgba(255,255,255,0.7)",
            maxWidth: "500px", margin: "3px 0 220px 0",
          }}>
            LegalMind streamlines court case filing, tracking, and management
            with secure dashboards and AI-powered insights.
          </p>
          <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
            <button style={primaryButton}
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Get Started
            </button>
            <button style={secondaryButton}
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Login
            </button>
          </div>
        </div>

        <img
          src="/images/lady.png" alt="Lady Justice"
          style={{
            position: "absolute", top: "100px", right: "180px",
            height: "650px", zIndex: 2,
          }}
        />
      </div>

      {/* FEATURES */}
      <div ref={featuresRef} style={featuresContainer}>
        <UnifiedRoleCard
          onSignIn={(role) => navigateTo("signin", role)}
          onRegister={(role) => navigateTo("register", role)}
        />
      </div>

      {/* CONTACT */}
      <div ref={contactRef} style={contactSection}>
        <div style={contactOverlay} />
        <div style={contactGlassBox}>
          <h2 style={contactTitle}>Contact LegalMind</h2>
          <p style={contactDescription}>
            For assistance with case filing, dashboard access, or technical support,
            please contact our team. We are committed to providing secure and reliable service.
          </p>
          <div style={contactContent}>
            <div style={contactInfo}>
              <p><strong>Email:</strong> support@legalmind.com</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Location:</strong> Hyderabad, India</p>
              <p><strong>Hours:</strong> Mon – Fri, 9 AM – 6 PM</p>
            </div>
            <div style={contactForm}>
              <input type="text"  placeholder="Full Name"     style={inputStyle} />
              <input type="email" placeholder="Email Address" style={inputStyle} />
              <input type="text"  placeholder="Subject"       style={inputStyle} />
              <textarea           placeholder="Message"       style={textareaStyle} />
              <button style={sendButton}>Send Message</button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        backgroundColor: "#000", color: "white",
        textAlign: "center", padding: "20px 40px", fontSize: "14px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}>
        <p>© 2026 LegalMind. All rights reserved.</p>
        <p>
          Designed by LegalMind Team |{" "}
          <span style={{ cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>{" "}
          |{" "}
          <span style={{ cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>
        </p>
      </div>
    </>
  );
}

/* ─── UNIFIED ROLE CARD ─── */
function UnifiedRoleCard({
  onSignIn,
  onRegister,
}: {
  onSignIn: (role: string) => void;
  onRegister: (role: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("Citizens");

  const roles: Record<string, {
    text: string;
    badge: string | null;
    badgeColor: string | null;
    badgeBorder?: string;
    badgeText?: string;
    icon: React.ReactNode;
    showRegister: boolean;
    registerLabel: string;
    loginLabel: string;
    note: string | null;
  }> = {
    Citizens: {
      text: "File cases online, upload legal documents securely, select specialized lawyers, and track your case progress in real-time. LegalMind ensures transparency and keeps you informed at every step.",
      badge: null, badgeColor: null,
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <path d="M12 54c0-11 9-20 20-20s20 9 20 20"
            stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      showRegister: true, registerLabel: "Sign Up",
      loginLabel: "Login", note: null,
    },
  };

  const active = roles[activeTab];

  return (
    <div style={{
      width: "720px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderRadius: "28px", border: "1px solid rgba(255,255,255,0.1)",
      overflow: "hidden", color: "white",
      boxShadow: "0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: "-60px", right: "-60px",
        width: "200px", height: "200px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-80px", left: "-40px",
        width: "250px", height: "250px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "relative", zIndex: 1,
      }}>
        {Object.keys(roles).map(role => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            style={{
              flex: 1, padding: "20px 12px",
              backgroundColor: activeTab === role ? "rgba(255,255,255,0.07)" : "transparent",
              border: "none",
              borderBottom: activeTab === role ? "2px solid white" : "2px solid transparent",
              color: activeTab === role ? "white" : "rgba(255,255,255,0.35)",
              fontWeight: activeTab === role ? 700 : 400,
              fontSize: "15px", cursor: "pointer",
              transition: "all 0.3s ease", letterSpacing: "0.5px",
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "flex", minHeight: "320px", position: "relative", zIndex: 1 }}>
        {/* Left */}
        <div style={{
          flex: 1, padding: "36px 40px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          <div style={{
            width: "88px", height: "88px",
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: "22px", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {active.icon}
          </div>

          {active.badge && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 12px",
              backgroundColor: active.badgeColor ?? undefined,
              border: `1px solid ${active.badgeBorder}`,
              borderRadius: "20px", width: "fit-content",
            }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                backgroundColor: active.badgeText,
              }} />
              <span style={{
                color: active.badgeText, fontSize: "12px",
                fontWeight: 600, letterSpacing: "0.4px",
              }}>
                {active.badge}
              </span>
            </div>
          )}

          <p style={{
            color: "rgba(255,255,255,0.65)", lineHeight: "1.85",
            fontSize: "14.5px", margin: 0,
          }}>
            {active.text}
          </p>

          {active.note && (
            <p style={{
              color: "rgba(255,255,255,0.35)", fontSize: "12.5px",
              margin: 0, fontStyle: "italic",
            }}>
              ⓘ {active.note}
            </p>
          )}
        </div>

        {/* Right */}
        <div style={{
          width: "240px", padding: "36px 32px",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <FlowingDots />
          <div style={{
            display: "flex", flexDirection: "column",
            gap: "10px", marginTop: "24px", width: "100%",
          }}>
            {active.showRegister ? (
              <>
                <button style={cardPrimaryButton} onClick={() => onRegister(activeTab)}>
                  {active.registerLabel}
                </button>
                <button style={cardSecondaryButton} onClick={() => onSignIn(activeTab)}>
                  {active.loginLabel}
                </button>
              </>
            ) : (
              <>
                <button style={cardPrimaryButton} onClick={() => onSignIn(activeTab)}>
                  {active.loginLabel}
                </button>
                <div style={{
                  padding: "10px 12px",
                  backgroundColor: "rgba(255,100,100,0.08)",
                  border: "1px solid rgba(255,100,100,0.2)",
                  borderRadius: "8px", color: "rgba(255,150,150,0.8)",
                  fontSize: "12px", textAlign: "center", lineHeight: "1.5",
                }}>
                  🔒 Sign-up not available.<br />Contact your administrator.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SIGN IN PAGE ─── */
function SignInPage({
  role,
  onRegister,
  onBack,
}: {
  role: string | null;
  onRegister: () => void;
  onBack: () => void;
}) {
  const isCourtStaff            = role === "court_staff";
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      // Unverified user — show helpful message, no OTP screen
      if (res.status === 403 && data.needsVerification) {
        setError(
          "Your email is not verified yet. Please check your inbox and click the verification link we sent you."
        );
        return;
      }

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("voiceGreetingDone");
        window.location.href = data.user.role === "admin" ? "/admin" : "/citizen";
      } else {
        setError(data.message || "Login failed.");
      }
    } catch {
      setError("Login error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authPageWrapper}>
      <div style={{ ...authCard, maxWidth: "440px" }}>
        <button onClick={onBack} style={backButton}>← Back</button>

        <div style={authLogo}>
          <span style={{ fontSize: "28px" }}>⚖️</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
        </div>

        <h2 style={authTitle}>Welcome Back</h2>
        <p style={authSubtitle}>
          {isCourtStaff ? "Staff portal — restricted access" : "Login to access your dashboard"}
        </p>

        {role && <RoleBadge role={role} />}

        {isCourtStaff && (
          <div style={infoBox("#FF6B6B", "rgba(255,80,80,0.1)", "rgba(255,100,100,0.25)")}>
            🔒 This portal is for authorized court staff only. Access is granted by administrators.
          </div>
        )}

        {error && (
          <div style={{
            padding: "10px 14px", marginBottom: "12px",
            backgroundColor: "rgba(255,80,80,0.08)",
            border: "1px solid rgba(255,80,80,0.25)",
            borderRadius: "8px", color: "#FF6B6B", fontSize: "13px",
            lineHeight: "1.6",
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={fieldLabel}>EMAIL</div>
        <input
          type="email" placeholder="you@example.com" style={authInput}
          value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
        />

        <div style={fieldLabel}>PASSWORD</div>
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            style={{ ...authInput, paddingRight: "44px" }}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
          />
          <button
            type="button"
            onClick={() => setShowPw(s => !s)}
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.4)", cursor: "pointer",
              fontSize: "16px", padding: "0", lineHeight: 1,
            }}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          style={{
            ...authPrimaryButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        {!isCourtStaff && (
          <p style={authFooterText}>
            Don't have an account?{" "}
            <span style={authLink} onClick={onRegister}>Register</span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── REGISTER PAGE ─── */
function RegisterPage({
  role,
  onSignIn,
  onBack,
}: {
  role: string | null;
  onSignIn: () => void;
  onBack: () => void;
}) {
  const [step, setStep]         = useState<"form" | "success">("form");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [district, setDistrict] = useState("");
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name = "Full name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address.";
    if (!password)     e.password = "Password is required.";
    else if (strength.passed < 3) e.password = "Password is too weak. Please strengthen it.";
    if (!district)     e.district = "Please select your district.";
    return e;
  };

  const handleRegister = async () => {
    const ve = validate();
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "citizen", district }),
      });
      const result = await res.json();
      if (res.ok) {
        setStep("success"); // ← show "check your inbox" screen
      } else {
        setErrors({ general: result.message || "Registration failed." });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Success: check your inbox ──
  if (step === "success") {
    return (
      <div style={authPageWrapper}>
        <div style={{
          ...authCard, maxWidth: "440px",
          alignItems: "center", textAlign: "center",
        }}>
          <div style={authLogo}>
            <span style={{ fontSize: "28px" }}>⚖️</span>
            <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
          </div>

          <div style={{ fontSize: "52px", marginBottom: "16px" }}>📧</div>

          <h2 style={authTitle}>Check your inbox!</h2>
          <p style={{ ...authSubtitle, marginBottom: "8px" }}>
            We sent a verification link to
          </p>
          <p style={{
            color: "#ffffff", fontSize: "15px",
            fontWeight: 600, marginBottom: "24px",
          }}>
            {email}
          </p>

          {/* Steps */}
          <div style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px", padding: "20px",
            marginBottom: "24px", textAlign: "left", width: "100%",
          }}>
            <p style={{
              color: "rgba(255,255,255,0.7)", fontSize: "14px",
              margin: "0 0 12px", lineHeight: "1.6",
            }}>
              <strong style={{ color: "white" }}>Next steps:</strong>
            </p>
            {[
              "Open your email inbox",
              `Click the "Verify My Account" button in the email`,
              "Come back here and log in",
            ].map((step, i) => (
              <p key={i} style={{
                color: "rgba(255,255,255,0.6)", fontSize: "13px",
                margin: i < 2 ? "0 0 8px" : "0", lineHeight: "1.6",
              }}>
                {i + 1}. {step}
              </p>
            ))}
          </div>

          <p style={{
            color: "rgba(255,255,255,0.35)", fontSize: "12px",
            marginBottom: "24px", lineHeight: "1.6",
          }}>
            Didn't receive it? Check your spam folder.<br />
            The link expires in <strong style={{ color: "rgba(255,255,255,0.5)" }}>24 hours</strong>.
          </p>

          <button style={authPrimaryButton} onClick={onSignIn}>
            Go to Login
          </button>

          <p style={{ ...authFooterText, marginTop: "12px", fontSize: "12px" }}>
            Wrong email?{" "}
            <span style={authLink} onClick={() => setStep("form")}>Go back</span>
          </p>
        </div>
      </div>
    );
  }

  const districts = [
    "Hyderabad","Rangareddy","Medchal-Malkajgiri","Sangareddy","Vikarabad",
    "Warangal Urban","Warangal Rural","Hanumakonda","Khammam","Nalgonda",
    "Karimnagar","Nizamabad","Adilabad","Komaram Bheem Asifabad","Mancherial",
    "Peddapalli","Jagtial","Rajanna Sircilla","Kamareddy","Medak",
    "Siddipet","Jangaon","Mahabubabad","Warangal","Suryapet",
    "Yadadri Bhuvanagiri","Mahabubnagar","Nagarkurnool","Wanaparthy",
    "Jogulamba Gadwal","Narayanpet","Mulugu","Jayashankar Bhupalpally",
    "Bhadradri Kothagudem",
  ];

  return (
    <div style={authPageWrapper}>
      <div style={{ ...authCard, maxWidth: "440px" }}>
        <button onClick={onBack} style={backButton}>← Back</button>

        <div style={authLogo}>
          <span style={{ fontSize: "28px" }}>⚖️</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
        </div>

        <h2 style={authTitle}>Create Account</h2>
        <p style={authSubtitle}>Join the digital legal platform</p>

        {role && <RoleBadge role={role} />}

        {errors.general && (
          <div style={{
            padding: "10px 14px", marginBottom: "12px",
            backgroundColor: "rgba(255,80,80,0.08)",
            border: "1px solid rgba(255,80,80,0.25)",
            borderRadius: "8px", color: "#FF6B6B", fontSize: "13px",
          }}>
            ⚠ {errors.general}
          </div>
        )}

        {/* Full Name */}
        <div style={fieldLabel}>FULL NAME</div>
        <input
          type="text" placeholder="Your full name"
          style={{
            ...authInput,
            borderColor: errors.name ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.12)",
          }}
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
        />
        {errors.name && <FieldError msg={errors.name} />}

        {/* Email */}
        <div style={fieldLabel}>EMAIL</div>
        <input
          type="email" placeholder="you@example.com"
          style={{
            ...authInput,
            borderColor: errors.email ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.12)",
          }}
          value={email}
          onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
        />
        {errors.email && <FieldError msg={errors.email} />}

        {/* Password */}
        <div style={fieldLabel}>PASSWORD</div>
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            style={{
              ...authInput, paddingRight: "44px",
              borderColor: errors.password ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.12)",
            }}
            value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
          />
          <button
            type="button"
            onClick={() => setShowPw(s => !s)}
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.4)", cursor: "pointer",
              fontSize: "16px", padding: "0", lineHeight: 1,
            }}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>
        <PasswordStrengthBar password={password} />
        {errors.password && <FieldError msg={errors.password} />}

        {/* District */}
        <div style={fieldLabel}>DISTRICT (TELANGANA)</div>
        <select
          style={{
            ...authInput, cursor: "pointer",
            borderColor: errors.district ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.12)",
          }}
          value={district}
          onChange={e => { setDistrict(e.target.value); setErrors(p => ({ ...p, district: "" })); }}
        >
          <option value="" style={{ backgroundColor: "#1a1a2e" }}>Select your district…</option>
          {districts.map(d => (
            <option key={d} value={d} style={{ backgroundColor: "#1a1a2e" }}>{d}</option>
          ))}
        </select>
        {errors.district && <FieldError msg={errors.district} />}

        <button
          style={{
            ...authPrimaryButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating Account…" : "Create Account"}
        </button>

        <p style={{ ...authFooterText, marginTop: "12px" }}>
          Already have an account?{" "}
          <span style={authLink} onClick={onSignIn}>Login</span>
        </p>
      </div>
    </div>
  );
}

/* ─── ROLE BADGE ─── */
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    Citizens:    { bg: "rgba(100,200,255,0.1)", border: "rgba(100,200,255,0.3)", text: "#90D5FF" },
    Lawyer:      { bg: "rgba(255,190,50,0.1)",  border: "rgba(255,190,50,0.3)",  text: "#FFD166" },
    court_staff: { bg: "rgba(255,100,100,0.1)", border: "rgba(255,100,100,0.3)", text: "#FF8A8A" },
  };
  const c = colors[role] || colors.Citizens;
  return (
    <div style={{
      alignSelf: "center", padding: "6px 20px",
      backgroundColor: c.bg, border: `1px solid ${c.border}`,
      borderRadius: "20px", color: c.text,
      fontSize: "13px", fontWeight: 600,
      letterSpacing: "0.5px", marginBottom: "16px",
    }}>
      {role}
    </div>
  );
}

/* ─── INFO BOX ─── */
function infoBox(textColor: string, bg: string, border: string): React.CSSProperties {
  return {
    padding: "12px 14px", backgroundColor: bg,
    border: `1px solid ${border}`, borderRadius: "10px",
    color: textColor, fontSize: "13px",
    lineHeight: "1.65", marginBottom: "16px",
  };
}

/* ─── FLOWING DOTS ─── */
function FlowingDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 176; const H = 80;
    canvas.width = W; canvas.height = H;

    const COLS = 6; const ROWS = 4;
    const gapX = W / (COLS + 1); const gapY = H / (ROWS + 1);
    let t = 0; let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = (col + 1) * gapX; const y = (row + 1) * gapY;
          const wave   = Math.sin(t - row * 0.55 + col * 0.25);
          const alpha  = 0.1 + 0.65 * ((wave + 1) / 2);
          const radius = 1.5 + 1.8  * ((wave + 1) / 2);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }
      t += 0.05; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={176} height={80} style={{ display: "block" }} />;
}

/* ════════ STYLES ════════ */

const primaryButton: React.CSSProperties = {
  padding: "12px 24px", backgroundColor: "#C4C4C4",
  border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
};
const secondaryButton: React.CSSProperties = {
  padding: "12px 24px", backgroundColor: "transparent",
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: "8px", color: "white", cursor: "pointer",
};
const cardPrimaryButton: React.CSSProperties = {
  width: "100%", padding: "12px", backgroundColor: "#ffffff", color: "#000",
  border: "none", borderRadius: "8px", cursor: "pointer",
  fontWeight: "bold", fontSize: "14px",
};
const cardSecondaryButton: React.CSSProperties = {
  width: "100%", padding: "12px", backgroundColor: "transparent", color: "white",
  border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px",
  cursor: "pointer", fontWeight: "bold", fontSize: "14px",
};
const featuresContainer: React.CSSProperties = {
  minHeight: "100vh", display: "flex",
  justifyContent: "center", alignItems: "center", backgroundColor: "#000",
};
const contactSection: React.CSSProperties = {
  backgroundImage: "url('/images/hall.jpeg')",
  backgroundSize: "cover", backgroundPosition: "center",
  backgroundRepeat: "no-repeat", backgroundAttachment: "fixed",
  minHeight: "100vh", padding: "120px 40px",
  display: "flex", justifyContent: "center", position: "relative",
};
const contactTitle: React.CSSProperties       = { fontSize: "36px", marginBottom: "20px" };
const contactDescription: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)", marginBottom: "60px", maxWidth: "700px",
};
const contactContent: React.CSSProperties = { display: "flex", gap: "60px", flexWrap: "wrap" };
const contactInfo: React.CSSProperties    = { flex: 1, minWidth: "250px", lineHeight: "2" };
const contactForm: React.CSSProperties    = {
  flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px",
};
const inputStyle: React.CSSProperties = {
  padding: "12px", backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "8px", color: "white", outline: "none",
};
const textareaStyle: React.CSSProperties = {
  padding: "12px", height: "120px", backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
  color: "white", outline: "none", resize: "none",
};
const sendButton: React.CSSProperties = {
  padding: "14px", backgroundColor: "#ffffff", color: "#000",
  border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
};
const contactGlassBox: React.CSSProperties = {
  position: "relative", zIndex: 1, width: "100%", height: "600px",
  maxWidth: "1100px", padding: "60px",
  backgroundColor: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)",
  borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", color: "white",
};
const contactOverlay: React.CSSProperties = {
  position: "absolute", top: 0, left: 0,
  width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0)",
};
const authPageWrapper: React.CSSProperties = {
  minHeight: "100vh", backgroundColor: "#0d1117",
  display: "flex", justifyContent: "center", alignItems: "flex-start",
  padding: "40px 20px", overflowY: "auto",
};
const authCard: React.CSSProperties = {
  width: "100%", maxWidth: "420px",
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px", padding: "40px",
  display: "flex", flexDirection: "column",
  marginTop: "20px", marginBottom: "40px",
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
const fieldLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.5)", fontSize: "11px",
  fontWeight: 600, letterSpacing: "1px",
  marginBottom: "8px", marginTop: "18px",
};
const authInput: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px", color: "white", outline: "none",
  fontSize: "14px", boxSizing: "border-box", marginBottom: "4px",
};
const authPrimaryButton: React.CSSProperties = {
  width: "100%", padding: "14px", backgroundColor: "#ffffff",
  border: "none", borderRadius: "8px", color: "#000",
  fontWeight: "bold", fontSize: "15px", cursor: "pointer",
  marginTop: "24px", marginBottom: "16px",
};
const authFooterText: React.CSSProperties = {
  textAlign: "center", color: "rgba(255,255,255,0.5)",
  fontSize: "14px", margin: "0",
};
const authLink: React.CSSProperties = {
  color: "#ffffff", cursor: "pointer",
  fontWeight: 600, textDecoration: "underline",
};
const backButton: React.CSSProperties = {
  background: "none", border: "none", color: "rgba(255,255,255,0.45)",
  cursor: "pointer", fontSize: "14px", padding: "0",
  marginBottom: "20px", alignSelf: "flex-start",
};