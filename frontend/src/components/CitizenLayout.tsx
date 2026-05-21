// frontend/src/components/CitizenLayout.tsx

import { useState, useEffect, useRef, CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import scalesNavy from "../assets/scales-navy.png";

const PF: CSSProperties = { fontFamily: "'Playfair Display',serif" };
const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";

const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.4)",
};

interface NI { label: string; icon: string; badge?: number; id: string; route: string }

const NAV1: NI[] = [
  { label: "Dashboard", icon: "⊞", id: "dash", route: "/citizen" },

  { label: "AI Legal Assistant", icon: "🤖", id: "ai", route: "/citizen/legal-chatbot" },

  { label: "Submit Legal Request", icon: "✏️", id: "request", route: "/citizen" },

  { label: "My Requests", icon: "📁", id: "cases", route: "/citizen/cases" },

  { label: "Find Lawyer", icon: "👤", id: "law", route: "/citizen/find-lawyer" },

  { label: "Consultations", icon: "📅", id: "consult", route: "/citizen/hearings" },

  { label: "Track Progress", icon: "🔍", id: "track", route: "/citizen/track" },
];

const NAV2: NI[] = [];

const NAV3: NI[] = [];

function NavSec({ label, items, active, onNav }: { label: string; items: NI[]; active: string; onNav: (item: NI) => void }) {
  return (
    <div style={{ padding: "16px 10px 2px" }}>
      <p style={{ ...DM, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,.9)", padding: "0 10px 7px" }}>{label}</p>
      {items.map(item => {
        const on = item.id === active;
        return (
          <button key={item.id} onClick={() => onNav(item)}
            style={{ ...DM, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 11, border: on ? "1px solid rgba(30,95,255,.5)" : "1px solid rgba(30,95,255,.2)", background: on ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", color: on ? "#fff" : "rgba(255,255,255,.55)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 5, textAlign: "left", transition: "all .2s ease", boxShadow: on ? "3px 4px 14px rgba(0,0,0,.6), 0 0 0 1px rgba(30,95,255,.15)" : "3px 4px 12px rgba(0,0,0,.5)" }}
            onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.45)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.65)"; } }}
            onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.55)"; } }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? BLUEB : "rgba(255,255,255,.25)", flexShrink: 0, boxShadow: on ? `0 0 7px ${BLUE}` : undefined }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && <span style={{ ...DM, background: BLUE, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function CitizenLayout({ children, activeNav }: { children: ReactNode; activeNav: string }) {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Rahul Kumar");
  const [userInitials, setUserInitials] = useState("RK");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.name) {
          setUserName(user.name);
          const parts = user.name.split(" ");
          setUserInitials(parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase());
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleNav = (item: NI) => {

    const dashboardScrollMap: Record<string, string> = {
      ai: "ai-section",
      request: "submit-request",
      cases: "my-requests",
      law: "find-lawyer",
    };

    const target = dashboardScrollMap[item.id];

    if (target) {

      if (window.location.pathname === "/citizen") {

        const el =
          document.getElementById(target);

        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          return;
        }
      }

      navigate("/citizen");

      setTimeout(() => {
        document
          .getElementById(target)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 400);

      return;
    }

    navigate(item.route);
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
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(30,95,255,.3); border-radius:3px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ ...GLASS, background: "rgba(10,20,60,0.18)", width: 244, minWidth: 244, height: "100vh", flexShrink: 0, position: "relative", zIndex: 20, borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, overflow: "hidden", position: "relative", marginBottom: 11, boxShadow: "0 0 22px rgba(30,95,255,.45)" }}>
            <img src={scalesNavy} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .22 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(18,55,200,.95),rgba(60,120,255,.9))" }} />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚖</span>
          </div>
          <p style={{ ...PF, fontSize: 20, fontWeight: 700, background: "linear-gradient(135deg,#fff 30%,#a8c8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LegalMind</p>
          <p
            style={{
              ...DM,
              fontSize: 10,
              color: "rgba(255,255,255,.45)",
              marginTop: 4,
              lineHeight: 1.4
            }}
          >
            AI-powered legal guidance and lawyer assistance
          </p>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,.2)", marginTop: 2 }}>Legal Guidance Portal</p>
        </div>
        <div style={{ flex: 1 }}>
          <NavSec label="Main" items={NAV1} active={activeNav} onNav={handleNav} />
          {NAV2.length > 0 && (
            <NavSec label="Resources" items={NAV2} active={activeNav} onNav={handleNav} />
          )}
          {NAV3.length > 0 && (
            <NavSec label="Support" items={NAV3} active={activeNav} onNav={handleNav} />
          )}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
          <div onClick={() => navigate("/citizen/account")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 13, background: "rgba(255,255,255,.03)", border: "1px solid rgba(30,95,255,.1)", cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, ...DM }}>{userInitials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ ...DM, fontSize: 13, fontWeight: 600 }}>{userName}</p>
              <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 1 }}>LegalMind Citizen</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", position: "relative", zIndex: 10, padding: 24 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
            padding: "18px 22px 0",
            pointerEvents: "none",
          }}
        >
        <div
          onClick={() => navigate("/citizen/notifications")}
          style={{
            pointerEvents: "auto",
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "rgba(0,0,0,.75)",
            border: "1px solid rgba(30,95,255,.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 18,
            backdropFilter: "blur(16px)",
            boxShadow: "3px 4px 14px rgba(0,0,0,.5)",
            transition: "all .2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <>
            🔔
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#1e5fff",
                boxShadow: "0 0 8px #1e5fff",
              }}
            />
          </>
        </div>
      </div>
      {children}
      </main>
    </div>
  );
}