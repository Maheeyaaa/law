import { useState, useEffect, useRef, CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, globalSearch, createCase } from "../services/api";
import NotificationBell from "../components/NotificationBell";

/* ──────────── Fonts & tokens ──────────── */
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };

const BLUE = "#1748cf";
const BLUEB = "#1748cf";
const ICEB = "#1748cf";

const SH_CARD = "0 8px 32px rgba(0,0,0,.7)";

const GLASS_BOX1: CSSProperties = {
  background: "rgba(0, 0, 0, 0.85)",
  backdropFilter: "blur(50px)",
  WebkitBackdropFilter: "blur(50px)",
  border: "1px solid rgba(30, 95, 255, 0.3)",
  boxShadow: "none",
};

const GLASS_BOX234: CSSProperties = {
  background: "rgba(0, 0, 0, 0.25)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(30, 95, 255, 0.3)",
  boxShadow: "none",
};

const INNER_SOLID = "#060a1c";

/* ──────────── Pill button ──────────── */
function NavPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...DM,
        fontSize: 14,
        fontWeight: 500,
        color: "#fff",
        background: active ? "#1e5fff" : "rgba(0, 0, 0, 0.85)",
        border: "none",
        padding: "11px 26px",
        borderRadius: 999,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "none",
        transition: "transform .18s ease, background .18s ease",
        backdropFilter: active ? "none" : "blur(50px)",
        WebkitBackdropFilter: active ? "none" : "blur(50px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.95)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.85)";
        }
      }}
    >
      {label}
    </button>
  );
}

/* ──────────── Stat card ──────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "#04081a",
        border: "1px solid rgba(80,130,230,0.45)",
        borderRadius: 10,
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        boxShadow: "0 8px 18px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.03)",
        width: 86,
        height: 52,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transition: "transform .2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: BLUE,
        }}
      />
      <p
        style={{
          ...BN,
          fontSize: 18,
          lineHeight: 1.1,
          color: "#fff",
          letterSpacing: 0.5,
          margin: 0,
        }}
      >
        {value}
      </p>
      <p
        style={{
          ...DM,
          fontSize: 7.5,
          color: "rgba(140,180,255,.7)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginTop: 2,
          marginBottom: 0,
        }}
      >
        {label}
      </p>
    </div>
  );
}

/* ──────────── Plate Component ──────────── */
function Plate({
  children,
  style,
  id,
  glassStyle,
}: {
  children: ReactNode;
  style?: CSSProperties;
  id?: string;
  glassStyle?: CSSProperties;
}) {
  return (
    <div
      id={id}
      style={{
        ...(glassStyle || GLASS_BOX234),
        borderRadius: 26,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ──────────── Nav Items ──────────── */
const NAV_ITEMS = [
  { id: "dash", label: "Dashboard" },
  { id: "ai", label: "AI assistant" },
  { id: "file", label: "Legal Request" },
  { id: "cases", label: "My request" },
  { id: "law", label: "Find Lawyer" },
  { id: "track", label: "Track Progress" },
  { id: "docs", label: "Documents" },
];

export default function CitizenDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<{ name: string; email: string; _id?: string; id?: string } | null>(null);
  const [userInitials, setUserInitials] = useState("--");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ total: "00", active: "00", hearings: "00", resolved: "00" });
  const [nextHearingDate, setNextHearingDate] = useState<string | null>(null);
  const [pendingDocs, setPendingDocs] = useState(0);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [lawyersList, setLawyersList] = useState<any[]>([]);
  const [docsList, setDocsList] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("dash");
  const [caseFilter, setCaseFilter] = useState("All");
  const [fileForm, setFileForm] = useState({
    caseType: "Civil Dispute",
    title: "",
    description: "",
    district: "",
    courtName: "",
  });
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [filing, setFiling] = useState(false);
  const [fileMsg, setFileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const telanganaDistricts = [
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
  ];

  const telanganaCourts = [
    { name: "Telangana High Court, Hyderabad", district: "Hyderabad" },
    { name: "District Court, Hyderabad", district: "Hyderabad" },
    { name: "City Civil Court, Hyderabad", district: "Hyderabad" },
    { name: "City Criminal Court, Hyderabad", district: "Hyderabad" },
    { name: "Family Court, Hyderabad", district: "Hyderabad" },
    { name: "Consumer Court, Hyderabad", district: "Hyderabad" },
    { name: "Labour Court, Hyderabad", district: "Hyderabad" },
    { name: "Small Causes Court, Hyderabad", district: "Hyderabad" },
    { name: "Metropolitan Magistrate Court, Hyderabad", district: "Hyderabad" },
    { name: "District Court, Rangareddy", district: "Rangareddy" },
    { name: "District Court, Medchal-Malkajgiri", district: "Medchal-Malkajgiri" },
    { name: "District Court, Sangareddy", district: "Sangareddy" },
    { name: "District Court, Vikarabad", district: "Vikarabad" },
    { name: "District Court, Warangal", district: "Warangal Urban" },
    { name: "District Court, Hanumakonda", district: "Hanumakonda" },
    { name: "District Court, Khammam", district: "Khammam" },
    { name: "District Court, Nalgonda", district: "Nalgonda" },
    { name: "District Court, Karimnagar", district: "Karimnagar" },
    { name: "District Court, Nizamabad", district: "Nizamabad" },
    { name: "District Court, Adilabad", district: "Adilabad" },
    { name: "District Court, Mancherial", district: "Mancherial" },
    { name: "District Court, Peddapalli", district: "Peddapalli" },
    { name: "District Court, Jagtial", district: "Jagtial" },
    { name: "District Court, Rajanna Sircilla", district: "Rajanna Sircilla" },
    { name: "District Court, Kamareddy", district: "Kamareddy" },
    { name: "District Court, Medak", district: "Medak" },
    { name: "District Court, Siddipet", district: "Siddipet" },
    { name: "District Court, Jangaon", district: "Jangaon" },
    { name: "District Court, Mahabubabad", district: "Mahabubabad" },
    { name: "District Court, Suryapet", district: "Suryapet" },
    { name: "District Court, Yadadri Bhuvanagiri", district: "Yadadri Bhuvanagiri" },
    { name: "District Court, Mahabubnagar", district: "Mahabubnagar" },
    { name: "District Court, Nagarkurnool", district: "Nagarkurnool" },
    { name: "District Court, Wanaparthy", district: "Wanaparthy" },
    { name: "District Court, Jogulamba Gadwal", district: "Jogulamba Gadwal" },
    { name: "District Court, Narayanpet", district: "Narayanpet" },
    { name: "District Court, Mulugu", district: "Mulugu" },
    { name: "District Court, Jayashankar Bhupalpally", district: "Jayashankar Bhupalpally" },
    { name: "District Court, Bhadradri Kothagudem", district: "Bhadradri Kothagudem" },
    { name: "Telangana State Consumer Disputes Redressal Commission", district: "Hyderabad" },
    { name: "Telangana Administrative Tribunal", district: "Hyderabad" },
  ];

  const filteredCases = caseFilter === "All" ? casesList : casesList.filter((c) => c.status === caseFilter);

  const mainRef = useRef<HTMLDivElement>(null);
  const sec0 = useRef<HTMLDivElement>(null);
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);

  const handleNav = (id: string) => {
    setActiveTab(id);

    if (id === "dash") {
      sec0.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (id === "ai") {
      navigate("/citizen/legal-chatbot");
      return;
    }
    if (id === "file") {
      sec1.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (id === "cases") {
      navigate("/citizen/cases");
      return;
    }
    if (id === "law") {
      navigate("/citizen/find-lawyer");
      return;
    }
    if (id === "docs") {
      navigate("/citizen/documents");
      return;
    }
    if (id === "track") {
      sec2.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate("/citizen");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        const parts = userData.name?.split(" ") || [];
        if (parts.length >= 2) {
          setUserInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
        } else if (parts.length === 1) {
          setUserInitials(parts[0][0].toUpperCase());
        }
      } catch {
        console.log("Failed to parse user data");
      }
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await getDashboard();
        const data = res.data;

        if (data.stats) setStats(data.stats);
        if (data.welcome?.nextHearingDate) setNextHearingDate(data.welcome.nextHearingDate);
        if (data.welcome?.pendingDocs !== undefined) setPendingDocs(data.welcome.pendingDocs);
        if (data.recentCases) setCasesList(data.recentCases);
        if (data.activities) setActivitiesList(data.activities);

        if (data.assignedLawyers?.length > 0) {
          setLawyersList(
            data.assignedLawyers.map((l: any) => {
              const parts = l.name.split(" ");
              const initials =
                parts.length >= 2
                  ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                  : parts[0][0].toUpperCase();

              return { ...l, initials };
            })
          );
        }

        if (data.recentDocuments) setDocsList(data.recentDocuments);
        console.log("Dashboard loaded from API ✅");
      } catch (err) {
        console.log("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await globalSearch(searchQuery);
        setSearchResults(res.data.results);
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const handleFileCase = async () => {
    if (!fileForm.title.trim() || !fileForm.description.trim()) {
      setFileMsg({ type: "error", text: "Please fill in both title and description" });
      return;
    }

    try {
      setFiling(true);
      setFileMsg(null);

      const formData = new FormData();
      formData.append("title", fileForm.title);
      formData.append("description", fileForm.description);
      formData.append("caseType", fileForm.caseType);

      if (fileForm.district) formData.append("district", fileForm.district);
      if (fileForm.courtName) formData.append("courtName", fileForm.courtName);

      supportingDocs.forEach((f) => formData.append("documents", f));

      const res = await createCase(formData);

      setFileMsg({
        type: "success",
        text: `Request submitted! ID: ${res.data.case.caseId}`,
      });

      setFileForm({
        caseType: "Civil Dispute",
        title: "",
        description: "",
        district: "",
        courtName: "",
      });

      setSupportingDocs([]);

      try {
        const dashRes = await getDashboard();
        const data = dashRes.data;
        if (data.stats) setStats(data.stats);
        if (data.recentCases) setCasesList(data.recentCases);
        if (data.activities) setActivitiesList(data.activities);
      } catch {}
    } catch (err: any) {
      setFileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to submit request",
      });
    } finally {
      setFiling(false);
    }
  };

  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";

    return () => {
      document.body.style.backgroundImage = "";
    };
  }, []);

  /* ── shared inner-card style ── */
  const innerCard: CSSProperties = {
    flex: "1 1 0",
    minWidth: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "none",
    borderRadius: 18,
    padding: "22px 26px 38px",
    boxShadow: SH_CARD,
    transition: "transform .2s ease",
  };

  /* ── shared form input style ── */
  const inp: CSSProperties = {
    ...DM,
    width: "100%",
    background: "rgba(255,255,255,.04)",
    border: "none",
    borderBottom: "1px solid rgba(30,95,255,.25)",
    borderRadius: 0,
    padding: "8px 4px",
    color: "rgba(255,255,255,.6)",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  };

  /* ── shared form label style ── */
  const lbl: CSSProperties = {
    ...DM,
    fontSize: 9,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: "rgba(255,255,255,.25)",
    marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "rgba(2,8,30,0.28)",
          pointerEvents: "none",
        }}
      />

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .a0 { animation: fadeUp .6s ease both }
        .search-wrap { transition: transform .2s ease; }
        .search-wrap:hover { transform:translateY(-3px); }
        .search-input { background:none; border:none; outline:none; color:#fff; width:100%; }
        .search-input::placeholder { color:rgba(255,255,255,.28)!important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(30,95,255,.3); border-radius:3px; }
        select option { background:#0a0f2c; color:#fff; }
      `}</style>

      <main
        ref={mainRef}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid rgba(30,95,255,.3)",
                  borderTop: "3px solid #1e5fff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>

          <div style={{ padding: "13px", display: "flex", flexDirection: "column", gap: 28 }}>
            {/* ═══════ TOP NAVBAR ═══════ */}
            <nav
              className="a0"
              style={{
                position: "sticky",
                top: 13,
                zIndex: 100,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                border: "1px solid rgba(30, 95, 255, 0.3)",
                borderRadius: 26,
                padding: "18px 24px",
                boxShadow: "0 8px 32px rgba(0,0,0,.7)",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    flex: 1,
                    gap: 0,
                  }}
                >
                  {NAV_ITEMS.map((item) => (
                    <NavPill
                      key={item.id}
                      label={item.label}
                      active={activeTab === item.id}
                      onClick={() => handleNav(item.id)}
                    />
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <NotificationBell />

                <button 
                  onClick={() => navigate("/citizen/account")}
                  title="My Account"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "1px solid rgba(30,95,255,0.3)",
                    background: "rgba(0,0,0,0.85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all .2s ease",
                    backdropFilter: "blur(30px)",
                    WebkitBackdropFilter: "blur(30px)",
                    boxShadow: "0 6px 18px rgba(0,0,0,.45)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,0.6)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.95)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,0.3)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.85)";
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1e5fff, #4d8aff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      ...DM,
                    }}
                  >
                    {userInitials}
                  </div>
                </button>
              </div>
              </div>
            </nav>

            {/* ═══════ BOX 1 — Welcome + Case Status ═══════ */}
            <div ref={sec0} className="a0" style={{ position: "relative", width: "100%", paddingTop: 70 }}>
              {/* Search bar */}
              <div style={{ width: "42%", minWidth: 320, position: "absolute", top: 0, left: 18, zIndex: 20 }}>
                <div
                  className="search-wrap"
                  style={{
                    ...DM,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "rgba(0,0,0,0.85)",
                    backdropFilter: "blur(50px)",
                    WebkitBackdropFilter: "blur(50px)",
                    border: "none",
                    borderRadius: 999,
                    padding: "16px 24px",
                    boxShadow: "0 10px 26px rgba(0,0,0,.55)",
                    cursor: "text",
                    marginBottom: 28,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(180,210,255,.75)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>

                  <input
                    className="search-input"
                    placeholder="search cases, hearing, documents"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searching ? (
                    <span style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.45)", flexShrink: 0 }}>Searching...</span>
                  ) : (
                    <span
                      style={{
                        ...DM,
                        fontSize: 11,
                        color: "rgba(255,255,255,.4)",
                        flexShrink: 0,
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(255,255,255,.12)",
                        borderRadius: 6,
                        padding: "2px 8px",
                      }}
                    >
                      ⌘K
                    </span>
                  )}
                </div>

                {searchResults && searchQuery.trim().length >= 2 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% - 28px)",
                      left: 0,
                      right: 0,
                      marginTop: 6,
                      background: "rgba(0,0,0,0.92)",
                      backdropFilter: "blur(20px)",
                      border: "none",
                      borderRadius: 12,
                      padding: 12,
                      boxShadow: SH_CARD,
                      zIndex: 100,
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {searchResults.cases?.length === 0 && searchResults.documents?.length === 0 ? (
                      <p
                        style={{
                          ...DM,
                          fontSize: 12,
                          color: "rgba(255,255,255,.3)",
                          textAlign: "center",
                          padding: 12,
                        }}
                      >
                        No results found
                      </p>
                    ) : (
                      <>
                        {searchResults.cases?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <p
                              style={{
                                ...DM,
                                fontSize: 9,
                                letterSpacing: "1.5px",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,.3)",
                                marginBottom: 6,
                              }}
                            >
                              CASES
                            </p>
                            {searchResults.cases.map((c: any) => (
                              <div
                                key={c._id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.1)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "transparent";
                                }}
                                onClick={() => {
                                  setSearchQuery("");
                                  setSearchResults(null);
                                  navigate(`/citizen/cases/${c._id}`);
                                }}
                              >
                                <span style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)" }}>{c.title}</span>
                                <span style={{ ...DM, fontSize: 9, color: BLUEB }}>{c.caseId}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {searchResults.documents?.length > 0 && (
                          <div>
                            <p
                              style={{
                                ...DM,
                                fontSize: 9,
                                letterSpacing: "1.5px",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,.3)",
                                marginBottom: 6,
                              }}
                            >
                              DOCUMENTS
                            </p>
                            {searchResults.documents.map((d: any) => (
                              <div
                                key={d._id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.1)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "transparent";
                                }}
                                onClick={() => {
                                  setSearchQuery("");
                                  setSearchResults(null);
                                  navigate("/citizen/documents");
                                }}
                              >
                                <span style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)" }}>{d.name}</span>
                                <span style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)" }}>{d.fileType}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <Plate glassStyle={GLASS_BOX1} style={{ padding: "70px 38px 48px", marginLeft: 18 }}>
                <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
                  {/* LEFT — Welcome */}
                  <div
                    style={{
                      flex: "1 1 0",
                      minWidth: 320,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      gap: 36,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          ...DM,
                          fontSize: 11,
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                          color: "rgba(200,220,255,.85)",
                          marginBottom: 18,
                          fontWeight: 600,
                        }}
                      >
                        WELCOME BACK{user?.name ? `, ${user.name.split(" ")[0].toUpperCase()}` : ""}
                      </p>
                      <p
                        style={{
                          ...DM,
                          fontSize: 14,
                          color: "rgba(255,255,255,.65)",
                          lineHeight: 1.7,
                          maxWidth: 460,
                        }}
                      >
                        {casesList.length > 0 ? (
                          <>
                            Your legal requests are being processed.
                            {nextHearingDate && (
                              <>
                                {" "}
                                Next consultation on <span style={{ color: ICEB, fontWeight: 600 }}>{nextHearingDate}</span>
                              </>
                            )}
                            {pendingDocs > 0 && (
                              <>
                                {" "}
                                and {pendingDocs} doc{pendingDocs > 1 ? "s" : ""} await review
                              </>
                            )}
                            .
                          </>
                        ) : (
                          <>You have no active requests. Submit a legal request to get started with your legal matters.</>
                        )}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        onClick={() => handleNav("file")}
                        style={{
                          ...DM,
                          background: BLUE,
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "12px 22px",
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "none",
                          whiteSpace: "nowrap",
                          transition: "transform .2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                      >
                        Submit request
                      </button>

                      <button
                        onClick={() => navigate("/citizen/cases")}
                        style={{
                          ...DM,
                          background: "rgba(0,0,0,0.6)",
                          color: "rgba(255,255,255,.85)",
                          fontSize: 13,
                          fontWeight: 500,
                          padding: "12px 22px",
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "transform .2s ease",
                          boxShadow: "0 6px 16px rgba(0,0,0,.55)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  {/* RIGHT — Case Status */}
                  <div
                    style={{
                      flex: "1 1 0",
                      minWidth: 360,
                      background: INNER_SOLID,
                      border: "none",
                      borderRadius: 18,
                      padding: "22px 26px 38px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      boxShadow: SH_CARD,
                      position: "relative",
                    }}
                  >
                    <p
                      style={{
                        ...DM,
                        fontSize: 11,
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        color: "rgba(200,220,255,.7)",
                        marginBottom: 14,
                        fontWeight: 600,
                      }}
                    >
                      CASE STATUS
                    </p>

                    <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.65)", lineHeight: 1.7 }}>
                      You have <span style={{ color: ICEB, fontWeight: 600 }}>{stats.total}</span> total requests with{" "}
                      <span style={{ color: ICEB, fontWeight: 600 }}>{stats.active}</span> active.
                      {nextHearingDate && (
                        <>
                          {" "}
                          Next consultation is scheduled for{" "}
                          <span style={{ color: ICEB, fontWeight: 600 }}>{nextHearingDate}</span>.
                        </>
                      )}
                      {pendingDocs > 0 && (
                        <>
                          {" "}
                          {pendingDocs} doc{pendingDocs > 1 ? "s are" : " is"} pending verification.
                        </>
                      )}
                    </p>

                    <div
                      style={{
                        position: "absolute",
                        bottom: -16,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 14,
                        zIndex: 30,
                        flexWrap: "wrap",
                      }}
                    >
                      <StatCard value={stats.total} label="Total" />
                      <StatCard value={stats.active} label="Active" />
                      <StatCard value={stats.hearings} label="Consultations" />
                      <StatCard value={stats.resolved} label="Resolved" />
                    </div>
                  </div>
                </div>
              </Plate>
            </div>

            {/* ═══════ BOX 2 — My Cases + Quick File ═══════ */}
            <div id="submit-request" ref={sec1} style={{ marginLeft: 18 }}>
              <Plate glassStyle={GLASS_BOX234} style={{ padding: "70px 38px 48px" }}>
                <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
                  {/* My Requests */}
                  <div
                    id="my-requests"
                    style={innerCard}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "rgba(200,220,255,.85)" }}>My Requests</p>
                      <span
                        onClick={() => navigate("/citizen/cases")}
                        style={{ ...DM, fontSize: 11, color: BLUEB, cursor: "pointer" }}
                      >
                        View all
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                      {["All", "Active", "Pending", "Resolved"].map((t) => (
                        <span
                          key={t}
                          onClick={() => setCaseFilter(t)}
                          style={{
                            ...DM,
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: 99,
                            cursor: "pointer",
                            background: caseFilter === t ? BLUE : "rgba(30,95,255,0.15)",
                            color: "#fff",
                            border: "none",
                            transition: "all .2s ease",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 8, padding: "6px 10px", marginBottom: 4 }}>
                      {["Case ID", "Title", "Status", "Action"].map((h) => (
                        <p
                          key={h}
                          style={{
                            ...DM,
                            fontSize: 9,
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,.2)",
                          }}
                        >
                          {h}
                        </p>
                      ))}
                    </div>

                    <div style={{ maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                      {filteredCases.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 20 }}>
                          <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.3)" }}>No requests found</p>
                          <button
                            onClick={() => handleNav("file")}
                            style={{
                              ...DM,
                              fontSize: 10,
                              color: BLUEB,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              marginTop: 8,
                            }}
                          >
                            Submit your first request
                          </button>
                        </div>
                      ) : (
                        filteredCases.map((r, i) => (
                          <div
                            key={r._id || i}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 2fr 1fr 1fr",
                              gap: 8,
                              padding: "10px 10px",
                              borderRadius: 10,
                              background: i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent",
                              alignItems: "center",
                              marginBottom: 2,
                            }}
                          >
                            <p style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600 }}>{r.caseId}</p>
                            <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)" }}>{r.title}</p>
                            <span
                              style={{
                                ...DM,
                                fontSize: 9,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 99,
                                background: "rgba(30,95,255,0.2)",
                                border: "none",
                                color: "#6aadff",
                                display: "inline-block",
                              }}
                            >
                              {r.status}
                            </span>
                            <span
                              onClick={() => navigate(`/citizen/cases/${r._id}`)}
                              style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}
                            >
                              View
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Submit Legal Request */}
                  <div
                    style={{ ...innerCard, display: "flex", flexDirection: "column", gap: 14 }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div>
                      <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "rgba(200,220,255,.85)", marginBottom: 4 }}>
                        Submit Legal Request
                      </p>
                      <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)" }}>Fill in details below</p>
                    </div>

                    {fileMsg && (
                      <div
                        style={{
                          ...DM,
                          background: fileMsg.type === "success" ? "rgba(52,211,153,.15)" : "rgba(255,107,107,.15)",
                          border: `1px solid ${
                            fileMsg.type === "success" ? "rgba(52,211,153,.3)" : "rgba(255,107,107,.3)"
                          }`,
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 11,
                          color: fileMsg.type === "success" ? "#34d399" : "#ff6b6b",
                        }}
                      >
                        {fileMsg.text}
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <p style={lbl}>Issue Type</p>
                        <select
                          value={fileForm.caseType}
                          onChange={(e) => setFileForm({ ...fileForm, caseType: e.target.value })}
                          style={{ ...inp, cursor: "pointer" }}
                        >
                          <option value="Civil Dispute">Civil Dispute</option>
                          <option value="Property">Property</option>
                          <option value="Criminal">Criminal</option>
                          <option value="Family">Family</option>
                          <option value="Contract">Contract</option>
                          <option value="Consumer">Consumer</option>
                          <option value="Employment">Employment</option>
                        </select>
                      </div>

                      <div>
                        <p style={lbl}>District (Telangana)</p>
                        <select
                          value={fileForm.district}
                          onChange={(e) => setFileForm({ ...fileForm, district: e.target.value, courtName: "" })}
                          style={{ ...inp, cursor: "pointer" }}
                        >
                          <option value="">Select District</option>
                          {telanganaDistricts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <p style={lbl}>Relevant Court / Venue (Optional)</p>
                        <select
                          value={fileForm.courtName}
                          onChange={(e) => setFileForm({ ...fileForm, courtName: e.target.value })}
                          style={{ ...inp, cursor: "pointer" }}
                        >
                          <option value="">Select Court</option>
                          {telanganaCourts
                            .filter((c) => !fileForm.district || c.district === fileForm.district)
                            .map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <p style={lbl}>Issue Title</p>
                        <input
                          placeholder="e.g. Property Dispute in Madhapur"
                          value={fileForm.title}
                          onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                          style={inp}
                        />
                      </div>

                      <div>
                        <p style={lbl}>Brief Description</p>
                        <textarea
                          placeholder="Describe your issue briefly..."
                          rows={3}
                          value={fileForm.description}
                          onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
                          style={{ ...inp, resize: "none" }}
                        />
                      </div>

                      <div>
                        <p style={lbl}>Supporting Documents (Optional)</p>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setSupportingDocs(Array.from(e.target.files || []))}
                          style={{ width: "100%", color: "rgba(255,255,255,.5)" }}
                        />
                        <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
                          Upload proof only if available. You can upload more after request review.
                        </p>
                        {supportingDocs.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            {supportingDocs.map((f, i) => (
                              <p key={i} style={{ ...DM, fontSize: 10, color: BLUEB }}>
                                {f.name}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleFileCase}
                        disabled={filing}
                        style={{
                          ...DM,
                          background: filing ? "rgba(30,95,255,.5)" : BLUE,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "10px 16px",
                          borderRadius: 9,
                          border: "none",
                          cursor: filing ? "not-allowed" : "pointer",
                          boxShadow: "none",
                          transition: "transform .2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!filing) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                      >
                        {filing ? "Submitting..." : "Submit Request"}
                      </button>
                    </div>
                  </div>
                </div>
              </Plate>
            </div>

            {/* ═══════ BOX 3 & 4 ═══════ */}
            <div ref={sec2} style={{ marginLeft: 18 }}>
              {/* AI Legal Assistant Banner */}
              <Plate glassStyle={GLASS_BOX234} id="ai-section" style={{ padding: "70px 38px 48px", marginBottom: 28 }}>
                <div
                  onClick={() => navigate("/citizen/legal-chatbot")}
                  style={{ ...innerCard, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: "linear-gradient(135deg,#1e5fff,#4d8aff)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      AI
                    </div>
                    <div>
                      <p style={{ ...DM, fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>AI Legal Assistant</p>
                      <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>
                        Get instant help with legal notices, deadlines, document checklists, scam detection & more
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 340 }}>
                      {["Notice Explainer", "Deadlines", "Legal Terms", "Scam Detector", "Filing Guide", "Doc Checklist", "Case Insights"].map(
                        (pill) => (
                          <span
                            key={pill}
                            style={{
                              ...DM,
                              fontSize: 9,
                              padding: "4px 10px",
                              borderRadius: 20,
                              background: "rgba(30,95,255,.12)",
                              border: "none",
                              color: ICEB,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {pill}
                          </span>
                        )
                      )}
                    </div>

                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: BLUE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: SH_CARD,
                        marginLeft: 8,
                      }}
                    >
                      &rarr;
                    </div>
                  </div>
                </div>
              </Plate>

              {/* 3-Column Section */}
              <Plate glassStyle={GLASS_BOX234} id="find-lawyer" style={{ padding: "70px 38px 48px" }}>
                <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
                  {/* Recent Activity */}
                  <div
                    style={innerCard}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>Recent Activity</p>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE, display: "inline-block" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                      {activitiesList.length === 0 ? (
                        <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center", padding: 20 }}>
                          No recent activity
                        </p>
                      ) : (
                        activitiesList.map((a, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: BLUEB,
                                flexShrink: 0,
                                marginTop: 4,
                              }}
                            />
                            <div>
                              <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.55)" }}>{a.text}</p>
                              <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 1 }}>{a.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Assigned Lawyers */}
                  <div
                    style={innerCard}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>Assigned Lawyers</p>
                      <span
                        onClick={() => navigate("/citizen/find-lawyer")}
                        style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}
                      >
                        Find More
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                      {lawyersList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 20 }}>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)" }}>No lawyers assigned</p>
                          <span
                            onClick={() => navigate("/citizen/find-lawyer")}
                            style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}
                          >
                            Find a lawyer
                          </span>
                        </div>
                      ) : (
                        lawyersList.map((l, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg,#0a1840,#1e5fff)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                flexShrink: 0,
                                ...DM,
                                color: "#fff",
                              }}
                            >
                              {l.initials}
                            </div>
                            <div>
                              <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{l.name}</p>
                              <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 1 }}>{l.caseName}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* My Documents */}
                  <div
                    id="documents-section"
                    style={innerCard}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>My Documents</p>
                      <span
                        onClick={() => navigate("/citizen/documents")}
                        style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}
                      >
                        Upload
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                      {docsList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 20 }}>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)" }}>No documents uploaded</p>
                          <span
                            onClick={() => navigate("/citizen/documents")}
                            style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}
                          >
                            Upload documents
                          </span>
                        </div>
                      ) : (
                        docsList.map((d, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                style={{
                                  ...DM,
                                  fontSize: 9,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "rgba(30,95,255,.15)",
                                  border: "none",
                                  color: BLUEB,
                                }}
                              >
                                {d.fileType}
                              </span>
                              <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>{d.name}</p>
                            </div>
                            <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", flexShrink: 0 }}>{d.date}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Plate>
            </div>
          </div>
          </>
        )}
      </main>
    </div>
  );
}