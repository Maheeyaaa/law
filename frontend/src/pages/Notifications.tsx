// frontend/src/pages/Notifications.tsx

import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";

const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.4)",
};

function typeIcon(type: string): string {
  switch (type) {
    case "hearing": return "📅";
    case "case": return "📁";
    case "document": return "📄";
    case "lawyer": return "👤";
    case "system": return "⚙️";
    default: return "🔔";
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "hearing": return "#3b82f6";
    case "case": return "#34d399";
    case "document": return "#fbbf24";
    case "lawyer": return "#a78bfa";
    case "system": return "#9ca3af";
    default: return "#6aadff";
  }
}

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getMyNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const n = notifications.find(n => n._id === id);
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (n && !n.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    if (!confirm("Clear all read notifications?")) return;
    try {
      await clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = (() => {
    switch (filter) {
      case "unread": return notifications.filter(n => !n.read);
      case "hearing": return notifications.filter(n => n.type === "hearing");
      case "case": return notifications.filter(n => n.type === "case");
      case "document": return notifications.filter(n => n.type === "document");
      case "lawyer": return notifications.filter(n => n.type === "lawyer");
      default: return notifications;
    }
  })();

  // Group by date
  const groupByDate = (notifs: any[]) => {
    const groups: Record<string, any[]> = {};
    const now = new Date();

    notifs.forEach(n => {
      const date = new Date(n.createdAt);
      const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);

      let key: string;
      if (diff === 0) key = "Today";
      else if (diff === 1) key = "Yesterday";
      else if (diff < 7) key = "This Week";
      else key = "Earlier";

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return groups;
  };

  const grouped = groupByDate(filteredNotifications);
  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <CitizenLayout activeNav="notif">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>NOTIFICATIONS</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <p style={{ ...BN, fontSize: 32, color: "#fff" }}>Notifications</p>
              {unreadCount > 0 && (
                <span style={{ ...DM, background: BLUE, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, boxShadow: `0 0 12px ${BLUE}` }}>
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ ...DM, background: "rgba(30,95,255,.15)", color: BLUEB, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(30,95,255,.3)", cursor: "pointer", transition: "all .2s ease" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.25)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.15)"}>
                ✓ Mark All Read
              </button>
            )}
            {notifications.some(n => n.read) && (
              <button onClick={handleClearRead} style={{ ...DM, background: "rgba(239,68,68,.15)", color: "#ef4444", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", cursor: "pointer", transition: "all .2s ease" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.25)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.15)"}>
                Clear Read
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Total", value: notifications.length, color: BLUEB },
            { label: "Unread", value: unreadCount, color: "#3b82f6" },
            { label: "Hearings", value: notifications.filter(n => n.type === "hearing").length, color: "#3b82f6" },
            { label: "Cases", value: notifications.filter(n => n.type === "case").length, color: "#34d399" },
            { label: "Documents", value: notifications.filter(n => n.type === "document").length, color: "#fbbf24" },
          ].map((stat, i) => (
            <div key={i} style={{ ...GLASS, borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden", transition: "transform .2s ease" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
              <p style={{ ...DM, fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 6 }}>{stat.label}</p>
              <p style={{ ...BN, fontSize: 28, color: "#fff" }}>{String(stat.value).padStart(2, "0")}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "hearing", label: "📅 Hearings" },
            { id: "case", label: "📁 Cases" },
            { id: "document", label: "📄 Documents" },
            { id: "lawyer", label: "👤 Lawyer" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ ...DM, fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 99, cursor: "pointer", background: filter === f.id ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: filter === f.id ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading notifications...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔔</p>
            <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>
              {filter === "unread" ? "No unread notifications" : "No notifications found"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {groupOrder.map(group => {
              if (!grouped[group] || grouped[group].length === 0) return null;
              return (
                <div key={group}>
                  <p style={{ ...DM, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginBottom: 12, paddingLeft: 4 }}>
                    {group}
                  </p>
                  <div style={{ ...GLASS, borderRadius: 16, overflow: "hidden" }}>
                    {grouped[group].map((n: any, i: number) => (
                      <div key={n._id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderBottom: i < grouped[group].length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", background: !n.read ? "rgba(30,95,255,.05)" : "transparent", transition: "background .2s ease", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = !n.read ? "rgba(30,95,255,.08)" : "rgba(255,255,255,.02)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = !n.read ? "rgba(30,95,255,.05)" : "transparent"}>

                        {/* Icon */}
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${typeColor(n.type)}15`, border: `1px solid ${typeColor(n.type)}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                          {typeIcon(n.type)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }} onClick={() => { if (!n.read) handleMarkRead(n._id); }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <p style={{ ...DM, fontSize: 13, fontWeight: !n.read ? 700 : 500, color: !n.read ? "#fff" : "rgba(255,255,255,.6)" }}>{n.title}</p>
                            {!n.read && (
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE, boxShadow: `0 0 8px ${BLUE}`, flexShrink: 0 }} />
                            )}
                          </div>
                          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{n.message}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                            <span style={{ ...DM, fontSize: 9, padding: "2px 8px", borderRadius: 99, background: `${typeColor(n.type)}15`, color: typeColor(n.type), textTransform: "capitalize" }}>{n.type}</span>
                            <span style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)" }}>{formatTime(n.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          {!n.read && (
                            <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n._id); }} style={{ ...DM, background: "rgba(30,95,255,.15)", color: BLUEB, fontSize: 9, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(30,95,255,.25)", cursor: "pointer", transition: "all .2s ease", whiteSpace: "nowrap" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.25)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.15)"}>
                              Mark Read
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }} style={{ ...DM, background: "rgba(239,68,68,.1)", color: "#ef4444", fontSize: 9, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,.2)", cursor: "pointer", transition: "all .2s ease", whiteSpace: "nowrap" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.2)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.1)"}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </CitizenLayout>
  );
}