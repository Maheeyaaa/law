import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home"
import LegalChatbot from "./pages/LegalChatbot"
import Citizen from "./pages/Citizen";
import MyCases from "./pages/MyCases";
import CaseDetail from "./pages/CaseDetail";
import Hearings from "./pages/Hearings";
import Documents from "./pages/Documents";
import TrackStatus from "./pages/TrackStatus";
import FindLawyer from "./pages/FindLawyer";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import AdminImportLawyers from "./pages/AdminImportLawyers";
import Lawyer from "./pages/Lawyer";
import CourtStaff from "./pages/CourtStaff";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main */}
        <Route path="/" element={<Home />} />
        
        /*
        AI Legal Assistant

        Provides:
        - legal information
        - notice explanation
        - legal aid guidance
        - document checklist
        */
        <Route path="/citizen/legal-chatbot" element={<LegalChatbot />} />
        <Route path="/citizen/ai-assistant" element={<LegalChatbot />} />
        
        {/* Redirect old routes to unified AI page */}
        <Route path="/notice" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        <Route path="/deadline" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        <Route path="/guide" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        <Route path="/checklist" element={<Navigate to="/citizen/legal-chatbot" replace />} />
        
        /*
        Citizen Legal Guidance Portal

        Flow:
        AI Assistant
        → Submit Legal Request
        → Lawyer Consultation
        → Progress Tracking
        */
        <Route path="/citizen" element={<Citizen />} />
        <Route path="/citizen/cases" element={<MyCases />} />
        <Route path="/citizen/cases/:id" element={<CaseDetail />} />
        <Route path="/citizen/hearings" element={<Hearings />} />
        <Route path="/citizen/documents" element={<Documents />} />
        <Route path="/citizen/track" element={<TrackStatus />} />
        <Route path="/citizen/find-lawyer" element={<FindLawyer />} />
        <Route path="/citizen/notifications" element={<Notifications />} />
        <Route path="/citizen/help" element={<Help />} />
        <Route path="/citizen/account" element={<Settings />} />

        <Route path="/lawyer" element={<Lawyer />} />
        <Route path="/legal-coordinator" element={<CourtStaff />} />

        <Route
          path="/court-staff"
          element={<Navigate to="/legal-coordinator" replace />}
        />

        <Route
          path="/citizen/requests"
          element={<Navigate to="/citizen/cases" replace />}
        />

        <Route
          path="/citizen/consultations"
          element={<Navigate to="/citizen/hearings" replace />}
        />

        <Route
          path="/citizen/progress"
          element={<Navigate to="/citizen/track" replace />}
        />
        
        {/* Admin */}
        <Route path="/platform-admin" element={<AdminPanel />} />

        <Route
          path="/admin-panel"
          element={<Navigate to="/platform-admin" replace />}
        />
        <Route path="/admin/import-lawyers" element={<AdminImportLawyers />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App