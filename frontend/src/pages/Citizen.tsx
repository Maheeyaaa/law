import { useState, useEffect, useRef, CSSProperties, ReactNode } from "react";
import scalesNavy from "../assets/scales-navy.png";

const PF: CSSProperties = { fontFamily: "'Playfair Display',serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };

const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";

/* Shared glass style for sidebar + all 3 outer boxes */
const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.4)",
};

interface NI { label: string; icon: string; badge?: number; id: string }

const NAV1: NI[] = [
  { label: "Dashboard", icon: "⊞", id: "dash" },
  { label: "My Cases", icon: "📁", badge: 3, id: "cases" },
  { label: "File New Case", icon: "✏️", id: "file" },
  { label: "Hearings", icon: "📅", badge: 1, id: "hear" },
];
const NAV2: NI[] = [
  { label: "Find Lawyer", icon: "👤", id: "law" },
  { label: "Documents", icon: "📄", id: "docs" },
  { label: "Track Status", icon: "🔍", id: "track" },
  { label: "Notifications", icon: "🔔", id: "notif" },
];
const NAV3: NI[] = [
  { label: "Help Center", icon: "❓", id: "help" },
  { label: "Settings", icon: "⚙️", id: "set" },
];

/* Map nav id → section ref index */
const NAV_TO_SECTION: Record<string, number> = {
  dash: 0, cases: 1, file: 1, hear: 0,
  law: 2, docs: 2, track: 1, notif: 0,
  help: 2, set: 2,
};

function Plate({ children, style, id }: { children: ReactNode; style?: CSSProperties; id?: string }) {
  return (
    <div id={id} style={{
      ...GLASS,
      borderRadius: 26,
      position: "relative",
      overflow: "hidden",
      ...style
    }}>
      <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function NavSec({ label, items, active, onNav }: { label: string; items: NI[]; active: string; onNav: (id: string) => void }) {
  return (
    <div style={{ padding: "16px 10px 2px" }}>
      <p style={{ ...DM, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,.9)", padding: "0 10px 7px" }}>{label}</p>
      {items.map(item => {
        const on = item.id === active;
        return (
          <button key={item.id} onClick={() => onNav(item.id)}
            style={{ ...DM, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 11, border: on ? "1px solid rgba(30,95,255,.5)" : "1px solid rgba(30,95,255,.2)", background: on ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", color: on ? "#fff" : "rgba(255,255,255,.55)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 5, textAlign: "left", transition: "all .2s ease", boxShadow: on ? "3px 4px 14px rgba(0,0,0,.6), 0 0 0 1px rgba(30,95,255,.15)" : "3px 4px 12px rgba(0,0,0,.5)" }}
            onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.45)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.65)"; } }}
            onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.55)"; } }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? BLUEB : "rgba(255,255,255,.25)", flexShrink: 0, boxShadow: on ? `0 0 7px ${BLUE}` : undefined }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && <span style={{ ...DM, background: BLUE, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function CitizenDashboard() {
  const [nav, setNav] = useState("dash");
  const mainRef = useRef<HTMLDivElement>(null);
  const sec0 = useRef<HTMLDivElement>(null); // box 1
  const sec1 = useRef<HTMLDivElement>(null); // box 2
  const sec2 = useRef<HTMLDivElement>(null); // box 3

  const sectionRefs = [sec0, sec1, sec2];

  const handleNav = (id: string) => {
    setNav(id);
    const idx = NAV_TO_SECTION[id] ?? 0;
    const target = sectionRefs[idx].current;
    if (target && mainRef.current) {
      mainRef.current.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
    }
  };

  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  return (
    <div style={{ ...DM, height: "100vh", color: "#fff", display: "flex", overflow: "hidden", position: "relative", background: "transparent" }}>

      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "rgba(2,8,30,0.28)", pointerEvents: "none" }} />

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        .a0 { animation: fadeUp .6s ease both }
        .search-wrap { transition: border-color .22s, transform .2s ease; }
        .search-wrap:hover { border-color:rgba(77,138,255,.65)!important; transform:translateY(-3px); }
        .search-wrap:focus-within { border-color:rgba(77,138,255,.9)!important; }
        .search-input { background:none; border:none; outline:none; color:#fff; width:100%; }
        .search-input::placeholder { color:rgba(255,255,255,.28)!important; }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(30,95,255,.3); border-radius:3px; }
      `}</style>

      {/* ══ SIDEBAR — same glass as boxes ══ */}
      <aside style={{ ...GLASS, background: "rgba(10,20,60,0.18)", width: 244, minWidth: 244, height: "100vh", flexShrink: 0, position: "relative", zIndex: 20, borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, overflow: "hidden", position: "relative", marginBottom: 11, boxShadow: "0 0 22px rgba(30,95,255,.45)" }}>
            <img src={scalesNavy} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .22 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(18,55,200,.95),rgba(60,120,255,.9))" }} />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚖</span>
          </div>
          <p style={{ ...PF, fontSize: 20, fontWeight: 700, background: "linear-gradient(135deg,#fff 30%,#a8c8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LegalMind</p>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,.2)", marginTop: 2 }}>Citizen Portal</p>
        </div>
        <div style={{ flex: 1 }}>
          <NavSec label="Main" items={NAV1} active={nav} onNav={handleNav} />
          <NavSec label="Resources" items={NAV2} active={nav} onNav={handleNav} />
          <NavSec label="Support" items={NAV3} active={nav} onNav={handleNav} />
        </div>
        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 13, background: "rgba(255,255,255,.03)", border: "1px solid rgba(30,95,255,.1)", cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, ...DM }}>RK</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600 }}>Rahul Kumar</p>
              <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 1 }}>Citizen · ID #2024-0311</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main ref={mainRef} style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 10 }}>
        <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* BOX 1 — Welcome + Case Status */}
          <div ref={sec0} className="a0" style={{ position: "relative", width: "100%", paddingTop: 24 }}>
            <div style={{ width: "42%", position: "absolute", top: 0, left: 0, zIndex: 20 }}>
              <div className="search-wrap" style={{ ...DM, display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.80)", backdropFilter: "blur(16px)", border: "1px solid rgba(30,95,255,.32)", borderRadius: 14, padding: "13px 18px", boxShadow: SH_CARD, cursor: "text" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(77,138,255,.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input className="search-input" style={{ ...DM, fontSize: 14, color: "#fff" }} placeholder="Search cases, hearings, documents..." />
                <span style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.18)", flexShrink: 0, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px" }}>⌘K</span>
              </div>
            </div>
            <Plate style={{ padding: "28px 28px 46px", marginLeft: 18 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "stretch", marginTop: 28 }}>
                <div style={{ flex: "0 0 auto", minWidth: 340, maxWidth: 460, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 0" }}>
                  <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.6)", marginBottom: 10 }}>WELCOME BACK</p>
                  <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.8, marginBottom: 20 }}>
                    Your cases are being processed. Hearing on{" "}<span style={{ color: ICEB, fontWeight: 600 }}>March 15th</span>{" "}and 2 docs await review.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...DM, background: BLUE, color: "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", boxShadow: SH_CARD, whiteSpace: "nowrap", transition: "transform .2s ease" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>+ File New Case</button>
                    <button style={{ ...DM, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 500, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", whiteSpace: "nowrap", transition: "transform .2s ease", boxShadow: "3px 4px 12px rgba(0,0,0,.5), 1px 2px 6px rgba(0,0,0,.4)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>View All →</button>
                  </div>
                </div>
                <div style={{ flex: 1, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", border: "none", borderRadius: 14, padding: "24px 28px 44px 28px", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: SH_CARD, marginTop: -40, position: "relative" }}>
                  <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)", marginBottom: 14 }}>CASE STATUS</p>
                  <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.9 }}>
                    Your cases are currently being processed by the court. A hearing has been scheduled for <span style={{ color: ICEB, fontWeight: 600 }}>March 15th</span> regarding your property dispute. Two of your documents are pending verification, and one case is awaiting a judge assignment. Please ensure all required documents are submitted before the hearing date to avoid delays in your proceedings.
                  </p>
                  <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28, zIndex: 30 }}>
                    {([{ value: "07", label: "Total" }, { value: "03", label: "Active" }, { value: "01", label: "Hearings" }, { value: "04", label: "Resolved" }] as const).map(s => (
                      <div key={s.label} style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(60,110,255,0.15)", borderRadius: 10, padding: "8px 18px", position: "relative", overflow: "hidden", textAlign: "center", boxShadow: SH_CARD, width: 90, transition: "transform .2s ease" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#1e5fff", boxShadow: "0 0 6px #1e5fff" }} />
                        <p style={{ ...BN, fontSize: 22, lineHeight: 1, color: "#fff" }}>{s.value}</p>
                        <p style={{ ...DM, fontSize: 8, color: "rgba(77,138,255,.6)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Plate>
          </div>

          {/* BOX 2 — My Cases + Quick File */}
          <div ref={sec1} style={{ marginLeft: 18 }}>
            <Plate style={{ padding: "28px" }}>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1, minWidth: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", border: "none", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff" }}>My Cases</p>
                    <span style={{ ...DM, fontSize: 11, color: BLUEB, cursor: "pointer" }}>View all →</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {["All", "Active", "Pending", "Resolved"].map((t, i) => (
                      <span key={t} style={{ ...DM, fontSize: 10, fontWeight: 600, padding: "4px 12px", borderRadius: 99, cursor: "pointer", background: i === 0 ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: i === 0 ? "none" : `1px solid rgba(30,95,255,0.4)` }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 8, padding: "6px 10px", marginBottom: 4 }}>
                    {["Case ID", "Title", "Status", "Action"].map(h => (
                      <p key={h} style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.2)" }}>{h}</p>
                    ))}
                  </div>
                  <div style={{ maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                    {([
                      { id: "#LM-2025-0041", title: "Property Dispute", status: "Active", sc: "#34d399" },
                      { id: "#LM-2025-0038", title: "Civil Complaint", status: "Pending", sc: "#fbbf24" },
                      { id: "#LM-2025-0031", title: "Tenant Agreement", status: "Resolved", sc: "#93c5fd" },
                      { id: "#LM-2025-0028", title: "Land Acquisition", status: "Active", sc: "#34d399" },
                      { id: "#LM-2025-0021", title: "Contract Breach", status: "Pending", sc: "#fbbf24" },
                      { id: "#LM-2025-0015", title: "Divorce Filing", status: "Resolved", sc: "#93c5fd" },
                    ]).map((r, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 8, padding: "10px 10px", borderRadius: 10, background: i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent", alignItems: "center", marginBottom: 2 }}>
                        <p style={{ ...DM, fontSize: 11, color: BLUEB, fontWeight: 600 }}>{r.id}</p>
                        <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)" }}>{r.title}</p>
                        <span style={{ ...DM, fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: "rgba(30,95,255,0.2)", border: "1px solid rgba(30,95,255,0.5)", color: "#6aadff", display: "inline-block" }}>{r.status}</span>
                        <span style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}>View →</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "20px", border: "none", boxShadow: SH_CARD, transition: "transform .2s ease", display: "flex", flexDirection: "column", gap: 14 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div>
                    <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Quick File</p>
                    <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)" }}>Submit a new case instantly.</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginBottom: 6 }}>Case Type</p>
                      <select style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,.5)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                        <option>Civil Dispute</option><option>Property</option><option>Criminal</option><option>Family</option><option>Contract</option>
                      </select>
                    </div>
                    <div>
                      <p style={{ ...DM, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginBottom: 6 }}>Brief Description</p>
                      <textarea placeholder="Describe your case briefly..." rows={3} style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,.5)", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box" }} />
                    </div>
                    <button style={{ ...DM, background: BLUE, color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 16px", borderRadius: 9, border: "none", cursor: "pointer", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>+ Submit Case</button>
                  </div>
                </div>
              </div>
            </Plate>
          </div>

          {/* BOX 3 — Recent Activity + Lawyers + Documents */}
          <div ref={sec2} style={{ marginLeft: 18 }}>
            <Plate style={{ padding: "28px" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "18px", border: "none", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>Recent Activity</p>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE, boxShadow: `0 0 6px ${BLUE}`, display: "inline-block" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                    {([
                      { text: "Hearing Notice Issued", time: "2h ago" },
                      { text: "Document Uploaded", time: "1d ago" },
                      { text: "Case Status Updated", time: "2d ago" },
                      { text: "Lawyer Assigned", time: "3d ago" },
                      { text: "New Case Filed", time: "5d ago" },
                    ]).map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: BLUEB, flexShrink: 0, marginTop: 4, boxShadow: `0 0 5px ${BLUEB}` }} />
                        <div>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.55)" }}>{a.text}</p>
                          <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 1 }}>{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "18px", border: "none", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>Assigned Lawyers</p>
                    <span style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}>Find More →</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                    {([
                      { name: "Adv. Ananya Priya", case: "Property Dispute", initials: "AP" },
                      { name: "Adv. Suresh K.", case: "Employment Dispute", initials: "SK" },
                      { name: "Adv. Ritu Mehra", case: "Consumer Complaint", initials: "RM" },
                      { name: "Adv. N. Verma", case: "Divorce Proceeding", initials: "NV" },
                    ]).map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, ...DM, color: "#fff" }}>{l.initials}</div>
                        <div>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>{l.name}</p>
                          <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", marginTop: 1 }}>{l.case}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "18px", border: "none", boxShadow: SH_CARD, transition: "transform .2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>My Documents</p>
                    <span style={{ ...DM, fontSize: 10, color: BLUEB, cursor: "pointer" }}>Upload →</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                    {([
                      { name: "Hearing Notice.pdf", size: "1.2 MB", date: "Mar 10" },
                      { name: "Property Deed.pdf", size: "3.4 MB", date: "Feb 28" },
                      { name: "Affidavit.docx", size: "0.8 MB", date: "Feb 20" },
                      { name: "Court Order.pdf", size: "2.1 MB", date: "Feb 12" },
                      { name: "ID Proof.jpg", size: "0.5 MB", date: "Jan 30" },
                    ]).map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...DM, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(30,95,255,.15)", border: "1px solid rgba(30,95,255,.3)", color: BLUEB }}>PDF</span>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>{d.name}</p>
                        </div>
                        <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", flexShrink: 0 }}>{d.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Plate>
          </div>

        </div>
      </main>
    </div>
  );
}