import { useState, useRef, useEffect } from "react";

/* 4 unique colors — one per section/role */
const GOLD   = "#C9A84C";  // Landing page
const TEAL   = "#1ABCB0";  // Citizens
const ORANGE = "#F97316";  // Lawyer
const PURPLE = "#A78BFA";  // Court Staff

function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);
    return width;
}

export default function Home() {

    const heroRef     = useRef(null);
    const featuresRef = useRef(null);
    const contactRef  = useRef(null);
    const width       = useWindowWidth();

    const isMobile = width < 768;
    const isTablet = width < 1100;

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
                    backgroundAttachment: isMobile ? "scroll" : "fixed",
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
                        padding: isMobile ? "10px 16px" : "10px 40px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        margin: "10px",
                        borderRadius: "20px",
                        left: 0,
                        right: 0,
                        boxSizing: "border-box",
                        width: "calc(100% - 20px)",
                    }}
                >
                    <h1 style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "bold", margin: "10px 10px", color: GOLD }}>
                        LegalMind
                    </h1>

                    <div style={{ display: "flex", gap: isMobile ? "16px" : "30px" }}>
                        <span style={{ cursor: "pointer", color: TEAL,   fontSize: isMobile ? "13px" : "16px" }} onClick={() => heroRef.current.scrollIntoView({ behavior: 'smooth' })}>Home</span>
                        <span style={{ cursor: "pointer", color: ORANGE, fontSize: isMobile ? "13px" : "16px" }} onClick={() => featuresRef.current.scrollIntoView({ behavior: 'smooth' })}>Services</span>
                        <span style={{ cursor: "pointer", color: PURPLE, fontSize: isMobile ? "13px" : "16px" }} onClick={() => contactRef.current.scrollIntoView({ behavior: 'smooth' })}>Contact</span>
                    </div>
                </nav>

                {/* Glass Box */}
                <div
                    style={{
                        position: "absolute",
                        top: isMobile ? "100px" : "240px",
                        left: isMobile ? "16px" : isTablet ? "40px" : "150px",
                        width: isMobile ? "calc(100% - 32px)" : isTablet ? "calc(100% - 80px)" : "770px",
                        height: isMobile ? "auto" : "430px",
                        backgroundColor: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderRadius: "20px",
                        border: `1px solid rgba(201,168,76,0.35)`,
                        color: "white",
                        padding: isMobile ? "24px" : "40px",
                        zIndex: 1,
                    }}
                >
                    <h1 style={{ fontSize: isMobile ? "32px" : "48px", marginBottom: "10px", margin: "0", color: GOLD }}>
                        LegalMind
                    </h1>

                    <h2 style={{ fontSize: isMobile ? "16px" : "24px", margin: "20px 0 8px 0", color: TEAL }}>
                        Digitizing Justice. Simplifying Courts.
                    </h2>

                    <p style={{
                        fontSize: isMobile ? "14px" : "18px",
                        color: "rgba(255,255,255,0.7)",
                        maxWidth: "500px",
                        margin: isMobile ? "8px 0 24px 0" : "3px 0 220px 0",
                    }}>
                        LegalMind streamlines court case filing, tracking, and management
                        with <span style={{ color: ORANGE }}>secure dashboards</span> and <span style={{ color: ORANGE }}>AI-powered insights</span>.
                    </p>

                    <div style={{ marginTop: isMobile ? "0" : "30px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
                        <button style={{ ...primaryButton, background: `linear-gradient(135deg, ${GOLD}, #E8CC7A)`, color: "#000" }}>
                            Get Started
                        </button>
                        <button style={{ ...secondaryButton, borderColor: TEAL, color: TEAL }}>
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Statue — hidden on mobile so it doesn't overlap */}
                {!isMobile && (
                    <img
                        src="/images/lady.png"
                        alt="Lady Justice"
                        style={{
                            position: "absolute",
                            top: "100px",
                            right: isTablet ? "40px" : "180px",
                            height: isTablet ? "500px" : "650px",
                            zIndex: 2,
                        }}
                    />
                )}

            </div>

            {/* FEATURES SECTION */}
            <div ref={featuresRef} style={{
                backgroundColor: "#000",
                minHeight: "100vh",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "40px",
                flexWrap: "wrap",
                padding: isMobile ? "60px 16px" : "60px 40px",
                position: "relative",
                overflow: "hidden",
            }}>

                {/* Background color glow blobs — one per card color */}
                <div style={{
                    position: "absolute",
                    top: "50%", left: "15%",
                    transform: "translate(-50%, -50%)",
                    width: "400px", height: "400px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${TEAL}22 0%, transparent 70%)`,
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "400px", height: "400px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${ORANGE}22 0%, transparent 70%)`,
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute",
                    top: "50%", left: "85%",
                    transform: "translate(-50%, -50%)",
                    width: "400px", height: "400px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${PURPLE}22 0%, transparent 70%)`,
                    pointerEvents: "none",
                }} />

                <FeatureCard
                    title="Citizens"
                    accent={TEAL}
                    isMobile={isMobile}
                    text="File cases online, upload legal documents securely, select specialized lawyers,
                     and track your case progress in real-time. JusticeLink ensures transparency and 
                     keeps you informed at every step."
                />

                <FeatureCard
                    title="Lawyer"
                    accent={ORANGE}
                    isMobile={isMobile}
                    text="Manage assigned cases, communicate with clients, upload documents, and stay updated 
                    with hearing schedules. Improve efficiency with organized digital workflows."
                />

                <FeatureCard
                    title="Court Staff"
                    accent={PURPLE}
                    isMobile={isMobile}
                    text="Verify filings, assign case numbers, schedule hearings, assign judges, and upload official
                     orders securely. JusticeLink simplifies court administration with role-based access control."
                />

            </div>

            {/* CONTACT SECTION */}
            <div ref={contactRef} style={{
                ...contactSection,
                backgroundAttachment: isMobile ? "scroll" : "fixed",
                padding: isMobile ? "80px 16px" : "120px 40px",
            }}>

                <div style={contactOverlay}></div>

                <div style={{
                    ...contactGlassBox,
                    padding: isMobile ? "28px" : "60px",
                    height: "auto",
                }}>

                    <h2 style={{ ...contactTitle, color: GOLD }}>Contact LegalMind</h2>

                    <p style={contactDescription}>
                        For assistance with case filing, dashboard access, or technical support,
                        please contact our team. We are committed to providing secure and reliable service.
                    </p>

                    <div style={{ ...contactContent, flexDirection: isMobile ? "column" : "row", gap: isMobile ? "30px" : "60px" }}>

                        <div style={contactInfo}>
                            <p><strong style={{ color: TEAL   }}>Email:</strong> support@legalmind.com</p>
                            <p><strong style={{ color: ORANGE }}>Phone:</strong> +91 98765 43210</p>
                            <p><strong style={{ color: PURPLE }}>Location:</strong> Hyderabad, India</p>
                            <p><strong style={{ color: ORANGE }}>Hours:</strong> Mon – Fri, 9 AM – 6 PM</p>
                        </div>

                        <div style={contactForm}>
                            <input type="text"  placeholder="Full Name"      style={inputStyle} />
                            <input type="email" placeholder="Email Address"  style={inputStyle} />
                            <input type="text"  placeholder="Subject"        style={inputStyle} />
                            <textarea           placeholder="Message"        style={textareaStyle}></textarea>
                            <button style={{ ...sendButton, background: `linear-gradient(135deg, ${GOLD}, #E8CC7A)`, color: "#000" }}>
                                Send Message
                            </button>
                        </div>

                    </div>

                </div>

            </div>

            {/* FOOTER */}
            <div style={{
                backgroundColor: "#000",
                color: "white",
                textAlign: "center",
                padding: "20px 40px",
                fontSize: "14px",
                borderTop: `1px solid rgba(201,168,76,0.25)`,
            }}>
                <p>© 2026 LegalMind. All rights reserved.</p>
                <p>
                    <span style={{ color: ORANGE }}>Designed by LegalMind Team</span> | <span style={{ cursor: "pointer", textDecoration: "underline", color: TEAL }}>Privacy Policy</span> | <span style={{ cursor: "pointer", textDecoration: "underline", color: TEAL }}>Terms of Service</span>
                </p>
            </div>

        </>
    );
}


function FeatureCard({ title, text, accent, isMobile }) {

    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: isMobile ? "100%" : "320px",
                maxWidth: "400px",
                height: isMobile ? "auto" : "380px",
                /* Tinted card background using accent color */
                background: hover
                    ? `linear-gradient(145deg, ${accent}18, ${accent}08)`
                    : `linear-gradient(145deg, ${accent}10, rgba(255,255,255,0.02))`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: "24px",
                border: hover ? `1px solid ${accent}` : `1px solid ${accent}44`,
                padding: "30px",
                color: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transform: hover ? "scale(1.05)" : "scale(1)",
                transition: "all 0.35s ease",
                boxShadow: hover ? `0 10px 40px ${accent}44` : `0 4px 20px ${accent}18`,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Thin colored top bar */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: "3px",
                background: accent,
                opacity: hover ? 1 : 0.6,
                transition: "opacity 0.3s",
            }} />

            <div>
                <h3 style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: hover ? accent : "white",
                    transition: "color 0.3s",
                }}>
                    {title}
                </h3>

                <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.6" }}>
                    {text}
                </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button style={{ ...cardPrimaryButton, backgroundColor: accent, color: "#000" }}>
                    Sign In
                </button>
                <button style={{ ...cardSecondaryButton, borderColor: `${accent}88`, color: accent }}>
                    Login
                </button>
            </div>

        </div>
    );
}


/* STYLES */

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
    flex: 1,
    padding: "10px",
    backgroundColor: "#ffffff",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
};

const cardSecondaryButton = {
    flex: 1,
    padding: "10px",
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
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

const contactTitle = {
    fontSize: "36px",
    marginBottom: "20px",
    margintop: "20px",
};

const contactDescription = {
    color: "rgba(255,255,255,0.7)",
    marginBottom: "60px",
    maxWidth: "700px",
    margintop: "50px",
};

const contactContent = {
    display: "flex",
    gap: "60px",
    flexWrap: "wrap",
};

const contactInfo = {
    flex: 1,
    minWidth: "250px",
    lineHeight: "2",
};

const contactForm = {
    flex: 1,
    minWidth: "300px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
};

const inputStyle = {
    padding: "12px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: "8px",
    color: "white",
    outline: "none",
};

const textareaStyle = {
    padding: "12px",
    height: "120px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,168,76,0.3)",
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
    maxWidth: "1100px",
    padding: "60px",
    backgroundColor: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    borderRadius: "20px",
    border: "1px solid rgba(201,168,76,0.25)",
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
