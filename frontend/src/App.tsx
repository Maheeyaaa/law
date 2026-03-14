import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import NoticeExplainer from "./pages/NoticeExplainer"
import DeadlineCalculator from "./pages/DeadlineCalculator"
import FilingGuide from "./pages/FilingGuide"
import DocumentChecklist from "./pages/DocumentChecklist"
import LegalChatbot from "./pages/LegalChatbot"
import Citizen from "./pages/Citizen";

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

      </Routes>
    </BrowserRouter>
  )
}

export default App