import { useState, useRef, useEffect } from "react";

export default function Home() {

    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const contactRef = useRef(null);

    const [page, setPage] = useState("home");
    const [selectedRole, setSelectedRole] = useState(null);

    const navigateTo = (newPage, role = null) => {
        window.history.pushState({ page: newPage, role }, "", `#${newPage}`);
        setPage(newPage);
        if (role) setSelectedRole(role);
    };

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
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 1000px 10px 10px" }}>
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
            text: "File cases online, upload legal documents securely, select specialized lawyers, and track your case progress in real-time. LegalMind ensures transparency and keeps you informed at every step.",
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
        Lawyer: {
            text: "Register with your Bar Council enrollment number, specialization, and license. Your account will be reviewed by court staff before activation. Once verified, you'll appear in the Find Lawyers directory for citizens.",
            badge: "Verification Required",
            badgeColor: "rgba(255,190,50,0.15)",
            badgeBorder: "rgba(255,190,50,0.4)",
            badgeText: "#FFD166",
            icon: (
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M20 12h24M20 24h24M20 36h14" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="10" y="6" width="44" height="52" rx="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    <circle cx="46" cy="46" r="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    <path d="M52 52l5 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            ),
            showRegister: true,
            registerLabel: "Apply as Lawyer",
            loginLabel: "Lawyer Login",
            note: "New accounts require admin approval before activation.",
        },
        "Court Staff": {
            text: "Court staff accounts are created exclusively by the administrator to protect sensitive court operations. Staff members manage lawyer verifications, case assignments, and administrative actions.",
            badge: "Admin Access Only",
            badgeColor: "rgba(255,80,80,0.12)",
            badgeBorder: "rgba(255,100,100,0.4)",
            badgeText: "#FF6B6B",
            icon: (
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M32 8L10 22v4h44v-4L32 8z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinejoin="round" />
                    <rect x="16" y="26" width="6" height="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    <rect x="29" y="26" width="6" height="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    <rect x="42" y="26" width="6" height="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    <path d="M8 48h48" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M4 56h56" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            showRegister: false,
            registerLabel: null,
            loginLabel: "Staff Login",
            note: "Account creation is restricted to administrators only.",
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

            {/* Tab Headers */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", zIndex: 1 }}>
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
                            fontWeight: activeTab === role ? "700" : "400",
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

                {/* Left: icon + description */}
                <div style={{
                    flex: 1, padding: "36px 40px",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", flexDirection: "column", gap: "20px",
                }}>
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

                    {/* Status badge */}
                    {active.badge && (
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "5px 12px",
                            backgroundColor: active.badgeColor,
                            border: `1px solid ${active.badgeBorder}`,
                            borderRadius: "20px",
                            width: "fit-content",
                        }}>
                            <div style={{
                                width: "6px", height: "6px", borderRadius: "50%",
                                backgroundColor: active.badgeText,
                            }} />
                            <span style={{ color: active.badgeText, fontSize: "12px", fontWeight: "600", letterSpacing: "0.4px" }}>
                                {active.badge}
                            </span>
                        </div>
                    )}

                    <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: "1.85", fontSize: "14.5px", margin: 0 }}>
                        {active.text}
                    </p>

                    {active.note && (
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", margin: 0, fontStyle: "italic" }}>
                            ⓘ {active.note}
                        </p>
                    )}
                </div>

                {/* Right: flowing dots + buttons */}
                <div style={{
                    width: "240px", padding: "36px 32px",
                    display: "flex", flexDirection: "column",
                    justifyContent: "space-between", alignItems: "center",
                }}>
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
                                {/* Court Staff: login only, no sign up */}
                                <button style={cardPrimaryButton} onClick={() => onSignIn(activeTab)}>
                                    {active.loginLabel}
                                </button>
                                <div style={{
                                    padding: "10px 12px",
                                    backgroundColor: "rgba(255,100,100,0.08)",
                                    border: "1px solid rgba(255,100,100,0.2)",
                                    borderRadius: "8px",
                                    color: "rgba(255,150,150,0.8)",
                                    fontSize: "12px",
                                    textAlign: "center",
                                    lineHeight: "1.5",
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
function SignInPage({ role, onRegister, onBack }) {
    const isCourtStaff = role === "Court Staff";
    const isLawyer = role === "Lawyer";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {

            const res = await fetch("http://localhost:5000/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
            });

            const data = await res.json();

            if (data.token) {

            localStorage.setItem("token", data.token);

            alert("Login successful");
            window.location.href = "/";

            } else {
            alert(data.message);
            }

        } catch (error) {
            console.error(error);
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

                {isLawyer && (
                    <div style={infoBox("#FFD166", "rgba(255,190,50,0.08)", "rgba(255,190,50,0.25)")}>
                        ⚠️ Pending verification accounts cannot log in until approved by court staff.
                    </div>
                )}

                <div style={fieldLabel}>EMAIL</div>
                <input
                    type="email"
                    placeholder="you@example.com"
                    style={authInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />



                <div style={fieldLabel}>PASSWORD</div>
                <input
                    type="password"
                    placeholder="••••••••"
                    style={authInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    style={authPrimaryButton}
                    onClick={handleLogin}
                    >
                    Login
                </button>

                {!isCourtStaff && (
                    <p style={authFooterText}>
                        {isLawyer ? "Want to apply? " : "Don't have an account? "}
                        <span style={authLink} onClick={onRegister}>
                            {isLawyer ? "Apply as Lawyer" : "Register"}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}


/* ─── REGISTER PAGE ─── */
function RegisterPage({ role, onSignIn, onBack }) {
    const isCitizen = role === "Citizens";
    const isLawyer = role === "Lawyer";
    const [fileName, setFileName] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [barCouncilNumber, setBarCouncilNumber] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [experience, setExperience] = useState("");

    const handleRegister = async () => {
        try {
            const backendRole =
                role === "Citizens"
                    ? "citizen"
                    : role === "Lawyer"
                    ? "lawyer"
                    : "Court Staff";

            const data = {
            name,
            email,
            password,
            role: backendRole
            };

            if (backendRole === "lawyer") {
            data.barCouncilNumber = barCouncilNumber;
            data.specialization = specialization;
            data.experience = experience;
            }

            const res = await fetch("http://localhost:5000/api/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
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

    const handleFile = (e) => {
        const f = e.target.files[0];
        setFileName(f ? f.name : null);
    };

    if (!isCitizen && !isLawyer) {
        // Court Staff — no public registration
        return (
            <div style={authPageWrapper}>
                <div style={authCard}>
                    <button onClick={onBack} style={backButton}>← Back</button>
                    <div style={authLogo}>
                        <span style={{ fontSize: "28px" }}>⚖️</span>
                        <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
                        <h2 style={{ ...authTitle, marginBottom: "12px" }}>Access Restricted</h2>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.7", marginBottom: "28px" }}>
                            Court Staff accounts are created exclusively by the platform administrator.
                            Public registration is not available for this role to protect sensitive court operations.
                        </p>
                        <div style={infoBox("#FF6B6B", "rgba(255,80,80,0.1)", "rgba(255,100,100,0.25)")}>
                            Please contact your court administrator to request account access.
                        </div>
                        <button style={{ ...authPrimaryButton, marginTop: "24px" }} onClick={onSignIn}>
                            Go to Staff Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={authPageWrapper}>
            <div style={{ ...authCard, maxWidth: isLawyer ? "500px" : "440px" }}>
                <button onClick={onBack} style={backButton}>← Back</button>

                <div style={authLogo}>
                    <span style={{ fontSize: "28px" }}>⚖️</span>
                    <span style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>LegalMind</span>
                </div>

                <h2 style={authTitle}>
                    {isCitizen ? "Create Account" : "Apply as Lawyer"}
                </h2>
                <p style={authSubtitle}>
                    {isCitizen ? "Join the digital legal platform" : "Submit your credentials for verification"}
                </p>

                {role && <RoleBadge role={role} />}

                {isLawyer && (
                    <div style={infoBox("#FFD166", "rgba(255,190,50,0.08)", "rgba(255,190,50,0.25)")}>
                        ⏳ Your account will be <strong style={{ color: "#FFD166" }}>pending verification</strong> after submission. Court staff will review your documents and activate your account if approved.
                    </div>
                )}

                {/* Common fields */}
                <div style={fieldLabel}>FULL NAME</div>
                <input
                    type="text"
                    placeholder="Your full name"
                    style={authInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div style={fieldLabel}>EMAIL</div>
                <input
                    type="email"
                    placeholder="you@example.com"
                    style={authInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div style={fieldLabel}>PASSWORD</div>
                <input
                    type="password"
                    placeholder="••••••••"
                    style={authInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Lawyer-only fields */}
                {isLawyer && (
                    <>
                        <div style={sectionDivider}>Professional Details</div>

                        <div style={fieldLabel}>BAR COUNCIL ENROLLMENT NUMBER</div>
                        <input
                            type="text"
                            placeholder="e.g. AP/1234/2018"
                            style={authInput}
                            value={barCouncilNumber}
                            onChange={(e) => setBarCouncilNumber(e.target.value)}
                        />

                        <div style={fieldLabel}>YEARS OF EXPERIENCE</div>
                        <input
                            type="number"
                            placeholder="e.g. 5"
                            min="0"
                            max="60"
                            style={authInput}
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                        />

                        <div style={fieldLabel}>SPECIALIZATION</div>
                        <select
                            style={{ ...authInput, cursor: "pointer" }}
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                        >
                            <option value="" style={{ backgroundColor: "#1a1a2e" }}>Select specialization…</option>
                            <option value="criminal" style={{ backgroundColor: "#1a1a2e" }}>Criminal Law</option>
                            <option value="civil" style={{ backgroundColor: "#1a1a2e" }}>Civil Law</option>
                            <option value="corporate" style={{ backgroundColor: "#1a1a2e" }}>Corporate Law</option>
                            <option value="family" style={{ backgroundColor: "#1a1a2e" }}>Family Law</option>
                            <option value="property" style={{ backgroundColor: "#1a1a2e" }}>Property Law</option>
                            <option value="intellectual" style={{ backgroundColor: "#1a1a2e" }}>Intellectual Property</option>
                            <option value="tax" style={{ backgroundColor: "#1a1a2e" }}>Tax Law</option>
                            <option value="other" style={{ backgroundColor: "#1a1a2e" }}>Other</option>
                        </select>

                        <div style={sectionDivider}>License Document</div>

                        <div style={fieldLabel}>UPLOAD BAR COUNCIL CERTIFICATE</div>
                        <label style={fileUploadLabel}>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ display: "none" }}
                                onChange={handleFile}
                            />
                            <div style={fileUploadInner}>
                                <span style={{ fontSize: "24px" }}>📄</span>
                                <span style={{ color: fileName ? "white" : "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                                    {fileName || "Click to upload PDF, JPG, or PNG"}
                                </span>
                            </div>
                        </label>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "6px" }}>
                            Max file size: 5MB. Accepted formats: PDF, JPG, PNG.
                        </p>
                    </>
                )}

                <button
                    style={authPrimaryButton}
                    onClick={handleRegister}
                    >
                    {isCitizen ? "Create Account" : "Submit Application"}
                </button>

                {isLawyer && (
                    <p style={{ ...authFooterText, color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "8px" }}>
                        You'll receive an email once your account has been reviewed.
                    </p>
                )}

                <p style={{ ...authFooterText, marginTop: "12px" }}>
                    Already have an account?{" "}
                    <span style={authLink} onClick={onSignIn}>Login</span>
                </p>
            </div>
        </div>
    );
}


/* ─── ROLE BADGE ─── */
function RoleBadge({ role }) {
    const colors = {
        Citizens: { bg: "rgba(100,200,255,0.1)", border: "rgba(100,200,255,0.3)", text: "#90D5FF" },
        Lawyer: { bg: "rgba(255,190,50,0.1)", border: "rgba(255,190,50,0.3)", text: "#FFD166" },
        "Court Staff": { bg: "rgba(255,100,100,0.1)", border: "rgba(255,100,100,0.3)", text: "#FF8A8A" },
    };
    const c = colors[role] || colors.Citizens;
    return (
        <div style={{
            alignSelf: "center", padding: "6px 20px",
            backgroundColor: c.bg, border: `1px solid ${c.border}`,
            borderRadius: "20px", color: c.text,
            fontSize: "13px", fontWeight: "600",
            letterSpacing: "0.5px", marginBottom: "16px",
        }}>
            {role}
        </div>
    );
}


/* ─── INFO BOX ─── */
function infoBox(textColor, bg, border) {
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


/* ─── FLOWING DOTS CANVAS ─── */
function FlowingDots() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const W = 176; const H = 80;
        canvas.width = W; canvas.height = H;

        const COLS = 6; const ROWS = 4;
        const gapX = W / (COLS + 1); const gapY = H / (ROWS + 1);
        let t = 0; let raf;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    const x = (col + 1) * gapX; const y = (row + 1) * gapY;
                    const wave = Math.sin(t - row * 0.55 + col * 0.25);
                    const alpha = 0.1 + 0.65 * ((wave + 1) / 2);
                    const radius = 1.5 + 1.8 * ((wave + 1) / 2);
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
    display: "flex", justifyContent: "center", alignItems: "flex-start",
    padding: "40px 20px", overflowY: "auto",
};

const authCard = {
    width: "100%", maxWidth: "420px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px", padding: "40px",
    display: "flex", flexDirection: "column",
    marginTop: "20px", marginBottom: "40px",
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

const backButton = {
    background: "none", border: "none", color: "rgba(255,255,255,0.45)",
    cursor: "pointer", fontSize: "14px", padding: "0", marginBottom: "20px",
    alignSelf: "flex-start",
};

const sectionDivider = {
    color: "rgba(255,255,255,0.35)", fontSize: "11px", fontWeight: "700",
    letterSpacing: "1.5px", textTransform: "uppercase",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "20px", marginTop: "20px",
};

const fileUploadLabel = {
    cursor: "pointer", display: "block",
};

const fileUploadInner = {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "10px", padding: "20px",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.2)",
    borderRadius: "8px", transition: "border-color 0.2s",
};