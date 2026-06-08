import { useState, useRef, useEffect } from "react";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState("home");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const navigateTo = (newPage: string, role: string | null = null) => {
    window.history.pushState({ page: newPage, role }, "", `#${newPage}`);
    setPage(newPage);
    if (role) setSelectedRole(role);
  };

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const state = e.state;
      if (state && state.page) {
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

  if (page === "signin") {
    return (
      <SignInPage
        role={selectedRole}
        onRegister={() => navigateTo("register", selectedRole)}
        onBack={() => navigateTo("home")}
      />
    );
  }

  if (page === "register") {
    return (
      <RegisterPage
        role={selectedRole}
        onSignIn={() => navigateTo("signin", selectedRole)}
        onBack={() => navigateTo("home")}
      />
    );
  }

  return (
    <>
      <div
        ref={heroRef}
        style={{
          backgroundColor: "#000",
          backgroundImage: "url('/images/hall.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          width: "100%",
          height: "100vh",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <nav
          style={{
            position: "fixed",
            top: "0",
            zIndex: 999,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "white",
            padding: "10px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "10px",
            borderRadius: "20px",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 1000px 10px 10px" }}>
            LegalMind
          </h1>

          <div style={{ display: "flex", gap: "30px" }}>
            <span style={{ cursor: "pointer" }} onClick={() => heroRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Home
            </span>
            <span style={{ cursor: "pointer" }} onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Services
            </span>
            <span style={{ cursor: "pointer" }} onClick={() => contactRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Contact
            </span>
          </div>
        </nav>

        <div
          style={{
            position: "absolute",
            top: "240px",
            left: "150px",
            width: "770px",
            height: "430px",
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            padding: "40px",
            zIndex: 1,
          }}
        >
          <h1 style={{ fontSize: "48px", marginBottom: "10px", margin: "0" }}>LegalMind</h1>
          <h2 style={{ fontSize: "24px", margin: "30px 0 8px 0" }}>Digitizing Justice. Simplifying Courts.</h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.7)", maxWidth: "500px", margin: "3px 0 220px 0" }}>
            LegalMind streamlines court case filing, tracking, and management with secure dashboards and AI-powered insights.
          </p>

          <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
            <button style={primaryButton} onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Get Started
            </button>
            <button style={secondaryButton} onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Login
            </button>
          </div>
        </div>

        <img
          src="/images/lady.png"
          alt="Lady Justice"
          style={{ position: "absolute", top: "100px", right: "180px", height: "650px", zIndex: 2 }}
        />
      </div>

      <div ref={featuresRef} style={featuresContainer}>
        <UnifiedRoleCard onSignIn={(role) => navigateTo("signin", role)} onRegister={(role) => navigateTo("register", role)} />
      </div>

      <div ref={contactRef} style={contactSection}>
        <div style={contactOverlay}></div>
        <div style={contactGlassBox}>
          <h2 style={contactTitle}>Contact LegalMind</h2>
          <p style={contactDescription}>
            For assistance with case filing, dashboard access, or technical support, please contact our team. We are committed to providing secure and reliable service.
          </p>

          <div style={contactContent}>
            <div style={contactInfo}>
              <p>
                <strong>Email:</strong> support@legalmind.com
              </p>
              <p>
                <strong>Phone:</strong> +91 98765 43210
              </p>
              <p>
                <strong>Location:</strong> Hyderabad, India
              </p>
              <p>
                <strong>Hours:</strong> Mon – Fri, 9 AM – 6 PM
              </p>
            </div>

            <div style={contactForm}>
              <input type="text" placeholder="Full Name" style={inputStyle} />
              <input type="email" placeholder="Email Address" style={inputStyle} />
              <input type="text" placeholder="Subject" style={inputStyle} />
              <textarea placeholder="Message" style={textareaStyle}></textarea>
              <button style={sendButton}>Send Message</button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#000",
          color: "white",
          textAlign: "center",
          padding: "20px 40px",
          fontSize: "14px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <p>© 2026 LegalMind. All rights reserved.</p>
        <p>
          Designed by LegalMind Team | <span style={{ cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span> |{" "}
          <span style={{ cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>
        </p>
      </div>
    </>
  );
}

function UnifiedRoleCard({ onSignIn, onRegister }: { onSignIn: (role: string) => void; onRegister: (role: string) => void }) {
  const [activeTab, setActiveTab] = useState("User");

  const roles = {
    User: {
      text:
        "File cases online, upload legal documents securely, select specialized lawyers, and track your case progress in real-time. LegalMind ensures transparency and keeps you informed at every step.",
      badge: null,
      badgeColor: null,
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <path d="M12 54c0-11 9-20 20-20s20 9 20 20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      showRegister: true,
      registerLabel: "Sign Up",
      loginLabel: "Login",
      note: null,
    },
  } as const;

  const active = roles[activeTab as keyof typeof roles];

  return (
    <div
      style={{
        width: "720px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "28px",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        color: "white",
        boxShadow: "0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "-40px",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", zIndex: 1 }}>
        {Object.keys(roles).map((role) => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            style={{
              flex: 1,
              padding: "20px 12px",
              backgroundColor: activeTab === role ? "rgba(255,255,255,0.07)" : "transparent",
              border: "none",
              borderBottom: activeTab === role ? "2px solid white" : "2px solid transparent",
              color: activeTab === role ? "white" : "rgba(255,255,255,0.35)",
              fontWeight: activeTab === role ? "700" : "400",
              fontSize: "15px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              letterSpacing: "0.5px",
            }}
          >
            {role}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", minHeight: "320px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            flex: 1,
            padding: "36px 40px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "88px",
              height: "88px",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {active.icon}
          </div>

          {active.badge && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                backgroundColor: active.badgeColor ?? undefined,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                width: "fit-content",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                }}
              />
              <span style={{ color: "white", fontSize: "12px", fontWeight: "600", letterSpacing: "0.4px" }}>{active.badge}</span>
            </div>
          )}

          <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: "1.85", fontSize: "14.5px", margin: 0 }}>{active.text}</p>

          {active.note && (
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: 0, fontStyle: "italic" }}>
              ⓘ {active.note}
            </p>
          )}
        </div>

        <div
          style={{
            width: "240px",
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <FlowingDots />

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px", width: "100%" }}>
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
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "rgba(255,100,100,0.08)",
                    border: "1px solid rgba(255,100,100,0.2)",
                    borderRadius: "8px",
                    color: "rgba(255,150,150,0.8)",
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "1.5",
                  }}
                >
                  Sign-up not available.
                  <br />
                  Contact your administrator.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInPage({ role, onRegister, onBack }: { role: string | null; onRegister: () => void; onBack: () => void }) {
  const isCourtStaff = role === "court_staff";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.removeItem("voiceGreetingDone");

        const userRole = data.user.role;

        if (userRole === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/citizen";
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Login error. Please try again.");
    }
  };

  return (
    <div style={authPageWrapper}>
      <div style={{ ...authCard, maxWidth: "440px" }}>
        <button onClick={onBack} style={backButton}>
          ← Back
        </button>

        <div style={authLogo}>
          <span style={{ fontSize: "28px" }}>⚖️</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
        </div>

        <h2 style={authTitle}>Welcome Back</h2>
        <p style={authSubtitle}>{isCourtStaff ? "Staff portal — restricted access" : "Login to access your dashboard"}</p>

        {role && <RoleBadge role={role} />}

        {isCourtStaff && (
          <div style={infoBox("#FF6B6B", "rgba(255,80,80,0.1)", "rgba(255,100,100,0.25)")}>
            🔒 This portal is for authorized court staff only. Access is granted by administrators.
          </div>
        )}

        <div style={fieldLabel}>EMAIL</div>
        <input type="email" placeholder="you@example.com" style={authInput} value={email} onChange={(e) => setEmail(e.target.value)} />

        <div style={fieldLabel}>PASSWORD</div>
        <input type="password" placeholder="••••••••" style={authInput} value={password} onChange={(e) => setPassword(e.target.value)} />

        <button style={authPrimaryButton} onClick={handleLogin}>
          Login
        </button>

        {!isCourtStaff && (
          <p style={authFooterText}>
            Don't have an account? <span style={authLink} onClick={onRegister}>Register</span>
          </p>
        )}
      </div>
    </div>
  );
}

function RegisterPage({ role, onSignIn, onBack }: { role: string | null; onSignIn: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("");

  const handleRegister = async () => {
    try {
      const backendRole = "citizen";
      const data = {
        name,
        email,
        password,
        role: backendRole,
        district,
      };

      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      alert(result.message);
      if (res.ok) {
        onSignIn();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={authPageWrapper}>
      <div style={{ ...authCard, maxWidth: "440px" }}>
        <button onClick={onBack} style={backButton}>
          ← Back
        </button>

        <div style={authLogo}>
          <span style={{ fontSize: "28px" }}>⚖️</span>
          <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
        </div>

        <h2 style={authTitle}>Create Account</h2>
        <p style={authSubtitle}>Join the digital legal platform</p>

        {role && <RoleBadge role={role} />}

        <div style={fieldLabel}>FULL NAME</div>
        <input type="text" placeholder="Your full name" style={authInput} value={name} onChange={(e) => setName(e.target.value)} />

        <div style={fieldLabel}>EMAIL</div>
        <input type="email" placeholder="you@example.com" style={authInput} value={email} onChange={(e) => setEmail(e.target.value)} />

        <div style={fieldLabel}>PASSWORD</div>
        <input type="password" placeholder="••••••••" style={authInput} value={password} onChange={(e) => setPassword(e.target.value)} />

        <div style={fieldLabel}>DISTRICT (TELANGANA)</div>
        <select style={{ ...authInput, cursor: "pointer" }} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="" style={{ backgroundColor: "#1a1a2e" }}>
            Select your district…
          </option>
          {[
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
          ].map((d) => (
            <option key={d} value={d} style={{ backgroundColor: "#1a1a2e" }}>
              {d}
            </option>
          ))}
        </select>

        <button style={authPrimaryButton} onClick={handleRegister}>
          Create Account
        </button>

        <p style={{ ...authFooterText, marginTop: "12px" }}>
          Already have an account? <span style={authLink} onClick={onSignIn}>Login</span>
        </p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    User: { bg: "rgba(100,200,255,0.1)", border: "rgba(100,200,255,0.3)", text: "#90D5FF" },
    Lawyer: { bg: "rgba(255,190,50,0.1)", border: "rgba(255,190,50,0.3)", text: "#FFD166" },
    court_staff: { bg: "rgba(255,100,100,0.1)", border: "rgba(255,100,100,0.3)", text: "#FF8A8A" },
  };

  const c = colors[role] || colors.User;

  return (
    <div
      style={{
        alignSelf: "center",
        padding: "6px 20px",
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "20px",
        color: c.text,
        fontSize: "13px",
        fontWeight: "600",
        letterSpacing: "0.5px",
        marginBottom: "16px",
      }}
    >
      {role}
    </div>
  );
}

function infoBox(textColor: string, bg: string, border: string) {
  return {
    padding: "12px 14px",
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: "10px",
    color: textColor,
    fontSize: "13px",
    lineHeight: "1.65",
    marginBottom: "16px",
  };
}

function FlowingDots() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 176;
    const H = 80;
    canvas.width = W;
    canvas.height = H;

    const COLS = 6;
    const ROWS = 4;
    const gapX = W / (COLS + 1);
    const gapY = H / (ROWS + 1);
    let t = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = (col + 1) * gapX;
          const y = (row + 1) * gapY;
          const wave = Math.sin(t - row * 0.55 + col * 0.25);
          const alpha = 0.1 + 0.65 * ((wave + 1) / 2);
          const radius = 1.5 + 1.8 * ((wave + 1) / 2);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }
      t += 0.05;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={176} height={80} style={{ display: "block" }} />;
}

const primaryButton = {
  padding: "12px 24px",
  backgroundColor: "#C4C4C4",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButton = {
  padding: "12px 24px",
  backgroundColor: "transparent",
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
};

const cardPrimaryButton = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#ffffff",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const cardSecondaryButton = {
  width: "100%",
  padding: "12px",
  backgroundColor: "transparent",
  color: "white",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "14px",
};

const featuresContainer = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#000",
};

const contactSection = {
  backgroundImage: "url('/images/hall.jpeg')",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  minHeight: "100vh",
  padding: "120px 40px",
  display: "flex",
  justifyContent: "center",
  position: "relative",
};

const contactTitle = { fontSize: "36px", marginBottom: "20px" };
const contactDescription = { color: "rgba(255,255,255,0.7)", marginBottom: "60px", maxWidth: "700px" };
const contactContent = { display: "flex", gap: "60px", flexWrap: "wrap" };
const contactInfo = { flex: 1, minWidth: "250px", lineHeight: "2" };
const contactForm = { flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" };

const inputStyle = {
  padding: "12px",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "8px",
  color: "white",
  outline: "none",
};

const textareaStyle = {
  padding: "12px",
  height: "120px",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "8px",
  color: "white",
  outline: "none",
  resize: "none",
};

const sendButton = {
  padding: "14px",
  backgroundColor: "#ffffff",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
};

const contactGlassBox = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  height: "600px",
  maxWidth: "1100px",
  padding: "60px",
  backgroundColor: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(15px)",
  WebkitBackdropFilter: "blur(15px)",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white",
};

const contactOverlay = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0)",
};

const authPageWrapper = {
  minHeight: "100vh",
  backgroundColor: "#0d1117",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "40px 20px",
  overflowY: "auto",
};

const authCard = {
  width: "100%",
  maxWidth: "420px",
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px",
  padding: "40px",
  display: "flex",
  flexDirection: "column",
  marginTop: "20px",
  marginBottom: "40px",
};

const authLogo = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  justifyContent: "center",
  marginBottom: "24px",
};

const authTitle = {
  color: "white",
  fontSize: "26px",
  fontWeight: "bold",
  textAlign: "center",
  margin: "0 0 8px 0",
};

const authSubtitle = {
  color: "rgba(255,255,255,0.5)",
  textAlign: "center",
  fontSize: "14px",
  margin: "0 0 24px 0",
};

const fieldLabel = {
  color: "rgba(255,255,255,0.5)",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1px",
  marginBottom: "8px",
  marginTop: "18px",
};

const authInput = {
  width: "100%",
  padding: "12px 14px",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  color: "white",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
  marginBottom: "4px",
};

const authPrimaryButton = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#ffffff",
  border: "none",
  borderRadius: "8px",
  color: "#000",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "24px",
  marginBottom: "16px",
};

const authFooterText = {
  textAlign: "center",
  color: "rgba(255,255,255,0.5)",
  fontSize: "14px",
  margin: "0",
};

const authLink = {
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: "600",
  textDecoration: "underline",
};

const backButton = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.45)",
  cursor: "pointer",
  fontSize: "14px",
  padding: "0",
  marginBottom: "20px",
  alignSelf: "flex-start",
};