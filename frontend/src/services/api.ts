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

// ── Dashboard ──────────────────────────────────────────────
export const getDashboard = () => API.get("/dashboard");
export const globalSearch = (query: string) =>
  API.get(`/dashboard/search?q=${query}`);

// ── Cases ──────────────────────────────────────────────────
export const getMyCases = (params?: {
  status?: string;
  search?: string;
  page?: number;
}) => API.get("/cases", { params });

export const createCase = (data: FormData) =>
  API.post("/cases", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getCaseStats = () => API.get("/cases/stats");
export const getCaseDetail = (id: string) => API.get(`/cases/${id}`);
export const getCaseTimeline = (id: string) => API.get(`/cases/${id}/timeline`);
export const updateCaseNotes = (id: string, data: { notes?: string; description?: string }) =>
  API.patch(`/cases/${id}`, data);

// ── Saved Cases ────────────────────────────────────────────
export const getSavedCases = () =>
  API.get("/cases/saved");

export const addSavedCase = (data: {
  court: string;
  courtComplex?: string;
  caseType: string;
  mtype: number;
  caseNumber: string;
  year: number;
  label?: string;
  cnrNumber?: string;
  distCode?: string;
  distName?: string;
  complexCode?: string;
  complexName?: string;
}) => API.post("/cases/saved", data);

export const deleteSavedCase = (id: string) =>
  API.delete(`/cases/saved/${id}`);

export const updateSavedCase = (id: string, data: { label?: string }) =>
  API.patch(`/cases/saved/${id}`, data);

// ── Track Cases ────────────────────────────────────────────
export const trackByCredentials = (data: {
  court: string;
  caseType: string;
  caseNumber: string;
  year: number;
  mtype: number;
  cnrNumber?: string;
  captcha: string;
  captchaId: string;
  sessionCookie: string;
  distCode?: string;
  complexCode?: string;
}) => API.post("/track/credentials", data);

export const trackByCNR = (data: {
  cnrNumber: string;
  court?:    string;
}) => API.post("/track/cnr", data);

export const trackSavedCase = (savedCaseId: string) =>
  API.get(`/track/saved/${savedCaseId}`);

export const getCourtInfo = (courtName: string) => {
  const encoded = encodeURIComponent(courtName);
  return API.get(`/track/court-info?court=${encoded}`);
};

// ── Hearings / Consultations ───────────────────────────────
export const getMyHearings = (params = {}) =>
  API.get("/hearings", { params });
export const getNextHearing = () => API.get("/hearings/next");
export const getHearingById = (id: string) => API.get(`/hearings/${id}`);
export const requestReschedule = (id: string, reason: string) =>
  API.post(`/hearings/${id}/reschedule-request`, { reason });

// ── Documents ──────────────────────────────────────────────
export const getMyDocuments = () => API.get("/documents");
export const uploadDocument = (formData: FormData) =>
  API.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (id: string) => API.delete(`/documents/${id}`);
export const downloadDocument = (id: string) =>
  API.get(`/documents/${id}/download`, { responseType: "blob" });

// ── Activity ───────────────────────────────────────────────
export const getMyActivity = (limit?: number) =>
  API.get("/activity", { params: { limit } });

// ── Notifications ──────────────────────────────────────────
export const getMyNotifications = () => API.get("/notifications");
export const markNotificationRead = (id: string) =>
  API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  API.patch("/notifications/read-all");
export const deleteNotification = (id: string) =>
  API.delete(`/notifications/${id}`);
export const clearReadNotifications = () =>
  API.delete("/notifications/clear-read");

// ── Profile ────────────────────────────────────────────────
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

// ── Locations ──────────────────────────────────────────────
export const getLocationData = () => API.get("/locations");
export const getDistricts = () => API.get("/locations/districts");
export const getCourts = (district?: string) =>
  API.get("/locations/courts", { params: { district } });
export const getSpecializations = () => API.get("/locations/specializations");

// ── Lawyers (Citizen View) ─────────────────────────────────
export const browseLawyers = (params?: {
  specialization?: string;
  search?: string;
  experience?: number;
  district?: string;
  language?: string;
  availability?: string;
  minExperience?: number;
  maxExperience?: number;
  minRating?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}) => API.get("/lawyers/browse", { params });

export const getLawyerPublicProfile = (id: string) =>
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

export const bookAppointment = (data: {
  lawyerId: string;
  caseId?: string;
  appointmentDate: string;
  appointmentTime: string;
  mode?: string;
  notes?: string;
}) => API.post("/lawyers/appointment", data);

export const getMyAppointments = (status?: string) =>
  API.get("/lawyers/appointments", { params: { status } });

export const cancelAppointment = (id: string) =>
  API.patch(`/lawyers/appointment/${id}/cancel`);

export const submitReview = (lawyerId: string, data: {
  rating: number;
  comment?: string;
  caseId?: string;
}) => API.post(`/lawyers/review/${lawyerId}`, data);

export const getLawyerReviews = (lawyerId: string) =>
  API.get(`/lawyers/reviews/${lawyerId}`);

// ── Help & Support ─────────────────────────────────────────
export const getFAQs = (category?: string) =>
  API.get("/help/faqs", { params: { category } });
export const submitSupportMessage = (data: {
  subject: string;
  message: string;
}) => API.post("/help/contact", data);
export const getMySupportMessages = () => API.get("/help/my-messages");

// ── AI Features ────────────────────────────────────────────
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

// ── AI Conversations (New) ─────────────────────────────────
export const getConversations = (params?: { page?: number; limit?: number; type?: string }) =>
  API.get("/ai/conversations", { params });

export const createConversation = (data: { title?: string; type?: string }) =>
  API.post("/ai/conversations", data);

export const getConversationById = (conversationId: string, params?: { page?: number }) =>
  API.get(`/ai/conversations/${conversationId}`, { params });

export const updateConversation = (
  conversationId: string,
  data: { title?: string; isPinned?: boolean }
) => API.patch(`/ai/conversations/${conversationId}`, data);

export const deleteConversation = (conversationId: string) =>
  API.delete(`/ai/conversations/${conversationId}`);

export const deleteAllConversations = () =>
  API.delete("/ai/conversations/all");

export const getChatHistory = (sessionId?: string) =>
  API.get("/ai/chat/history", { params: { sessionId } });
export const getChatSessions = () => API.get("/ai/chat/sessions");
export const deleteChatSession = (sessionId: string) =>
  API.delete(`/ai/chat/session/${sessionId}`);
export const clearAllChats = () => API.delete("/ai/chat/clear");

// ── Prediction ─────────────────────────────────────────────
export const predictCaseOutcome = (data: {
  caseType: string;
  caseDetails?: object;
  additionalInfo?: string;
}) => API.post("/prediction/predict", data);

export const getPredictionHistory = () => API.get("/prediction/history");

// ── Voice ──────────────────────────────────────────────────
export const voiceChat = (data: {
  message: string;
  sessionId?: string;
}) => API.post("/voice/chat", data);

// ── Analytics ──────────────────────────────────────────────
export const getMyStats = () => API.get("/analytics/my-stats");
export const getGlobalStats = () => API.get("/analytics/global-stats");
export const getScamTrends = () => API.get("/analytics/scam-trends");

// ── Lawyer Panel (Lawyer Role) ─────────────────────────────
export const getLawyerDashboard = () => API.get("/lawyer/dashboard");

export const getIncomingRequests = (params?: {
  status?: string;
  page?: number;
}) => API.get("/lawyer/requests", { params });

export const acceptLawyerRequest = (
  id: string,
  data?: { responseMessage?: string }
) => API.patch(`/lawyer/requests/${id}/accept`, data);

export const rejectLawyerRequest = (
  id: string,
  data?: { responseMessage?: string }
) => API.patch(`/lawyer/requests/${id}/reject`, data);

export const getLawyerCases = (params?: {
  status?: string;
  search?: string;
  page?: number;
}) => API.get("/lawyer/cases", { params });

export const getLawyerCaseDetails = (id: string) =>
  API.get(`/lawyer/cases/${id}`);

export const updateLawyerCaseNotes = (
  id: string,
  data: { notes?: string; status?: string }
) => API.patch(`/lawyer/cases/${id}/notes`, data);

export const getLawyerConsultations = (params?: {
  status?: string;
  upcoming?: string;
}) => API.get("/lawyer/appointments", { params });

export const updateConsultationStatus = (
  id: string,
  data: { status: string; meetingLink?: string }
) => API.patch(`/lawyer/appointments/${id}/status`, data);

export const getLawyerOwnProfile = () => API.get("/lawyer/profile");

export const updateLawyerProfile = (data: {
  phone?: string;
  address?: string;
  bio?: string;
  languages?: string[];
  availability?: string;
  availableDays?: string[];
  consultationFee?: number;
  specialization?: string;
  courtsPracticing?: string[];
  education?: string[];
}) => API.patch("/lawyer/profile", data);

export const updateAvailability = (availability: string) =>
  API.patch("/lawyer/availability", { availability });

export const getLawyerNotifications = (unreadOnly?: boolean) =>
  API.get("/lawyer/notifications", { params: { unreadOnly } });

export const markLawyerNotificationRead = (id: string) =>
  API.patch(`/lawyer/notifications/${id}/read`);

// ── Court Staff Panel ──────────────────────────────────────
export const getCourtStaffDashboard = () =>
  API.get("/court-staff/dashboard");

export const getCourtCases = (params?: {
  status?: string;
  search?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => API.get("/court-staff/cases", { params });

export const getCourtCaseDetails = (id: string) =>
  API.get(`/court-staff/cases/${id}`);

export const updateCourtCaseStatus = (
  id: string,
  data: { status: string; notes?: string }
) => API.patch(`/court-staff/cases/${id}/status`, data);

export const assignLawyerToCase = (
  id: string,
  data: { lawyerId: string }
) => API.patch(`/court-staff/cases/${id}/assign-lawyer`, data);

export const removeLawyerFromCase = (id: string) =>
  API.patch(`/court-staff/cases/${id}/remove-lawyer`);

export const getAvailableLawyers = (params?: {
  specialization?: string;
  district?: string;
}) => API.get("/court-staff/available-lawyers", { params });

// ── Admin Panel ────────────────────────────────────────────
export const getPendingLawyers = () =>
  API.get("/admin/pending-lawyers");

export const approveLawyer = (id: string) =>
  API.patch(`/admin/approve-lawyer/${id}`);

export const rejectLawyer = (id: string, data?: { reason?: string }) =>
  API.patch(`/admin/reject-lawyer/${id}`, data);

export const getLawyerStats = () => API.get("/admin/lawyers-stats");

export const importLawyers = (formData: FormData) =>
  API.post("/admin/import-lawyers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const clearGeneratedLawyers = () =>
  API.delete("/admin/clear-generated");

export const clearSyntheticLawyers = () =>
  API.delete("/admin/clear-synthetic");

export const downloadCSVTemplate = () =>
  API.get("/admin/csv-template");

// ── CNR Assignment (Court Staff via caseRoutes) ────────────
export const assignCNR = (id: string, data: { cnrNumber: string }) =>
  API.patch(`/cases/${id}/cnr`, data);

// Add in Profile section
export const updateLanguage = (language: string) =>
  API.patch("/profile/language", { language });

export const getLanguage = () =>
  API.get("/profile/language");

export const getCaptcha = (courtName?: string) => {
  const court = courtName || "Telangana High Court, Hyderabad";
  const encoded = encodeURIComponent(court);
  return API.get(`/track/captcha?court=${encoded}`);
};

// ── eCourts Dropdown APIs ──────────────────────────────────
export const getECourtsDistricts = () =>
  API.get("/track/ecourts/districts");

export const getECourtsComplexes = (distCode: string) =>
  API.get("/track/ecourts/complexes", { params: { distCode } });

export const getECourtsCaseTypes = (distCode: string, complexCode: string) =>
  API.get("/track/ecourts/case-types", { params: { distCode, complexCode } });

// ── Push Notifications ─────────────────────────────────────
export const getPushPublicKey = () => API.get("/push/public-key");

export const subscribePush = (data: {
  subscription: any;
  deviceLabel:  string;
}) => API.post("/push/subscribe", data);

export const unsubscribePush = (endpoint: string) =>
  API.post("/push/unsubscribe", { endpoint });

export const testPush = () => API.post("/push/test");

export const getPushSubscriptions = () => API.get("/push/subscriptions");

// ── Notification Preferences ────────────────────────────────────
export const getNotificationPreferences = () =>
  API.get("/profile/notifications");

export const updateNotificationPreferences = (data: {
  hearingReminders?: boolean;
  caseUpdates?:      boolean;
  reminderDays?:     number[];
}) => API.patch("/profile/notifications", data);

export const removeDevice = (endpoint: string) =>
  API.delete("/profile/device", { data: { endpoint } });

export default API;