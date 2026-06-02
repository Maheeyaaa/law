// frontend/public/service-worker.js

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Service worker activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "New Notification", body: event.data?.text() || "" };
  }

  const title = data.title || "Legal App";
  const options = {
    body: data.body || "You have a new notification",
    tag:  data.tag  || "default",
    data: {
      url: data.url || "/",
      ...data.data,
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            return client.navigate(targetUrl);
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});