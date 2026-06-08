import {
  useState,
  useEffect,
  useRef,
  CSSProperties,
  ReactNode,
  DragEvent,
} from "react";

const SERIF: CSSProperties = { fontFamily: "'Playfair Display', serif" };
const SERIF_ITAL: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontStyle: "italic",
};
const ACCENT: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const MIST = "#d8e1d7";
const GOLD = "#d5a93d";
const GOLD_SOFT = "#b99135";
const BRONZE = "#8a681f";
const CHALK = "#f1eee5";
const DARK = "#07100d";
const DARK_SOFT = "#10251d";
const BORDER_GOLD = "rgba(213,169,61,0.28)";
const MUTED_TEXT = "#8fae9b";
const BG_URL = "/bg.jpg";

const NAV_ITEMS = [
  { id: "dash", label: "Dashboard" },
  { id: "cases", label: "My Cases" },
  { id: "track", label: "Track Progress" },
  { id: "ai", label: "AI Assistant" },
  { id: "law", label: "Find Lawyer" },
];

const QUICK_STARTS = [
  {
    label: "Notice Explainer",
    prompt:
      "Upload or paste a legal notice and I'll explain it in plain English.",
  },
  {
    label: "Deadlines",
    prompt:
      "Tell me your notice date or hearing date and I'll help identify key deadlines.",
  },
  {
    label: "Legal Terms",
    prompt: "Ask me any legal term and I'll explain it simply with examples.",
  },
  {
    label: "Scam Detector",
    prompt: "Paste a suspicious legal message and I'll flag warning signs.",
  },
  {
    label: "Filing Guide",
    prompt:
      "Tell me your issue type and district, and I'll suggest a filing path.",
  },
  {
    label: "Doc Checklist",
    prompt: "Tell me your matter type and I'll list documents you may need.",
  },
  {
    label: "Case Insights",
    prompt: "Summarize your case facts and I'll help organize key points.",
  },
];

function Hairline({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${GOLD_SOFT}, transparent)`,
        opacity: 0.65,
        ...style,
      }}
    />
  );
}

function Plate({
  children,
  style,
  id,
}: {
  children: ReactNode;
  style?: CSSProperties;
  id?: string;
}) {
  return (
    <div
      id={id}
      style={{
        background:
          "linear-gradient(135deg, rgba(7,19,15,0.82), rgba(18,53,40,0.64))",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        color: CHALK,
        border: `1px solid ${BORDER_GOLD}`,
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 28px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScaleIcon({
  size = 90,
  color = GOLD_SOFT,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size * 1.33} viewBox="0 0 90 120" fill="none">
      <circle cx="45" cy="10" r="4" stroke={color} strokeWidth="1.2" />
      <line x1="10" y1="28" x2="80" y2="28" stroke={color} strokeWidth="1.2" />
      <line x1="18" y1="30" x2="10" y2="54" stroke={color} strokeWidth="0.6" />
      <line x1="18" y1="30" x2="18" y2="56" stroke={color} strokeWidth="0.6" />
      <line x1="18" y1="30" x2="26" y2="54" stroke={color} strokeWidth="0.6" />
      <path d="M6 56 Q18 66 30 56" stroke={color} strokeWidth="1.2" />
      <line x1="72" y1="30" x2="64" y2="54" stroke={color} strokeWidth="0.6" />
      <line x1="72" y1="30" x2="72" y2="56" stroke={color} strokeWidth="0.6" />
      <line x1="72" y1="30" x2="80" y2="54" stroke={color} strokeWidth="0.6" />
      <path d="M60 56 Q72 66 84 56" stroke={color} strokeWidth="1.2" />
      <line x1="45" y1="14" x2="45" y2="100" stroke={color} strokeWidth="1.4" />
      <line x1="20" y1="102" x2="70" y2="102" stroke={color} strokeWidth="1.4" />
      <line x1="14" y1="110" x2="76" y2="110" stroke={color} strokeWidth="1.4" />
      <line x1="8" y1="116" x2="82" y2="116" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

function StatValue({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span style={{ color: MUTED_TEXT, opacity: 0.75, letterSpacing: 2 }}>
        —
      </span>
    );
  }
  return <>{String(value).padStart(2, "0")}</>;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dash");
  const [caseFilter, setCaseFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [selectedQuickStart, setSelectedQuickStart] = useState<
    (typeof QUICK_STARTS)[number] | null
  >(null);

  const sec0 = useRef<HTMLDivElement>(null);
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);

  const stats: {
    total: number | null;
    active: number | null;
    hearings: number | null;
    resolved: number | null;
  } = {
    total: null,
    active: null,
    hearings: null,
    resolved: null,
  };

  const casesList: {
    _id: string;
    caseId: string;
    title: string;
    status: string;
  }[] = [];

  const activitiesList: { text: string; time: string }[] = [];
  const lawyersList: { initials: string; name: string; caseName: string }[] = [];

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (path: string) => {
    window.location.href = path;
  };

  const handleNav = (id: string) => {
    setActiveTab(id);
    if (id === "dash") {
      sec0.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (id === "ai") {
      goTo("/citizen/legal-chatbot");
      return;
    }
    if (id === "cases") {
      goTo("/citizen/cases");
      return;
    }
    if (id === "track") {
      goTo("/citizen/track");
      return;
    }
    if (id === "law") {
      goTo("/citizen/find-lawyer");
    }
  };

  const filteredCases =
    caseFilter === "All"
      ? casesList
      : casesList.filter((c) => c.status === caseFilter);

  const innerCard: CSSProperties = {
    flex: "1 1 0",
    minWidth: 0,
    background:
      "linear-gradient(145deg, rgba(7,19,15,0.78), rgba(18,53,40,0.54))",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${BORDER_GOLD}`,
    borderRadius: 3,
    padding: "34px 34px 40px",
    transition: "transform .35s ease, box-shadow .35s ease",
    position: "relative",
    color: CHALK,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.035)",
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: DARK,
        }}
      >
        <p style={{ ...SERIF_ITAL, fontSize: 18, color: GOLD_SOFT }}>
          — preparing the docket —
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        color: CHALK,
        overflowX: "hidden",
        position: "relative",
        background:
          "radial-gradient(circle at 24% 0%, rgba(42,103,74,0.36), transparent 38%), linear-gradient(180deg, #07130f 0%, #0d1f18 42%, #10291f 100%)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "118vh",
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(7,19,15,0.58) 0%,
              rgba(7,19,15,0.22) 43%,
              rgba(7,19,15,0.64) 100%
            ),
            linear-gradient(
              180deg,
              rgba(7,19,15,0.12) 0%,
              rgba(7,19,15,0.24) 48%,
              #07130f 100%
            ),
            url(${BG_URL})
          `,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          transform: `translate3d(0, ${scrollY * 0.18}px, 0) scale(1.04)`,
          transformOrigin: "center top",
          willChange: "transform",
          opacity: Math.max(0.18, 1 - scrollY / 950),
        }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@400;500&display=swap');
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html {
          scroll-behavior: smooth;
          background: #07130f;
        }
        body {
          background: #07130f;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .a0 {
          animation: fadeUp .8s ease both;
        }
        .a1 {
          animation: fadeUp .9s ease .15s both;
        }
        .a2 {
          animation: fadeUp 1s ease .3s both;
        }
        ::-webkit-scrollbar {
          width: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #07130f;
        }
        ::-webkit-scrollbar-thumb {
          background: ${GOLD_SOFT};
          border-radius: 20px;
        }
        select,
        input,
        textarea {
          font-family: 'DM Sans', sans-serif;
        }
        select option {
          background: #07130f;
          color: ${CHALK};
        }
        input::placeholder,
        textarea::placeholder {
          color: rgba(216,225,215,0.46);
        }
        button {
          font-family: 'DM Sans', sans-serif;
        }
        .quick-pill,
        .ai-entry,
        .nav-link,
        .primary-action,
        .secondary-action {
          transition:
            transform .2s ease,
            background .2s ease,
            color .2s ease,
            border-color .2s ease,
            box-shadow .2s ease,
            opacity .2s ease;
        }
        .quick-pill:hover {
          border-color: ${GOLD} !important;
          color: ${GOLD} !important;
          background: rgba(213,169,61,0.14) !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }
        .ai-entry:hover {
          background: ${GOLD_SOFT} !important;
          border-color: ${GOLD_SOFT} !important;
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(0,0,0,0.22);
        }
        .nav-link:hover {
          color: ${GOLD} !important;
          transform: translateY(-1px);
        }
        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(0,0,0,0.26);
        }
        button:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        [role="button"]:focus-visible {
          outline: 2px solid ${GOLD} !important;
          outline-offset: 3px !important;
          box-shadow:
            0 0 0 4px rgba(213,169,61,0.18),
            0 12px 28px rgba(0,0,0,0.22);
        }
      `}</style>

      <main
        style={{
          width: "100%",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: "18px 40px 80px",
            display: "flex",
            flexDirection: "column",
            gap: 64,
          }}
        >
          {/* HERO */}
          <div
            ref={sec0}
            className="a0"
            style={{
              position: "relative",
              padding: "18px 44px 70px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: -44,
                top: 92,
                bottom: 20,
                width: "62%",
                zIndex: 1,
                pointerEvents: "none",
                background:
                  "linear-gradient(90deg, rgba(7,19,15,0.84) 0%, rgba(7,19,15,0.58) 42%, rgba(7,19,15,0.22) 72%, transparent 100%)",
              }}
            />

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 10px",
                marginBottom: 36,
                background: "rgba(7,19,15,0.58)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 3,
                border: `1px solid ${BORDER_GOLD}`,
                boxShadow: "0 16px 50px rgba(0,0,0,0.25)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  gap: 28,
                  flexWrap: "wrap",
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <span
                    key={item.id}
                    className="nav-link"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNav(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNav(item.id);
                      }
                    }}
                    style={{
                      ...DM,
                      fontSize: 10,
                      letterSpacing: 2.6,
                      textTransform: "uppercase",
                      fontWeight: 500,
                      color: activeTab === item.id ? GOLD : GOLD_SOFT,
                      borderBottom:
                        activeTab === item.id
                          ? `1px solid ${GOLD}`
                          : "1px solid transparent",
                      padding: "10px 14px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </nav>

            <div
              style={{
                marginBottom: 44,
                maxWidth: 500,
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  ...DM,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(7,19,15,0.58)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `1px solid ${BORDER_GOLD}`,
                  borderRadius: 3,
                  padding: "12px 16px",
                  boxShadow: "0 16px 50px rgba(0,0,0,0.24)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={GOLD_SOFT}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  placeholder="Search cases, hearings, documents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    color: CHALK,
                    fontSize: 13,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    flex: 1,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                />
                <span
                  style={{
                    ...DM,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: GOLD_SOFT,
                    border: `1px solid ${GOLD_SOFT}55`,
                    borderRadius: 2,
                    padding: "3px 8px",
                  }}
                >
                  ⌘K
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 64,
                position: "relative",
                zIndex: 2,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: "1.2 1 0",
                  minWidth: 320,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  gap: 36,
                }}
              >
                <div>
                  <h1
                    style={{
                      ...SERIF,
                      fontSize: 58,
                      lineHeight: 1.02,
                      fontWeight: 500,
                      color: CHALK,
                      marginBottom: 22,
                      textShadow:
                        "0 2px 20px rgba(0,0,0,0.82), 0 0 60px rgba(0,0,0,0.52)",
                    }}
                  >
                    Your legal matters,{" "}
                    <span style={{ fontStyle: "italic", color: GOLD }}>
                      quietly
                    </span>{" "}
                    in order.
                  </h1>
                  <div
                    style={{
                      display: "inline-block",
                      maxWidth: 560,
                      padding: "10px 16px 12px",
                      background:
                        "linear-gradient(90deg, rgba(7,19,15,0.74), rgba(7,19,15,0.36))",
                      borderLeft: `1px solid ${GOLD_SOFT}88`,
                      backdropFilter: "blur(5px)",
                      WebkitBackdropFilter: "blur(5px)",
                      boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
                    }}
                  >
                    <p
                      style={{
                        ...ACCENT,
                        fontSize: 18,
                        fontStyle: "italic",
                        color: MIST,
                        maxWidth: 520,
                        lineHeight: 1.6,
                        textShadow: "0 1px 14px rgba(0,0,0,0.95)",
                      }}
                    >
                      Submit a legal request and track it from filing to
                      resolution — all in one place.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="primary-action"
                    onClick={() => handleNav("cases")}
                    style={{
                      ...DM,
                      fontSize: 12,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      fontWeight: 500,
                      padding: "18px 30px",
                      cursor: "pointer",
                      background: BRONZE,
                      color: CHALK,
                      border: `1px solid ${BRONZE}`,
                      borderRadius: 3,
                      boxShadow: "0 14px 34px rgba(0,0,0,0.24)",
                    }}
                  >
                    Submit a Request
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => handleNav("cases")}
                    style={{
                      ...DM,
                      fontSize: 12,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      fontWeight: 500,
                      padding: "18px 30px",
                      cursor: "pointer",
                      background: "rgba(7,19,15,0.22)",
                      color: CHALK,
                      border: `1px solid ${GOLD_SOFT}`,
                      borderRadius: 3,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    View All Cases
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: "1 1 0",
                  minWidth: 320,
                  background:
                    "linear-gradient(135deg, rgba(7,19,15,0.92), rgba(18,53,40,0.85))",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: `1px solid ${BORDER_GOLD}`,
                  borderRadius: 3,
                  padding: "30px 30px 36px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <div
                    style={{
                      width: 140,
                      height: 170,
                      flexShrink: 0,
                      border: `1px solid ${GOLD_SOFT}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(185,145,53,0.08)",
                    }}
                  >
                    <ScaleIcon />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      flex: 1,
                    }}
                  >
                    <p
                      style={{
                        ...ACCENT,
                        fontSize: 19,
                        fontStyle: "italic",
                        color: CHALK,
                        lineHeight: 1.25,
                      }}
                    >
                      "The law is the foundation of liberty."
                    </p>
                    <Hairline />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px 16px",
                      }}
                    >
                      {[
                        { label: "Total", val: stats.total },
                        { label: "Active", val: stats.active },
                        { label: "Pending", val: stats.hearings },
                        { label: "Resolved", val: stats.resolved },
                      ].map((s) => (
                        <div key={s.label}>
                          <p
                            style={{
                              ...DM,
                              fontSize: 9,
                              letterSpacing: 3,
                              color: GOLD_SOFT,
                              textTransform: "uppercase",
                            }}
                          >
                            {s.label}
                          </p>
                          <p
                            style={{
                              ...SERIF,
                              fontSize: 28,
                              color: s.val === null ? MUTED_TEXT : GOLD,
                              fontWeight: 500,
                              lineHeight: 1.2,
                            }}
                          >
                            <StatValue value={s.val} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Hairline />
                <p
                  style={{
                    ...DM,
                    fontSize: 11,
                    color: MUTED_TEXT,
                    lineHeight: 1.6,
                  }}
                >
                  Your matter overview will appear here once you submit your
                  first request.
                </p>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 2,
                marginTop: 54,
                display: "grid",
                gridTemplateColumns: "0.9fr 1.1fr",
                gap: 22,
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(7,19,15,0.72), rgba(18,53,40,0.42))",
                  border: `1px solid ${BORDER_GOLD}`,
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  borderRadius: 3,
                  padding: "24px 26px",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
                }}
              >
                <p
                  style={{
                    ...DM,
                    fontSize: 10,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: GOLD_SOFT,
                    marginBottom: 8,
                  }}
                >
                  Empty Dashboard
                </p>
                <h3
                  style={{
                    ...SERIF,
                    fontSize: 28,
                    fontWeight: 500,
                    color: CHALK,
                    lineHeight: 1.08,
                  }}
                >
                  Start with one request. We'll organize the rest.
                </h3>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 14,
                }}
              >
                {[
                  {
                    n: "01",
                    title: "Brief the matter",
                    text: "Tell us the issue type, district and a short summary.",
                  },
                  {
                    n: "02",
                    title: "Attach proof",
                    text: "Drop notices, receipts, agreements or screenshots.",
                  },
                  {
                    n: "03",
                    title: "Track next steps",
                    text: "Your status, counsel and documents will appear here.",
                  },
                ].map((step) => (
                  <div
                    key={step.n}
                    style={{
                      background: "rgba(7,19,15,0.54)",
                      border: `1px solid rgba(213,169,61,0.22)`,
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderRadius: 3,
                      padding: "20px 18px",
                    }}
                  >
                    <p
                      style={{
                        ...SERIF,
                        fontSize: 22,
                        color: GOLD,
                        marginBottom: 12,
                      }}
                    >
                      {step.n}
                    </p>
                    <p
                      style={{
                        ...DM,
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: CHALK,
                        marginBottom: 8,
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      style={{
                        ...ACCENT,
                        fontSize: 14,
                        fontStyle: "italic",
                        color: MUTED_TEXT,
                        lineHeight: 1.45,
                      }}
                    >
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div ref={sec1} className="a1">
            <Plate style={{ padding: "54px 54px 60px" }}>
              <div
                style={{
                  ...innerCard,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <p
                      style={{
                        ...SERIF,
                        fontSize: 24,
                        fontWeight: 600,
                        color: CHALK,
                      }}
                    >
                      My Cases
                    </p>
                    <p
                      style={{
                        ...ACCENT,
                        fontSize: 14,
                        fontStyle: "italic",
                        color: GOLD_SOFT,
                        marginTop: 2,
                      }}
                    >
                      — current matters on the desk —
                    </p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNav("cases")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNav("cases");
                      }
                    }}
                    style={{
                      ...DM,
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: GOLD,
                      cursor: "pointer",
                      borderBottom: `1px solid ${GOLD}`,
                      paddingBottom: 2,
                    }}
                  >
                    View all
                  </span>
                </div>
                <Hairline style={{ marginBottom: 18 }} />
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 22,
                    flexWrap: "wrap",
                  }}
                >
                  {["All", "Active", "Pending", "Resolved"].map((t) => (
                    <span
                      key={t}
                      role="button"
                      tabIndex={0}
                      onClick={() => setCaseFilter(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setCaseFilter(t);
                        }
                      }}
                      style={{
                        ...DM,
                        fontSize: 10,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        padding: "8px 16px",
                        borderRadius: 3,
                        cursor: "pointer",
                        background: caseFilter === t ? BRONZE : "transparent",
                        color: caseFilter === t ? CHALK : GOLD_SOFT,
                        border: `1px solid ${caseFilter === t ? BRONZE : GOLD_SOFT + "44"}`,
                        transition: "all .25s ease",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2.2fr 1fr 0.8fr",
                    gap: 8,
                    padding: "8px 12px",
                  }}
                >
                  {["— Case ID", "Title", "Status", "Action"].map((h) => (
                    <p
                      key={h}
                      style={{
                        ...DM,
                        fontSize: 9,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color: MUTED_TEXT,
                        fontWeight: 500,
                        borderBottom: `1px solid ${CHALK}15`,
                        paddingBottom: 10,
                      }}
                    >
                      {h}
                    </p>
                  ))}
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {filteredCases.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40 }}>
                      <p
                        style={{
                          ...ACCENT,
                          fontSize: 18,
                          fontStyle: "italic",
                          color: MUTED_TEXT,
                        }}
                      >
                        No cases on the desk yet.
                      </p>
                      <button
                        onClick={() => handleNav("cases")}
                        style={{
                          ...DM,
                          fontSize: 10,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          color: GOLD,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          marginTop: 12,
                        }}
                      >
                        → Submit your first request
                      </button>
                    </div>
                  ) : (
                    filteredCases.map((r, i) => (
                      <div
                        key={r._id || i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 2.2fr 1fr 0.8fr",
                          gap: 8,
                          padding: "14px 12px",
                          alignItems: "center",
                          borderBottom: `1px dashed ${CHALK}12`,
                        }}
                      >
                        <p
                          style={{
                            ...SERIF,
                            fontSize: 13,
                            color: GOLD,
                            fontWeight: 600,
                            letterSpacing: 1,
                          }}
                        >
                          {r.caseId}
                        </p>
                        <p
                          style={{
                            ...DM,
                            fontSize: 13,
                            color: CHALK,
                            lineHeight: 1.4,
                          }}
                        >
                          {r.title}
                        </p>
                        <span
                          style={{
                            ...DM,
                            fontSize: 10,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                            padding: "6px 12px",
                            borderRadius: 3,
                            background:
                              r.status === "Active"
                                ? BRONZE
                                : r.status === "Pending"
                                  ? DARK_SOFT
                                  : "transparent",
                            color: CHALK,
                            border: `1px solid ${r.status === "Resolved"
                              ? MUTED_TEXT + "55"
                              : "transparent"
                              }`,
                            display: "inline-block",
                            textAlign: "center",
                          }}
                        >
                          {r.status}
                        </span>
                        <span
                          onClick={() => handleNav("cases")}
                          style={{
                            ...DM,
                            fontSize: 10,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                            color: GOLD,
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                          }}
                        >
                          Open
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Plate>
          </div>

          <div ref={sec2} className="a2">
            <Plate style={{ padding: "56px 56px 60px", marginBottom: 64 }}>
              <div
                onClick={() => handleNav("ai")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 40,
                  cursor: "pointer",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 34,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 3,
                      background: BRONZE,
                      color: CHALK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...SERIF,
                      fontSize: 22,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    AI
                  </div>
                  <div>
                    <h3
                      style={{
                        ...SERIF,
                        fontSize: 36,
                        fontWeight: 500,
                        lineHeight: 1.08,
                        color: CHALK,
                      }}
                    >
                      A quiet, tireless clerk for your{" "}
                      <span style={{ fontStyle: "italic", color: GOLD }}>
                        legal questions
                      </span>
                      .
                    </h3>
                    <p
                      style={{
                        ...ACCENT,
                        fontSize: 16,
                        fontStyle: "italic",
                        color: GOLD_SOFT,
                        marginTop: 14,
                        maxWidth: 640,
                        lineHeight: 1.55,
                      }}
                    >
                      Instant explanations of notices, deadline trackers,
                      document checklists, scam detection and a filing guide —
                      all in one place.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 26,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      maxWidth: 420,
                      justifyContent: "flex-end",
                    }}
                  >
                    {QUICK_STARTS.map((pill) => (
                      <button
                        key={pill.label}
                        type="button"
                        className="quick-pill"
                        title={`Start: ${pill.label}`}
                        aria-label={`Start AI quick action: ${pill.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          goTo(`/citizen/legal-chatbot?quickStart=${encodeURIComponent(pill.label)}`);
                        }}
                        style={{
                          ...DM,
                          fontSize: 9,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          padding: "7px 12px",
                          borderRadius: 3,
                          background:
                            selectedQuickStart?.label === pill.label
                              ? "rgba(213,169,61,0.18)"
                              : "transparent",
                          border: `1px solid ${selectedQuickStart?.label === pill.label
                            ? GOLD
                            : GOLD_SOFT + "55"
                            }`,
                          color:
                            selectedQuickStart?.label === pill.label
                              ? GOLD
                              : GOLD_SOFT,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ai-entry"
                    title="Open AI assistant"
                    aria-label="Open AI assistant"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNav("ai");
                    }}
                    style={{
                      ...DM,
                      height: 44,
                      minWidth: 118,
                      padding: "0 14px",
                      borderRadius: 3,
                      background: BRONZE,
                      color: CHALK,
                      border: `1px solid ${BRONZE}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <span>Open AI</span>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
                  </button>
                </div>
              </div>

              {selectedQuickStart && (
                <div
                  style={{
                    marginTop: 30,
                    padding: "18px 20px",
                    background:
                      "linear-gradient(135deg, rgba(7,19,15,0.54), rgba(18,53,40,0.36))",
                    border: `1px solid rgba(213,169,61,0.22)`,
                    borderRadius: 3,
                  }}
                >
                  <p
                    style={{
                      ...DM,
                      fontSize: 10,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      color: GOLD,
                      marginBottom: 8,
                    }}
                  >
                    Quick-start selected · {selectedQuickStart.label}
                  </p>
                  <p
                    style={{
                      ...ACCENT,
                      fontSize: 17,
                      fontStyle: "italic",
                      color: MIST,
                      lineHeight: 1.5,
                    }}
                  >
                    {selectedQuickStart.prompt}
                  </p>
                </div>
              )}
            </Plate>

            <Plate style={{ padding: "54px 54px 60px" }}>
              <div
                style={{
                  display: "flex",
                  gap: 32,
                  alignItems: "stretch",
                  flexWrap: "wrap",
                }}
              >
                <div style={innerCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        ...SERIF,
                        fontSize: 22,
                        fontWeight: 600,
                        color: CHALK,
                      }}
                    >
                      Recent Activity
                    </p>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: GOLD,
                        borderRadius: 2,
                        display: "inline-block",
                      }}
                    />
                  </div>
                  <Hairline style={{ marginBottom: 22 }} />
                  {activitiesList.length === 0 ? (
                    <p
                      style={{
                        ...ACCENT,
                        fontSize: 16,
                        fontStyle: "italic",
                        color: MUTED_TEXT,
                        textAlign: "center",
                        padding: "30px 0",
                      }}
                    >
                      The desk is quiet — no recent activity.
                    </p>
                  ) : (
                    activitiesList.map((a, i) => (
                      <p key={i}>
                        {a.text} · {a.time}
                      </p>
                    ))
                  )}
                </div>

                <div style={innerCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        ...SERIF,
                        fontSize: 22,
                        fontWeight: 600,
                        color: CHALK,
                      }}
                    >
                      Assigned Counsel
                    </p>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNav("law")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNav("law");
                        }
                      }}
                      style={{
                        ...DM,
                        fontSize: 10,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: GOLD,
                        cursor: "pointer",
                        borderBottom: `1px solid ${GOLD}`,
                        paddingBottom: 2,
                      }}
                    >
                      Find more
                    </span>
                  </div>
                  <Hairline style={{ marginBottom: 22 }} />
                  {lawyersList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <p
                        style={{
                          ...ACCENT,
                          fontSize: 16,
                          fontStyle: "italic",
                          color: MUTED_TEXT,
                        }}
                      >
                        No counsel yet assigned.
                      </p>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNav("law")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNav("law");
                          }
                        }}
                        style={{
                          ...DM,
                          fontSize: 10,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          color: GOLD,
                          cursor: "pointer",
                          marginTop: 10,
                          display: "inline-block",
                        }}
                      >
                        → Find a lawyer
                      </span>
                    </div>
                  ) : (
                    lawyersList.map((l, i) => (
                      <p key={i}>
                        {l.initials} · {l.name} · {l.caseName}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </Plate>
          </div>
        </div>
      </main>
    </div>
  );
}
