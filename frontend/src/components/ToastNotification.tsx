// frontend/src/components/ToastNotification.tsx

import { useState, useEffect, useRef, CSSProperties } from "react";
import { getMyNotifications } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };

interface Notification {
  _id:       string;
  title:     string;
  message:   string;
  type:      string;
  subType?:  string;
  read:      boolean;
  createdAt: string;
}

interface Toast {
  id:      string;
  title:   string;
  message: string;
  type:    string;
  subType?: string;
}

const getIcon = (subType?: string, type?: string) => {
  if (subType === "hearing_today")    return "🚨";
  if (subType === "hearing_1day")     return "⏰";
  if (subType === "hearing_7day")     return "📅";
  if (subType === "status_change")    return "🔄";
  if (subType === "next_date_change") return "📆";
  if (subType === "judge_change")     return "👨‍⚖️";
  if (type === "hearing_reminder")    return "🔔";
  if (type === "case_update")         return "📋";
  if (type === "case")                return "📁";
  if (type === "document")            return "📄";
  if (type === "system")              return "⚙️";
  return "💬";
};

export default function ToastNotification() {
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const seenIdsRef                      = useRef<Set<string>>(new Set());
  const isFirstFetchRef                 = useRef(true);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchAndCheck = async () => {
    try {
      const { data } = await getMyNotifications();
      const notifications: Notification[] = data.notifications || [];

      // On first fetch, just record existing IDs — don't show toasts
      if (isFirstFetchRef.current) {
        notifications.forEach((n) => seenIdsRef.current.add(n._id));
        isFirstFetchRef.current = false;
        return;
      }

      // On subsequent fetches, find NEW notifications
      const newOnes = notifications.filter(
        (n) => !seenIdsRef.current.has(n._id) && !n.read
      );

      // Add new IDs to seen set
      newOnes.forEach((n) => seenIdsRef.current.add(n._id));

      // Show toast for each new notification (max 3 at once)
      newOnes.slice(0, 3).forEach((n, i) => {
        setTimeout(() => {
          const toast: Toast = {
            id:      n._id,
            title:   n.title,
            message: n.message,
            type:    n.type,
            subType: n.subType,
          };

          setToasts((prev) => {
            // Max 5 toasts at once
            const updated = [...prev, toast];
            return updated.slice(-5);
          });

          // Auto remove after 5 seconds
          setTimeout(() => removeToast(n._id), 5000);

        }, i * 500); // Stagger multiple toasts
      });

    } catch (error) {
      // Silently fail — don't break the app
    }
  };

  // Poll every 30 seconds
  useEffect(() => {
    fetchAndCheck();
    const interval = setInterval(fetchAndCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position:  "fixed",
        bottom:    24,
        right:     24,
        zIndex:    9999,
        display:   "flex",
        flexDirection: "column",
        gap:       10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents:    "auto",
            width:            320,
            background:       "rgba(0,0,0,0.92)",
            backdropFilter:   "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border:           "1px solid rgba(30,95,255,0.4)",
            borderRadius:     14,
            padding:          "14px 16px",
            boxShadow:        "0 8px 32px rgba(0,0,0,0.6)",
            display:          "flex",
            alignItems:       "flex-start",
            gap:              12,
            animation:        "slideIn 0.3s ease",
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: 22, flexShrink: 0 }}>
            {getIcon(toast.subType, toast.type)}
          </span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              ...DM,
              fontSize:   13,
              fontWeight: 700,
              color:      "#fff",
              marginBottom: 3,
            }}>
              {toast.title}
            </p>
            <p style={{
              ...DM,
              fontSize:  11,
              color:     "rgba(255,255,255,0.6)",
              lineHeight: 1.4,
              overflow:   "hidden",
              display:    "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {toast.message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: "none",
              border:     "none",
              color:      "rgba(255,255,255,0.4)",
              fontSize:   16,
              cursor:     "pointer",
              padding:    0,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>
  );
}