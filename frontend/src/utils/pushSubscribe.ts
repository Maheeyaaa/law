// frontend/src/utils/pushSubscribe.ts
// ══════════════════════════════════════════════════════════════════
// Browser-side logic for enabling/disabling push notifications.
// Handles service worker registration + subscription.
// ══════════════════════════════════════════════════════════════════

import API from "../services/api";    // adjust to your axios instance path

// ── Helper: VAPID key conversion (browser format) ────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── Detect device label ──────────────────────────────────────────
function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  if (ua.includes("Chrome"))      browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari"))  browser = "Safari";
  else if (ua.includes("Edge"))    browser = "Edge";

  if (ua.includes("Windows"))     os = "Windows";
  else if (ua.includes("Mac"))    os = "macOS";
  else if (ua.includes("Linux"))  os = "Linux";
  else if (ua.includes("Android"))os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
}

// ══════════════════════════════════════════════════════════════════
// CHECK SUPPORT
// ══════════════════════════════════════════════════════════════════
export const isPushSupported = (): boolean => {
  return (
    "serviceWorker" in navigator &&
    "PushManager"    in window    &&
    "Notification"   in window
  );
};

// ══════════════════════════════════════════════════════════════════
// GET CURRENT PERMISSION
// ══════════════════════════════════════════════════════════════════
export const getNotificationPermission = (): NotificationPermission => {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
};

// ══════════════════════════════════════════════════════════════════
// REGISTER SERVICE WORKER
// ══════════════════════════════════════════════════════════════════
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js");
  console.log("[Push] Service worker registered:", registration.scope);

  // Wait for it to be active
  if (registration.installing) {
    await new Promise<void>((resolve) => {
      registration.installing!.addEventListener("statechange", function () {
        if (this.state === "activated") resolve();
      });
    });
  }

  return registration;
};

// ══════════════════════════════════════════════════════════════════
// SUBSCRIBE — Enable push notifications
// ══════════════════════════════════════════════════════════════════
export const subscribeToPush = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    if (!isPushSupported()) {
      return { success: false, message: "Push notifications not supported in this browser" };
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, message: "Notification permission denied" };
    }

    // 2. Register service worker
    const registration = await registerServiceWorker();

    // 3. Get VAPID public key from backend
    const { data: keyData } = await API.get("/push/public-key");
    if (!keyData.success || !keyData.publicKey) {
      return { success: false, message: "Server push key not available" };
    }

    // 4. Create subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
    });

    console.log("[Push] Subscription created");

    // 5. Send to backend
    const { data: subData } = await API.post("/push/subscribe", {
      subscription: subscription.toJSON(),
      deviceLabel:  getDeviceLabel(),
    });

    if (!subData.success) {
      return { success: false, message: subData.message || "Failed to save subscription" };
    }

    return {
      success: true,
      message: subData.alreadyExists
        ? "Already enabled on this device"
        : "Notifications enabled successfully!",
    };

  } catch (error: any) {
    console.error("[Push] Subscribe failed:", error);
    return { success: false, message: error.message || "Failed to enable notifications" };
  }
};

// ══════════════════════════════════════════════════════════════════
// UNSUBSCRIBE — Disable push on this device
// ══════════════════════════════════════════════════════════════════
export const unsubscribeFromPush = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { success: false, message: "No service worker registered" };
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { success: true, message: "Already unsubscribed" };
    }

    // Unsubscribe from browser
    await subscription.unsubscribe();

    // Tell backend to remove it
    await API.post("/push/unsubscribe", {
      endpoint: subscription.endpoint,
    });

    return { success: true, message: "Notifications disabled" };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

// ══════════════════════════════════════════════════════════════════
// TEST — Send a test notification
// ══════════════════════════════════════════════════════════════════
export const sendTestPush = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const { data } = await API.post("/push/test");
    return {
      success: data.success,
      message: data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send test",
    };
  }
};

// ══════════════════════════════════════════════════════════════════
// IS CURRENTLY SUBSCRIBED ON THIS DEVICE
// ══════════════════════════════════════════════════════════════════
export const isCurrentlySubscribed = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
};