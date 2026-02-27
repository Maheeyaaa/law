import { useState, useRef } from "react";

export default function Home() {

    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const contactRef = useRef(null);

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

                    <h1 style={{ fontSize: "48px", marginBottom: "10px", margin: "0" }}>
                        LegalMind
                    </h1>

                    <h2 style={{ fontSize: "24px", margin: "30px 0 8px 0" }}>
                        Digitizing Justice. Simplifying Courts.
                    </h2>

                    <p style={{
                        fontSize: "18px",
                        color: "rgba(255,255,255,0.7)",
                        maxWidth: "500px",
                        margin: "3px 0 220px 0"
                    }}>
                        LegalMind streamlines court case filing, tracking, and management
                        with secure dashboards and AI-powered insights.
                    </p>

                    <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>

                        <button style={primaryButton}>
                            Get Started
                        </button>

                        <button style={secondaryButton}>
                            Learn More
                        </button>

                    </div>

                </div>

                {/* Statue */}
                <img
                    src="/images/lady.png"
                    alt="Lady Justice"
                    style={{
                        position: "absolute",
                        top: "100px",
                        right: "180px",
                        height: "650px",
                        zIndex: 2,
                    }}
                />

            </div>

            {/* FEATURES SECTION */}
            <div ref={featuresRef} style={featuresContainer}>

                <FeatureCard
                    title="Citizens"
                    text="File cases online, upload legal documents securely, select specialized lawyers,
                     and track your case progress in real-time. JusticeLink ensures transparency and 
                     keeps you informed at every step."
                />

                <FeatureCard
                    title="Lawyer"
                    text="Manage assigned cases, communicate with clients, upload documents, and stay updated 
                    with hearing schedules. Improve efficiency with organized digital workflows."
                />

                <FeatureCard
                    title="Court Staff"
                    text="Verify filings, assign case numbers, schedule hearings, assign judges, and upload official
                     orders securely. JusticeLink simplifies court administration with role-based access control."
                />

            </div>

            {/* CONTACT SECTION */}
            <div ref={contactRef} style={contactSection}>

                {/* DARK OVERLAY */}
                <div style={contactOverlay}></div>

                {/* GLASS BOX */}
                <div style={contactGlassBox}>

                    <h2 style={contactTitle}>Contact LegalMind</h2>

                    <p style={contactDescription}>
                        For assistance with case filing, dashboard access, or technical support,
                        please contact our team. We are committed to providing secure and reliable service.
                    </p>

                    <div style={contactContent}>

                        {/* Contact Info */}
                        <div style={contactInfo}>
                            <p><strong>Email:</strong> support@legalmind.com</p>
                            <p><strong>Phone:</strong> +91 98765 43210</p>
                            <p><strong>Location:</strong> Hyderabad, India</p>
                            <p><strong>Hours:</strong> Mon – Fri, 9 AM – 6 PM</p>
                        </div>

                        {/* Contact Form */}
                        <div style={contactForm}>
                            <input type="text" placeholder="Full Name" style={inputStyle} />
                            <input type="email" placeholder="Email Address" style={inputStyle} />
                            <input type="text" placeholder="Subject" style={inputStyle} />
                            <textarea placeholder="Message" style={textareaStyle}></textarea>

                            <button style={sendButton}>
                                Send Message
                            </button>
                        </div>

                    </div>

                </div>

            </div>

            {/* FOOTER */}
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
                Designed by LegalMind Team | <span style={{cursor: "pointer", textDecoration: "underline"}}>
                    Privacy Policy</span> | <span style={{cursor: "pointer", textDecoration: "underline"}}>
                        Terms of Service</span>
              </p>
            </div>

        </>
    );
}


function FeatureCard({ title, text }) {

    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: "320px",
                height: "380px",

                /* SHOW SAME HERO BACKGROUND INSIDE CARD */
                backgroundImage: "url('/images/hall.jpeg')",
                backgroundSize: "cover",
                backgroundPosition: "center",

                /* dark glass overlay */
                backgroundColor: "rgba(0,0,0,0.55)",
                backgroundBlendMode: "darken",

                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",

                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.15)",

                padding: "30px",
                color: "white",

                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",

                transform: hover ? "scale(1.08)" : "scale(1)",
                transition: "all 0.3s ease",

                boxShadow: hover
                    ? "0 0 35px rgba(255,255,255,0.9)"
                    : "0 0 10px rgba(0,0,0,0.5)",

                cursor: "pointer",
            }}
        >

            {/* Top Content */}
            <div>
                <h3 style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    marginBottom: "15px"
                }}>
                    {title}
                </h3>

                <p style={{
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: "1.6"
                }}>
                    {text}
                </p>
            </div>

            {/* Buttons */}
            <div style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px"
            }}>

                <button style={cardPrimaryButton}>
                    Sign In
                </button>

                <button style={cardSecondaryButton}>
                    Login
                </button>

            </div>

        </div>
    );
}



/* STYLES */

const featuresContainer = {
    backgroundColor: "#000",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "40px",
};

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

const contactContainer = {
    width: "100%",
    maxWidth: "1100px",
    color: "white",
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