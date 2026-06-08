import { useEffect, useState, CSSProperties } from "react";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
} from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue', cursive" };
const HD: CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
};

const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const GOLD = "#8D7435";
const GOLD_LIGHT = "rgba(141, 116, 53, 0.18)";
const GOLD_BORDER = "rgba(141, 116, 53, 0.34)";
const BOX_TINT = "rgba(25, 21, 43, 0.34)";
const BOX_TINT_HOVER = "rgba(25, 21, 43, 0.42)";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

const GLASS: CSSProperties = {
  background: BOX_TINT,
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.35)",
};

function typeIcon(type: string): string {
  switch (type) {
    case "hearing_reminder": return "CS";
    case "case":             return "RQ";
    case "case_update":      return "RQ";
    case "document":         return "DC";
    case "support":          return "SP";
    case "voice":            return "VC";
    case "ai":               return "AI";
    case "system":           return "SY";
    default:                 return "NT";
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "hearing_reminder": return "#3b82f6";
    case "case":             return "#34d399";
    case "case_update":      return "#34d399";
    case "document":         return "#fbbf24";
    case "support":          return "#a78bfa";
    case "voice":            return "#f97316";
    case "ai":               return "#22d3ee";
    case "system":           return "#9ca3af";
    default:                 return "#6aadff";
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "hearing_reminder": return "Hearing Reminder";
    case "case":             return "Case";
    case "case_update":      return "Case Update";
    case "document":         return "Document";
    case "support":          return "Support";
    case "voice":            return "Voice";
    case "ai":               return "AI";
    case "system":           return "System";
    default:                 return type;
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
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getMyNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const existing = notifications.find((n) => n._id === id);
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (existing && !existing.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm("Clear all read notifications?")) return;

    try {
      await clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = (() => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "hearing_reminder":
        return notifications.filter((n) => n.type === "hearing_reminder");
      case "case_update":
        return notifications.filter((n) => 
          n.type === "case_update" || n.type === "case"
        );
      case "document":
        return notifications.filter((n) => n.type === "document");
      case "system":
        return notifications.filter((n) => n.type === "system");
      default:
        return notifications;
    }
  })();

  const groupByDate = (notifs: NotificationItem[]) => {
    const groups: Record<string, NotificationItem[]> = {};
    const now = new Date();

    notifs.forEach((n) => {
      const diff = Math.floor(
        (now.getTime() - new Date(n.createdAt).getTime()) / 86400000
      );

      const key =
        diff === 0
          ? "Today"
          : diff === 1
            ? "Yesterday"
            : diff < 7
              ? "This Week"
              : "Earlier";

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return groups;
  };

  const grouped = groupByDate(filteredNotifications);
  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  const stats = [
    { label: "Total",    value: notifications.length },
    { label: "Unread",   value: unreadCount },
    {
      label: "Hearings",
      value: notifications.filter((n) => n.type === "hearing_reminder").length,
    },
    {
      label: "Case Updates",
      value: notifications.filter((n) => 
        n.type === "case_update" || n.type === "case"
      ).length,
    },
    {
      label: "Documents",
      value: notifications.filter((n) => n.type === "document").length,
    },
    {
      label: "System",
      value: notifications.filter((n) => n.type === "system").length,
    }
  ];

  return (
    <div
      style={{
        backgroundColor: "#050a14",
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.56), rgba(0, 0, 0, 0.56)), linear-gradient(rgba(54, 24, 105, 0.42), rgba(54, 24, 105, 0.42)), url('/not.jpg')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        padding: "44px 28px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <p
              style={{
                ...HD,
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: GOLD,
                margin: 0,
                lineHeight: 1,
              }}
            >
              Notifications
            </p>

            {unreadCount > 0 && (
              <span
                style={{
                  ...DM,
                  background: BLUE,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 99,
                  boxShadow: `0 0 12px ${BLUE}`,
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                ...DM,
                background: "rgba(30,95,255,.15)",
                color: BLUEB,
                fontSize: 11,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 0,
                border: "1px solid rgba(30,95,255,.3)",
                cursor: "pointer",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(30,95,255,.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(30,95,255,.15)";
              }}
            >
              Mark All Read
            </button>
          )}

          {notifications.some((n) => n.read) && (
            <button
              onClick={handleClearRead}
              style={{
                ...DM,
                background: "rgba(239,68,68,.15)",
                color: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 0,
                border: "1px solid rgba(239,68,68,.3)",
                cursor: "pointer",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,.15)";
              }}
            >
              Clear Read
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {stats.map((stat) => {
          return (
            <div
              key={stat.label}
              style={{
                background: BOX_TINT,
                border: "1px solid rgba(141, 116, 53, 0.24)",
                borderTop: `2px solid ${GOLD_BORDER}`,
                boxShadow: "none",
                borderRadius: 0,
                padding: "16px 18px",
                position: "relative",
                overflow: "hidden",
                transition: "transform .2s ease, background .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.background = BOX_TINT_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = BOX_TINT;
              }}
            >
              <p
                style={{
                  ...DM,
                  fontSize: 8,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.55)",
                  marginBottom: 6,
                  marginTop: 0,
                }}
              >
                {stat.label}
              </p>
              <p style={{ ...BN, fontSize: 28, color: GOLD, margin: 0 }}>
                {String(stat.value).padStart(2, "0")}
              </p>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: BOX_TINT,
          border: `1px solid ${GOLD_LIGHT}`,
          borderRadius: 0,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "all",              label: "All"              },
          { id: "unread",           label: "Unread"           },
          { id: "hearing_reminder", label: "Hearing Reminders"},
          { id: "case_update",      label: "Case Updates"     },
          { id: "document",         label: "Documents"        },
          { id: "system",           label: "System"           },
        ].map((f) => {
          const isActive = filter === f.id;

          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                ...DM,
                fontSize: 11,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 99,
                cursor: "pointer",
                background: isActive ? GOLD : "rgba(255,255,255,0.04)",
                color: isActive ? "#111" : GOLD,
                border: `1px solid ${GOLD}`,
                boxShadow: "none",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(141,116,53,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ ...GLASS, borderRadius: 0, padding: 60, textAlign: "center" }}>
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
          <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)", margin: 0 }}>
            Loading notifications...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          style={{
            background: BOX_TINT,
            border: "1px solid rgba(141, 116, 53, 0.24)",
            borderTop: `2px solid ${GOLD_BORDER}`,
            boxShadow: "none",
            borderRadius: 0,
            padding: 60,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 12px",
              border: `1px solid ${GOLD_BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: GOLD,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            NT
          </div>

          <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.42)", margin: 0 }}>
            {filter === "unread" ? "No unread notifications" : "No notifications found"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groupOrder.map((group) => {
            if (!grouped[group] || grouped[group].length === 0) return null;

            return (
              <div key={group}>
                <p
                  style={{
                    ...DM,
                    fontSize: 10,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.25)",
                    marginBottom: 12,
                    paddingLeft: 4,
                    marginTop: 0,
                  }}
                >
                  {group}
                </p>

                <div style={{ ...GLASS, borderRadius: 0, overflow: "hidden" }}>
                  {grouped[group].map((n, i) => (
                    <div
                      key={n._id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "16px 20px",
                        borderBottom:
                          i < grouped[group].length - 1
                            ? "1px solid rgba(255,255,255,.05)"
                            : "none",
                        background: "rgba(25, 21, 43, 0.16)",
                        transition: "background .2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(25, 21, 43, 0.24)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(25, 21, 43, 0.16)";
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 0,
                          background: `${typeColor(n.type)}15`,
                          border: `1px solid ${typeColor(n.type)}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "1px",
                          color: typeColor(n.type),
                          flexShrink: 0,
                        }}
                      >
                        {typeIcon(n.type)}
                      </div>

                      <div
                        style={{ flex: 1, minWidth: 0 }}
                        onClick={() => {
                          if (!n.read) handleMarkRead(n._id);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <p
                            style={{
                              ...DM,
                              fontSize: 13,
                              fontWeight: !n.read ? 700 : 500,
                              color: !n.read ? "#fff" : "rgba(255,255,255,.68)",
                              margin: 0,
                            }}
                          >
                            {n.title}
                          </p>

                          {!n.read && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: GOLD,
                                boxShadow: "none",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>

                        <p
                          style={{
                            ...DM,
                            fontSize: 11,
                            color: "rgba(255,255,255,.48)",
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {n.message}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginTop: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              ...DM,
                              fontSize: 9,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: `${typeColor(n.type)}15`,
                              color: typeColor(n.type),
                            }}
                          >
                            {typeLabel(n.type)}
                          </span>

                          <span
                            style={{
                              ...DM,
                              fontSize: 9,
                              color: "rgba(255,255,255,.25)",
                            }}
                          >
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(n._id);
                            }}
                            style={{
                              ...DM,
                              background: "rgba(30,95,255,.15)",
                              color: BLUEB,
                              fontSize: 9,
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: 0,
                              border: "1px solid rgba(30,95,255,.25)",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(30,95,255,.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(30,95,255,.15)";
                            }}
                          >
                            Mark Read
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n._id);
                          }}
                          style={{
                            ...DM,
                            background: "rgba(239,68,68,.10)",
                            color: "#ef4444",
                            fontSize: 9,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 0,
                            border: "1px solid rgba(239,68,68,.20)",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,.20)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,.10)";
                          }}
                        >
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
  );
}