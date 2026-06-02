// frontend/src/components/NotificationTest.tsx

import { useEffect, useState } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  isCurrentlySubscribed,
} from "../utils/pushSubscribe";
import API from "../services/api";

export default function NotificationTest() {
  const [supported,   setSupported]   = useState(false);
  const [permission,  setPermission]  = useState<NotificationPermission>("default");
  const [subscribed,  setSubscribed]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState("");

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setSupported(isPushSupported());
    setPermission(getNotificationPermission());
    setSubscribed(await isCurrentlySubscribed());
  };

  const handleEnable = async () => {
    setLoading(true);
    setMessage("");
    const result = await subscribeToPush();
    setMessage(result.message);
    await checkStatus();
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    setMessage("");
    const result = await unsubscribeFromPush();
    setMessage(result.message);
    await checkStatus();
    setLoading(false);
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage("");
    const result = await sendTestPush();
    setMessage(result.message);
    setLoading(false);
  };

  // ✅ NEW — Trigger hearing reminders manually
  const handleTriggerReminders = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await API.post("/push/trigger-reminders");
      setMessage(
        `Job ran! Sent: 7day=${data.result.sent7Day}, 1day=${data.result.sent1Day}, today=${data.result.sentToday}`
      );
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Failed to trigger");
    }
    setLoading(false);
  };

  if (!supported) {
    return (
      <div style={{ padding: 12 }}>
        <h4 style={{ margin: 0, marginBottom: 8 }}>🔔 Push Notifications</h4>
        <p style={{ margin: 0, fontSize: 12 }}>❌ Not supported in this browser</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 4 }}>
      <h4 style={{ margin: 0, marginBottom: 10, fontSize: 14 }}>🔔 Push Notifications</h4>

      <div style={{ marginBottom: 12, fontSize: 11 }}>
        <p style={{ margin: "2px 0" }}><strong>Support:</strong> ✅ Yes</p>
        <p style={{ margin: "2px 0" }}><strong>Permission:</strong> {permission}</p>
        <p style={{ margin: "2px 0" }}><strong>Subscribed:</strong> {subscribed ? "✅ Yes" : "❌ No"}</p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {!subscribed && (
          <button onClick={handleEnable} disabled={loading} style={btnStyle("#4CAF50")}>
            {loading ? "..." : "Enable"}
          </button>
        )}

        {subscribed && (
          <>
            <button onClick={handleTest} disabled={loading} style={btnStyle("#2196F3")}>
              {loading ? "..." : "Test"}
            </button>
            <button onClick={handleTriggerReminders} disabled={loading} style={btnStyle("#9C27B0")}>
              {loading ? "..." : "Trigger"}
            </button>
            <button onClick={handleDisable} disabled={loading} style={btnStyle("#f44336")}>
              {loading ? "..." : "Off"}
            </button>
          </>
        )}
      </div>

      {message && (
        <div style={{ marginTop: 10, padding: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 10 }}>
          {message}
        </div>
      )}
    </div>
  );
}

const btnStyle = (color: string): React.CSSProperties => ({
  padding:      "6px 12px",
  background:   color,
  color:        "white",
  border:       "none",
  borderRadius: 4,
  cursor:       "pointer",
  fontSize:     11,
});