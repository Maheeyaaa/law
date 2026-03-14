// frontend/src/services/api.ts

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dashboard
export const getDashboard = () => API.get("/dashboard");
export const globalSearch = (query: string) =>
  API.get(`/dashboard/search?q=${query}`);

// Cases
export const getMyCases = (params?: {
  status?: string;
  search?: string;
  page?: number;
}) => API.get("/cases", { params });
export const createCase = (data: {
  title: string;
  description: string;
  caseType: string;
}) => API.post("/cases", data);
export const getCaseStats = () => API.get("/cases/stats");

// Hearings
export const getMyHearings = () =>
  API.get("/hearings", { params: { upcoming: "true" } });

// Documents
export const getMyDocuments = () => API.get("/documents");
export const uploadDocument = (formData: FormData) =>
  API.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (id: string) => API.delete(`/documents/${id}`);

// Activity
export const getMyActivity = (limit?: number) =>
  API.get("/activity", { params: { limit } });

// Notifications
export const getMyNotifications = () => API.get("/notifications");
export const markNotificationRead = (id: string) =>
  API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  API.patch("/notifications/read-all");

// Lawyers
export const getApprovedLawyers = () => API.get("/users/lawyers");

// Profile
export const getProfile = () => API.get("/profile");
export const updateProfile = (data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
}) => API.patch("/profile", data);
export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}) => API.patch("/profile/change-password", data);
export const uploadAvatar = (formData: FormData) =>
  API.post("/profile/upload-avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Case Detail + Timeline
export const getCaseDetail = (id: string) => API.get(`/cases/${id}`);
export const getCaseTimeline = (id: string) =>
  API.get(`/cases/${id}/timeline`);
export const updateCaseNotes = (id: string, data: { notes?: string; description?: string }) =>
  API.patch(`/cases/${id}`, data);

// Track Status
export const trackCase = (caseId: string) =>
  API.get(`/track/case/${encodeURIComponent(caseId)}`);
export const trackCaseById = (id: string) => API.get(`/track/id/${id}`);

export default API;