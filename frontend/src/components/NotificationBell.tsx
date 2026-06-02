// frontend/src/components/NotificationBell.tsx

import { useState, useEffect, useRef, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1748cf";

interface Notification {
  _id:         string;
  title:       string;
  message:     string;
  type:        string;
  subType?:    string;
  read:        boolean;
  link?:       string;
  relatedCase?: string;
  createdAt:   string;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen]                 = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [loading, setLoading]           = useState(false);
  const dropdownRef                     = useRef<HTMLDivElement>(null);

  // ── Fetch notifications ────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await getMyNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Initial fetch + poll every 30 seconds ──────────────────
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Close dropdown when clicking outside ───────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Handlers ───────────────────────────────────────────────
  const handleNotificationClick = async (notif: Notification) => {
    try {
      if (!notif.read) {
        await markNotificationRead(notif._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
      }

      // Use the link from notification (backend generates correct URL)
      if (notif.link) {
        navigate(notif.link);
      } else if (notif.relatedCase) {
        // Fallback if no link
        navigate(`/citizen/track?savedCase=${notif.relatedCase}`);
      }

      setOpen(false);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/citizen/notifications");
  };

  // ── Format relative time ────────────────────────────────────
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60)    return "just now";
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // ── Get icon for notification type ──────────────────────────
  const getIcon = (subType?: string, type?: string) => {
    if (subType === "hearing_today")    return "🚨";
    if (subType === "hearing_1day")     return "⏰";
    if (subType === "hearing_7day")     return "📅";
    if (subType === "status_change")    return "🔄";
    if (subType === "next_date_change") return "📆";
    if (subType === "judge_change")     return "👨‍⚖️";
    if (type === "hearing_reminder")    return "🔔";
    if (type === "case_update")         return "📋";
    return "💬";
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* ── BELL BUTTON ────────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        title="Notifications"
        style={{
          width:           44,
          height:          44,
          borderRadius:    "50%",
          border:          "1px solid rgba(30,95,255,0.3)",
          background:      "rgba(0,0,0,0.85)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          cursor:          "pointer",
          padding:         0,
          transition:      "all .2s ease",
          backdropFilter:  "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          boxShadow:       "0 6px 18px rgba(0,0,0,.45)",
          flexShrink:      0,
          position:        "relative",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform   = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,0.6)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform   = "translateY(0)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,0.3)";
        }}
      >
        {/* Bell SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position:     "absolute",
              top:          4,
              right:        4,
              minWidth:     18,
              height:       18,
              padding:      "0 4px",
              borderRadius: 9,
              background:   "#ff3b30",
              color:        "#fff",
              fontSize:     10,
              fontWeight:   700,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              ...DM,
              border:       "2px solid #000",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── DROPDOWN PANEL ─────────────────────────────────── */}
      {open && (
        <div
          style={{
            position:          "absolute",
            top:               "calc(100% + 10px)",
            right:             0,
            width:             380,
            maxHeight:         500,
            background:        "rgba(0,0,0,0.95)",
            backdropFilter:    "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border:            "1px solid rgba(30,95,255,0.3)",
            borderRadius:      16,
            boxShadow:         "0 10px 40px rgba(0,0,0,.7)",
            zIndex:            1000,
            display:           "flex",
            flexDirection:     "column",
            overflow:          "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding:         "16px 20px",
              borderBottom:    "1px solid rgba(255,255,255,0.08)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "space-between",
            }}
          >
            <p style={{ ...DM, fontSize: 14, fontWeight: 600, color: "#fff" }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  ...DM,
                  fontSize:    11,
                  color:       "#6aadff",
                  background:  "none",
                  border:      "none",
                  cursor:      "pointer",
                  padding:     0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              flex:           1,
              overflowY:      "auto",
              minHeight:      80,
              maxHeight:      400,
            }}
          >
            {loading && notifications.length === 0 ? (
              <p
                style={{
                  ...DM,
                  fontSize:  12,
                  color:     "rgba(255,255,255,.4)",
                  textAlign: "center",
                  padding:   30,
                }}
              >
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
                <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding:       "14px 20px",
                    borderBottom:  "1px solid rgba(255,255,255,0.05)",
                    cursor:        "pointer",
                    background:    n.read ? "transparent" : "rgba(30,95,255,0.08)",
                    transition:    "background .15s ease",
                    display:       "flex",
                    gap:           12,
                    alignItems:    "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = n.read
                      ? "transparent"
                      : "rgba(30,95,255,0.08)";
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {getIcon(n.subType, n.type)}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        ...DM,
                        fontSize:   12,
                        fontWeight: n.read ? 500 : 700,
                        color:      "#fff",
                        marginBottom: 2,
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        ...DM,
                        fontSize:    11,
                        color:       "rgba(255,255,255,.55)",
                        lineHeight:  1.4,
                        marginBottom: 4,
                        display:        "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow:       "hidden",
                      }}
                    >
                      {n.message}
                    </p>
                    <p
                      style={{
                        ...DM,
                        fontSize: 9,
                        color:    "rgba(255,255,255,.3)",
                      }}
                    >
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {!n.read && (
                    <span
                      style={{
                        width:        7,
                        height:       7,
                        borderRadius: "50%",
                        background:   BLUE,
                        flexShrink:   0,
                        marginTop:    6,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding:       "12px 20px",
                borderTop:     "1px solid rgba(255,255,255,0.08)",
                textAlign:     "center",
              }}
            >
              <button
                onClick={handleViewAll}
                style={{
                  ...DM,
                  fontSize:    11,
                  color:       "#6aadff",
                  background:  "none",
                  border:      "none",
                  cursor:      "pointer",
                  padding:     0,
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}