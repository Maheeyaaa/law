import { useState, useEffect, useRef, CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, globalSearch, createCase } from "../services/api";

/* ──────────── Fonts & tokens ──────────── */
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };

const BLUE = "#1748cf";
const BLUEB = "#1748cf";
const ICEB = "#1748cf";

const SH_CARD = "0 8px 32px rgba(0,0,0,.7)";

const GLASS_BOX1 = {
  background: "rgba(0, 0, 0, 0.85)",
  backdropFilter: "blur(50px)",
  WebkitBackdropFilter: "blur(50px)",
  border: "1px solid rgba(30, 95, 255, 0.3)",
  boxShadow: "none",
};

const GLASS_BOX234 = {
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
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BLUE }} />
      <p style={{ ...BN, fontSize: 18, lineHeight: 1.1, color: "#fff", letterSpacing: 0.5, margin: 0 }}>{value}</p>
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
    "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy", "Vikarabad",
    "Warangal Urban", "Warangal Rural", "Hanumakonda", "Khammam", "Nalgonda",
    "Karimnagar", "Nizamabad", "Adilabad", "Komaram Bheem Asifabad", "Mancherial",
    "Peddapalli", "Jagtial", "Rajanna Sircilla", "Kamareddy", "Medak",
    "Siddipet", "Jangaon", "Mahabubabad", "Warangal", "Suryapet",
    "Yadadri Bhuvanagiri", "Mahabubnagar", "Nagarkurnool", "Wanaparthy",
    "Jogulamba Gadwal", "Narayanpet", "Mulugu", "Jayashankar Bhupalpally",
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
        if (parts.length >= 2) setUserInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
        else if (parts.length === 1) setUserInitials(parts[0][0].toUpperCase());
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
      setFileMsg({ type: "success", text: `Request submitted! ID: ${res.data.case.caseId}` });
      setFileForm({ caseType: "Civil Dispute", title: "", description: "", district: "", courtName: "" });
      setSupportingDocs([]);
      try {
        const dashRes = await getDashboard();
        const data = dashRes.data;
        if (data.stats) setStats(data.stats);
        if (data.recentCases) setCasesList(data.recentCases);
        if (data.activities) setActivitiesList(data.activities);
      } catch {}
    } catch (err: any) {
      setFileMsg({ type: "error", text: err.response?.data?.message || "Failed to submit request" });
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
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "rgba(2,8,30,0.28)", pointerEvents: "none" }} />

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
              <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: "13px", display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Rest of your JSX remains same */}
          </div>
        )}
      </main>
    </div>
  );
}