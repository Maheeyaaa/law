// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { VoiceProvider } from "./context/VoiceContext";
import VoiceAssistant from "./components/voice/VoiceAssistant";
import VoiceMicButton from "./components/voice/VoiceMicButton";

import Home from "./pages/Home";
import LegalChatbot from "./pages/LegalChatbot";
import Citizen from "./pages/Citizen";
import MyCases from "./pages/MyCases";
import CaseDetail from "./pages/CaseDetail";
import Documents from "./pages/Documents";
import TrackStatus from "./pages/TrackStatus";
import FindLawyer from "./pages/FindLawyer";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import AdminImportLawyers from "./pages/AdminImportLawyers";
import CourtStaff from "./pages/CourtStaff";

function AppContent() {
  return (
    <>
      {/* Voice - works on ALL pages */}
      <VoiceAssistant />
      <VoiceMicButton />

      <Routes>
        {/* Main */}
        <Route path="/" element={<Home />} />

        {/* AI Legal Assistant */}
        <Route path="/citizen/legal-chatbot" element={<LegalChatbot />} />
        <Route path="/citizen/ai-assistant" element={<LegalChatbot />} />

        {/* Redirects */}
        <Route path="/notice" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        <Route path="/deadline" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        <Route path="/guide" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        <Route path="/checklist" element={<Navigate to="/citizen/legal-chatbot" replace />} />

        {/* Citizen */}
        <Route path="/citizen" element={<Citizen />} />
        <Route path="/citizen/cases" element={<MyCases />} />
        <Route path="/citizen/cases/:id" element={<CaseDetail />} />
        <Route path="/citizen/documents" element={<Documents />} />
        <Route path="/citizen/track" element={<TrackStatus />} />
        <Route path="/citizen/find-lawyer" element={<FindLawyer />} />
        <Route path="/citizen/notifications" element={<Notifications />} />
        <Route path="/citizen/help" element={<Help />} />
        <Route path="/citizen/account" element={<Settings />} />

        {/* Citizen redirects */}
        <Route path="/citizen/requests" element={<Navigate to="/citizen/cases" replace />} />
        <Route path="/citizen/consultations" element={<Navigate to="/citizen/cases" replace />} />
        <Route path="/citizen/progress" element={<Navigate to="/citizen/track" replace />} />
        <Route path="/citizen/hearings" element={<Navigate to="/citizen/track" replace />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/import-lawyers" element={<AdminImportLawyers />} />

        {/* Court Staff */}
        <Route path="/court-staff" element={<CourtStaff />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <VoiceProvider>
        <AppContent />
      </VoiceProvider>
    </BrowserRouter>
  );
}

export default App;