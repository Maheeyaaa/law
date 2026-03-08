import { useState, useRef, useEffect } from "react";

export default function Home() {

    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const contactRef = useRef(null);

    const [page, setPage] = useState("home");
    const [selectedRole, setSelectedRole] = useState(null); // role chosen from the card

    // Sync page state with browser history
    const navigateTo = (newPage, role = null) => {
        window.history.pushState({ page: newPage, role }, "", `#${newPage}`);
        setPage(newPage);
        if (role) setSelectedRole(role);
    };

    // Handle browser back/forward
    useEffect(() => {
        const onPop = (e) => {
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
        // Set initial history entry
        window.history.replaceState({ page: "home", role: null }, "", "#home");
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    if (page === "signin") return (
        <SignInPage
            role={selectedRole}
            onRegister={() => navigateTo("register", selectedRole)}
        />
    );
    if (page === "register") return (
        <RegisterPage
            role={selectedRole}
            onSignIn={() => navigateTo("signin", selectedRole)}
        />
    );

    return (
        <>
            {/* HERO SECTION */}
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
                {/* Navbar */}
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
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 1000px 10px 10px"}}>
                        LegalMind
                    </h1>
                    <div style={{ display: "flex", gap: "30px" }}>
                        <span style={{ cursor: "pointer" }} onClick={() => heroRef.current.scrollIntoView({ behavior: 'smooth' })}>Home</span>
                        <span style={{ cursor: "pointer" }} onClick={() => featuresRef.current.scrollIntoView({ behavior: 'smooth' })}>Services</span>
                        <span style={{ cursor: "pointer" }} onClick={() => contactRef.current.scrollIntoView({ behavior: 'smooth' })}>Contact</span>
                    </div>
                </nav>

                {/* Glass Box */}
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
                        LegalMind streamlines court case filing, tracking, and management
                        with secure dashboards and AI-powered insights.
                    </p>
                    <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
                        <button style={primaryButton} onClick={() => featuresRef.current.scrollIntoView({ behavior: 'smooth' })}>Get Started</button>
                        <button style={secondaryButton} onClick={() => featuresRef.current.scrollIntoView({ behavior: 'smooth' })}>Login</button>
                    </div>
                </div>

                {/* Statue */}
                <img
                    src="/images/lady.png"
                    alt="Lady Justice"
                    style={{ position: "absolute", top: "100px", right: "180px", height: "650px", zIndex: 2 }}
                />
            </div>

            {/* FEATURES SECTION */}
            <div ref={featuresRef} style={featuresContainer}>
                <UnifiedRoleCard
                    onSignIn={(role) => navigateTo("signin", role)}
                    onRegister={(role) => navigateTo("register", role)}
                />
            </div>

            {/* CONTACT SECTION */}
            <div ref={contactRef} style={contactSection}>
                <div style={contactOverlay}></div>
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
                            <input type="text" placeholder="Full Name" style={inputStyle} />
                            <input type="email" placeholder="Email Address" style={inputStyle} />
                            <input type="text" placeholder="Subject" style={inputStyle} />
                            <textarea placeholder="Message" style={textareaStyle}></textarea>
                            <button style={sendButton}>Send Message</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{
                backgroundColor: "#000", color: "white", textAlign: "center",
                padding: "20px 40px", fontSize: "14px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
            }}>
                <p>© 2026 LegalMind. All rights reserved.</p>
                <p>
                    Designed by LegalMind Team |{" "}
                    <span style={{ cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span> |{" "}
                    <span style={{ cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>
                </p>
            </div>
        </>
    );
}


/* ─── UNIFIED ROLE CARD ─── */
function UnifiedRoleCard({ onSignIn, onRegister }) {
    const [activeTab, setActiveTab] = useState("Citizens");

    const roles = {
        Citizens: {
            text: "File cases online, upload legal documents securely, select specialized lawyers, and track your case progress in real-time. JusticeLink ensures transparency and keeps you informed at every step.",
            icon: (
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                    <path d="M12 54c0-11 9-20 20-20s20 9 20 20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            ),
        },
        Lawyer: {
            text: "Manage assigned cases, communicate with clients, upload documents, and stay updated with hearing schedules. Improve efficiency with organized digital workflows.",
            icon: (
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M20 12h24M20 24h24M20 36h14" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="10" y="6" width="44" height="52" rx="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                    <circle cx="46" cy="46" r="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                    <path d="M52 52l5 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            ),
        },
        "Court Staff": {
            text: "Verify filings, assign case numbers, schedule hearings, assign judges, and upload official orders securely. JusticeLink simplifies court administration with role-based access control.",
            icon: (
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M32 8L10 22v4h44v-4L32 8z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
                    <rect x="16" y="26" width="6" height="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                    <rect x="29" y="26" width="6" height="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                    <rect x="42" y="26" width="6" height="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                    <path d="M8 48h48" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M4 56h56" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            ),
        },
    };

    const active = roles[activeTab];

    return (
        <div style={{
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
        }}>

            {/* Decorative corner glow */}
            <div style={{
                position: "absolute", top: "-60px", right: "-60px",
                width: "200px", height: "200px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: "-80px", left: "-40px",
                width: "250px", height: "250px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            {/* Tab Headers */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", zIndex: 1 }}>
                {Object.keys(roles).map(role => (
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

            {/* Body — two columns */}
            <div style={{ display: "flex", minHeight: "300px", position: "relative", zIndex: 1 }}>

                {/* Left: icon + description */}
                <div style={{
                    flex: 1,
                    padding: "44px 40px",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "28px",
                }}>
                    {/* Large decorative icon */}
                    <div style={{
                        width: "88px", height: "88px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: "22px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}>
                        {active.icon}
                    </div>

                    <p style={{
                        color: "rgba(255,255,255,0.65)",
                        lineHeight: "1.85",
                        fontSize: "14.5px",
                        margin: 0,
                    }}>
                        {active.text}
                    </p>
                </div>

                {/* Right: flowing dots + buttons */}
                <div style={{
                    width: "240px",
                    padding: "44px 32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <FlowingDots />

                    {/* Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px", width: "100%" }}>
                        <button style={cardPrimaryButton} onClick={() => onRegister(activeTab)}>Sign Up</button>
                        <button style={cardSecondaryButton} onClick={() => onSignIn(activeTab)}>Login</button>
                    </div>
                </div>

            </div>
        </div>
    );
}


/* ─── SIGN IN PAGE ─── */
function SignInPage({ role, onRegister }) {
    return (
        <div style={authPageWrapper}>
            <div style={authCard}>
                <div style={authLogo}>
                    <span style={{ fontSize: "28px" }}>⚖️</span>
                    <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
                </div>

                <h2 style={authTitle}>Welcome Back</h2>
                <p style={authSubtitle}>Login to access your dashboard</p>

                {/* Show selected role as a read-only badge */}
                {role && (
                    <div style={roleBadge}>{role}</div>
                )}

                <div style={fieldLabel}>EMAIL</div>
                <input type="email" placeholder="you@example.com" style={authInput} />

                <div style={fieldLabel}>PASSWORD</div>
                <input type="password" placeholder="••••••••" style={authInput} />

                <button style={authPrimaryButton}>Login</button>

                <p style={authFooterText}>
                    Don't have an account?{" "}
                    <span style={authLink} onClick={onRegister}>Register</span>
                </p>
            </div>
        </div>
    );
}


/* ─── REGISTER PAGE ─── */
function RegisterPage({ role, onSignIn }) {
    return (
        <div style={authPageWrapper}>
            <div style={authCard}>
                <div style={authLogo}>
                    <span style={{ fontSize: "28px" }}>⚖️</span>
                    <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
                </div>

                <h2 style={authTitle}>Create Account</h2>
                <p style={authSubtitle}>Join the digital legal platform</p>

                {/* Show selected role as a read-only badge */}
                {role && (
                    <div style={roleBadge}>{role}</div>
                )}

                <div style={fieldLabel}>FULL NAME</div>
                <input type="text" placeholder="Your full name" style={authInput} />

                <div style={fieldLabel}>EMAIL</div>
                <input type="email" placeholder="you@example.com" style={authInput} />

                <div style={fieldLabel}>PASSWORD</div>
                <input type="password" placeholder="••••••••" style={authInput} />

                <button style={authPrimaryButton}>Create Account</button>

                <p style={authFooterText}>
                    Already have an account?{" "}
                    <span style={authLink} onClick={onSignIn}>Login</span>
                </p>
            </div>
        </div>
    );
}


/* ─── FLOWING DOTS CANVAS ─── */
function FlowingDots() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const W = 176;
        const H = 80;
        canvas.width = W;
        canvas.height = H;

        const COLS = 6;
        const ROWS = 4;
        const gapX = W / (COLS + 1);
        const gapY = H / (ROWS + 1);

        let t = 0;
        let raf;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    const x = (col + 1) * gapX;
                    const y = (row + 1) * gapY;
                    // Flow downward: subtract row so wave travels top→bottom
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


/* ════════════════ STYLES ════════════════ */

const primaryButton = {
    padding: "12px 24px", backgroundColor: "#C4C4C4",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
};

const secondaryButton = {
    padding: "12px 24px", backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.4)", borderRadius: "8px",
    color: "white", cursor: "pointer",
};

const cardPrimaryButton = {
    width: "100%", padding: "12px", backgroundColor: "#ffffff", color: "#000",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px",
};

const cardSecondaryButton = {
    width: "100%", padding: "12px", backgroundColor: "transparent", color: "white",
    border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px",
    cursor: "pointer", fontWeight: "bold", fontSize: "14px",
};

const featuresContainer = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, #000 70%)",
};

const contactSection = {
    backgroundImage: "url('/images/hall.jpeg')",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    backgroundSize: "cover", backgroundPosition: "center",
    backgroundRepeat: "no-repeat", backgroundAttachment: "fixed",
    minHeight: "100vh", padding: "120px 40px",
    display: "flex", justifyContent: "center", position: "relative",
};

const contactTitle = { fontSize: "36px", marginBottom: "20px" };
const contactDescription = { color: "rgba(255,255,255,0.7)", marginBottom: "60px", maxWidth: "700px" };
const contactContent = { display: "flex", gap: "60px", flexWrap: "wrap" };
const contactInfo = { flex: 1, minWidth: "250px", lineHeight: "2" };
const contactForm = { flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" };

const inputStyle = {
    padding: "12px", backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
    color: "white", outline: "none",
};

const textareaStyle = {
    padding: "12px", height: "120px", backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
    color: "white", outline: "none", resize: "none",
};

const sendButton = {
    padding: "14px", backgroundColor: "#ffffff", color: "#000",
    border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
};

const contactGlassBox = {
    position: "relative", zIndex: 1, width: "100%", height: "600px",
    maxWidth: "1100px", padding: "60px",
    backgroundColor: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)",
    borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", color: "white",
};

const contactOverlay = {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0)",
};

/* ─── AUTH STYLES ─── */

const authPageWrapper = {
    minHeight: "100vh", backgroundColor: "#0d1117",
    display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px",
};

const authCard = {
    width: "100%", maxWidth: "420px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px", padding: "40px", display: "flex", flexDirection: "column",
};

const authLogo = {
    display: "flex", alignItems: "center", gap: "10px",
    justifyContent: "center", marginBottom: "24px",
};

const authTitle = {
    color: "white", fontSize: "26px", fontWeight: "bold",
    textAlign: "center", margin: "0 0 8px 0",
};

const authSubtitle = {
    color: "rgba(255,255,255,0.5)", textAlign: "center",
    fontSize: "14px", margin: "0 0 24px 0",
};

const roleBadge = {
    alignSelf: "center",
    padding: "6px 20px",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "20px",
    color: "white",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    marginBottom: "20px",
};

const fieldLabel = {
    color: "rgba(255,255,255,0.5)", fontSize: "11px",
    fontWeight: "600", letterSpacing: "1px",
    marginBottom: "8px", marginTop: "18px",
};

const authInput = {
    width: "100%", padding: "12px 14px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px", color: "white", outline: "none",
    fontSize: "14px", boxSizing: "border-box", marginBottom: "4px",
};

const authPrimaryButton = {
    width: "100%", padding: "14px", backgroundColor: "#ffffff",
    border: "none", borderRadius: "8px", color: "#000",
    fontWeight: "bold", fontSize: "15px", cursor: "pointer",
    marginTop: "24px", marginBottom: "16px",
};

const authFooterText = {
    textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0",
};

const authLink = {
    color: "#ffffff", cursor: "pointer", fontWeight: "600", textDecoration: "underline",
};