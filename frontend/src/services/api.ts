// frontend/src/services/api.ts

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
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

// Find Lawyer
export const browseLawyers = (params?: {
  specialization?: string;
  search?: string;
  experience?: number;
  page?: number;
}) => API.get("/lawyers/browse", { params });

export const getLawyerProfile = (id: string) =>
  API.get(`/lawyers/profile/${id}`);

export const sendLawyerRequest = (data: {
  lawyerId: string;
  caseId?: string;
  message: string;
}) => API.post("/lawyers/request", data);

export const getMyLawyerRequests = (status?: string) =>
  API.get("/lawyers/my-requests", { params: { status } });

export const cancelLawyerRequest = (id: string) =>
  API.delete(`/lawyers/request/${id}`);


// Documents
export const downloadDocument = (id: string) =>
  API.get(`/documents/${id}/download`, { responseType: "blob" });

// Notifications (expanded)
export const deleteNotification = (id: string) =>
  API.delete(`/notifications/${id}`);
export const clearReadNotifications = () =>
  API.delete("/notifications/clear-read");

// Help Center
export const getFAQs = (category?: string) =>
  API.get("/help/faqs", { params: { category } });
export const submitSupportMessage = (data: {
  subject: string;
  message: string;
}) => API.post("/help/contact", data);
export const getMySupportMessages = () => API.get("/help/my-messages");

// AI Chatbot
export const sendChatMessage = (data: {
  message: string;
  sessionId?: string;
}) => API.post("/ai/chatbot", data);

export const explainNotice = (data: FormData | { notice: string }) => {
  if (data instanceof FormData) {
    return API.post("/ai/explain-notice", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return API.post("/ai/explain-notice", data);
};

export const calculateDeadline = (data: {
  noticeType?: string;
  receivedDate?: string;
  noticeText?: string;
}) => API.post("/ai/deadline", data);

export const decodeLegalTerm = (data: {
  term: string;
  context?: string;
}) => API.post("/ai/decode-term", data);

export const filingGuidance = (data: {
  caseType: string;
  description?: string;
  court?: string;
  state?: string;
}) => API.post("/ai/filing-guide", data);

export const generateChecklist = (data: {
  caseType: string;
  purpose?: string;
  state?: string;
}) => API.post("/ai/checklist", data);

export const checkLegalAid = (data: {
  annualIncome?: string;
  category?: string;
  caseType?: string;
  state?: string;
  description?: string;
}) => API.post("/ai/legal-aid", data);

export const detectScam = (data: FormData | { notice: string }) => {
  if (data instanceof FormData) {
    return API.post("/ai/detect-scam", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return API.post("/ai/detect-scam", data);
};

export const getChatHistory = (sessionId?: string) =>
  API.get("/ai/chat/history", { params: { sessionId } });

export const getChatSessions = () => API.get("/ai/chat/sessions");

export const deleteChatSession = (sessionId: string) =>
  API.delete(`/ai/chat/session/${sessionId}`);

export const clearAllChats = () => API.delete("/ai/chat/clear");

export default API;