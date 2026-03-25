import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import NoticeExplainer from "./pages/NoticeExplainer"
import DeadlineCalculator from "./pages/DeadlineCalculator"
import FilingGuide from "./pages/FilingGuide"
import DocumentChecklist from "./pages/DocumentChecklist"
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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/notice" element={<NoticeExplainer />} />
        <Route path="/deadline" element={<DeadlineCalculator />} />
        <Route path="/guide" element={<FilingGuide />} />
        <Route path="/checklist" element={<DocumentChecklist />} />
        <Route path="/citizen/legal-chatbot" element={<LegalChatbot />} />
        <Route path="/citizen" element={<Citizen />} />
        <Route path="/citizen/cases" element={<MyCases />} />
        <Route path="/citizen/cases/:id" element={<CaseDetail />} />
        <Route path="/citizen/hearings" element={<Hearings />} />
        <Route path="/citizen/documents" element={<Documents />} />
        <Route path="/citizen/track" element={<TrackStatus />} />
        <Route path="/citizen/find-lawyer" element={<FindLawyer />} />
        <Route path="/citizen/notifications" element={<Notifications />} />
        <Route path="/citizen/help" element={<Help />} />
        <Route path="/citizen/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App