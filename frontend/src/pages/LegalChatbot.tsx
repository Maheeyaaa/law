// frontend/src/pages/LegalChatbot.tsx

import { useState, useRef, useEffect, type CSSProperties } from "react";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";
const API = "http://localhost:8000/api/ai";
const API_VOICE = "http://localhost:8000/api/voice";
const API_PREDICT = "http://localhost:8000/api/prediction";

const FEATURES = [
  // Interactive AI
  { id: "chat", label: "💬 Legal Chatbot", desc: "Ask any legal question", section: "Interactive AI" },
  { id: "voice", label: "🎤 Voice Assistant", desc: "Speak your questions", section: "Interactive AI" },

  // Analysis Tools
  { id: "predict", label: "🎯 Case Predictor", desc: "Predict case outcome", section: "Analysis Tools" },
  { id: "scam", label: "🚨 Scam Detector", desc: "Verify if notice is fake", section: "Analysis Tools" },
  { id: "notice", label: "📄 Notice Explainer", desc: "Understand legal notices", section: "Analysis Tools" },

  // Planning & Filing
  { id: "courtfee", label: "💰 Court Fee Calculator", desc: "Calculate filing costs", section: "Planning & Filing" },
  { id: "deadline", label: "⏰ Deadline Calculator", desc: "Calculate response dates", section: "Planning & Filing" },
  { id: "filing", label: "📝 Filing Guide", desc: "Step-by-step filing help", section: "Planning & Filing" },
  { id: "checklist", label: "✅ Doc Checklist", desc: "Get required documents", section: "Planning & Filing" },

  // Legal Support
  { id: "term", label: "📖 Term Decoder", desc: "Understand legal terms", section: "Legal Support" },
  { id: "legalaid", label: "🏛️ Legal Aid Check", desc: "Check free aid eligibility", section: "Legal Support" },
];

function getToken() {
  return localStorage.getItem("token") || "";
}

async function callAPI(endpoint: string, body: any, isFormData = false) {
  const headers: any = { Authorization: "Bearer " + getToken() };
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers,
    body: isFormData ? body : JSON.stringify(body),
  });
  return res.json();
}

export default function LegalChatbot() {
  const [feature, setFeature] = useState("chat");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ⭐ VOICE STATE
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const recognitionRef = useRef<any>(null);

  // ⭐ CASE PREDICTION STATE
  const [predCaseType, setPredCaseType] = useState("");
  const [predEvidence, setPredEvidence] = useState(false);
  const [predEvidenceQuality, setPredEvidenceQuality] = useState("moderate");
  const [predWitnesses, setPredWitnesses] = useState(false);
  const [predWitnessCount, setPredWitnessCount] = useState("1");
  const [predWitnessQuality, setPredWitnessQuality] = useState("moderate");
  const [predPrecedent, setPredPrecedent] = useState(false);
  const [predOpponent, setPredOpponent] = useState("moderate");
  const [predLawyer, setPredLawyer] = useState("3");
  const [predJurisdiction, setPredJurisdiction] = useState("");
  const [predInfo, setPredInfo] = useState("");
  const [predResult, setPredResult] = useState<any>(null);

  // Notice state
  const [noticeText, setNoticeText] = useState("");
  const [noticeFile, setNoticeFile] = useState<File | null>(null);

  // Deadline state
  const [deadlineType, setDeadlineType] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineNotice, setDeadlineNotice] = useState("");

  // Term state
  const [term, setTerm] = useState("");
  const [termContext, setTermContext] = useState("");

  // Filing state
  const [filingType, setFilingType] = useState("");
  const [filingState, setFilingState] = useState("");
  const [filingDesc, setFilingDesc] = useState("");

  // Checklist state
  const [checklistType, setChecklistType] = useState("");
  const [checklistState, setChecklistState] = useState("");

  // Legal aid state
  const [aidIncome, setAidIncome] = useState("");
  const [aidCategory, setAidCategory] = useState("");
  const [aidCaseType, setAidCaseType] = useState("");
  const [aidState, setAidState] = useState("");

  // ⭐ COURT FEE CALCULATOR STATE
  const [feeState, setFeeState] = useState("Telangana");
  const [feeCaseType, setFeeCaseType] = useState("");
  const [feeClaimAmount, setFeeClaimAmount] = useState("");
  const [feeResult, setFeeResult] = useState<any>(null);

  // Scam state
  const [scamText, setScamText] = useState("");
  const [scamFile, setScamFile] = useState<File | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  // ⭐ VOICE RECOGNITION SETUP
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-IN";

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        await sendVoiceMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported in this browser. Use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const sendVoiceMessage = async (message: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_VOICE}/chat`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + getToken(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message, sessionId: sessionId || undefined })
      });
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setVoiceResponse(data.reply || data.error);
    } catch {
      setVoiceResponse("Error connecting to server.");
    }
    setLoading(false);
  };

  const speakResponse = () => {
    if (!voiceResponse) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceResponse);
      utterance.lang = "en-IN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser");
    }
  };

  // ⭐ CASE PREDICTION
  const handlePredict = async () => {
    setLoading(true);
    setPredResult(null);
    try {
      const res = await fetch(`${API_PREDICT}/predict`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + getToken(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          caseType: predCaseType,
          caseDetails: {
            hasEvidence: predEvidence,
            evidenceQuality: predEvidenceQuality,
            hasWitnesses: predWitnesses,
            witnessCount: parseInt(predWitnessCount),
            witnessQuality: predWitnessQuality,
            hasLegalPrecedent: predPrecedent,
            opposingPartyStrength: predOpponent,
            lawyerExperience: parseInt(predLawyer),
            jurisdiction: predJurisdiction
          },
          additionalInfo: predInfo
        })
      });
      const data = await res.json();
      setPredResult(data);
    } catch {
      setPredResult({ error: "Error connecting to server" });
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const data = await callAPI("/chatbot", { message: userMsg, sessionId: sessionId || undefined });
      if (data.sessionId) setSessionId(data.sessionId);
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply || data.error }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Error connecting to server." }]);
    }
    setLoading(false);
  };

  const handleNotice = async () => {
    setLoading(true);
    setResult("");
    try {
      let data;
      if (noticeFile) {
        const fd = new FormData();
        fd.append("noticeFile", noticeFile);
        if (noticeText.trim()) fd.append("notice", noticeText.trim());
        data = await callAPI("/explain-notice", fd, true);
      } else {
        data = await callAPI("/explain-notice", { notice: noticeText });
      }
      setResult(data.reply || data.message || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const handleDeadline = async () => {
    setLoading(true);
    setResult("");
    try {
      const data = await callAPI("/deadline", { noticeType: deadlineType, receivedDate: deadlineDate, noticeText: deadlineNotice });
      setResult(data.reply || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const handleTerm = async () => {
    setLoading(true);
    setResult("");
    try {
      const data = await callAPI("/decode-term", { term, context: termContext });
      setResult(data.reply || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const handleFiling = async () => {
    setLoading(true);
    setResult("");
    try {
      const data = await callAPI("/filing-guide", { caseType: filingType, state: filingState, description: filingDesc });
      setResult(data.reply || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const handleChecklist = async () => {
    setLoading(true);
    setResult("");
    try {
      const data = await callAPI("/checklist", { caseType: checklistType, state: checklistState });
      setResult(data.reply || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const handleLegalAid = async () => {
    setLoading(true);
    setResult("");
    try {
      const data = await callAPI("/legal-aid", { annualIncome: aidIncome, category: aidCategory, caseType: aidCaseType, state: aidState });
      setResult(data.reply || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const calculateCourtFee = () => {
    const amount = parseFloat(feeClaimAmount) || 0;
    
    if (!feeCaseType) {
      alert("Please select a case type");
      return;
    }

    if (amount <= 0 && !["Criminal", "Bail Application", "Habeas Corpus", "Writ Petition"].includes(feeCaseType)) {
      alert("Please enter a valid claim amount");
      return;
    }

    let courtFee = 0;
    let stampDuty = 0;
    let advocateFeeMin = 0;
    let advocateFeeMax = 0;
    let processFee = 500;
    let miscFee = 1000;
    let timeline = "";
    let notes: string[] = [];

    // Calculate based on case type and Telangana Court Fees Act
    switch (feeCaseType) {
      case "Civil Suit (Money Recovery)":
        // Telangana: Ad valorem fees
        if (amount <= 50000) {
          courtFee = Math.max(500, amount * 0.075); // 7.5%
        } else if (amount <= 100000) {
          courtFee = 3750 + (amount - 50000) * 0.06; // 6% above 50k
        } else if (amount <= 500000) {
          courtFee = 6750 + (amount - 100000) * 0.05; // 5% above 1L
        } else if (amount <= 1000000) {
          courtFee = 26750 + (amount - 500000) * 0.04; // 4% above 5L
        } else {
          courtFee = 46750 + (amount - 1000000) * 0.03; // 3% above 10L
        }
        stampDuty = 100;
        advocateFeeMin = Math.max(10000, amount * 0.05);
        advocateFeeMax = Math.max(25000, amount * 0.15);
        timeline = "1-3 years";
        notes = [
          "Court fee is ad valorem (based on claim amount)",
          "Additional vakalatnama fee: ₹10-50",
          "Certified copy charges extra"
        ];
        break;

      case "Property Dispute":
        courtFee = amount <= 500000 ? amount * 0.075 : 37500 + (amount - 500000) * 0.05;
        stampDuty = 200;
        advocateFeeMin = 25000;
        advocateFeeMax = Math.max(100000, amount * 0.1);
        timeline = "2-5 years";
        notes = [
          "Property valuation certificate may be required",
          "Additional survey/demarcation charges possible",
          "Title search fee: ₹500-2000"
        ];
        break;

      case "Consumer Complaint":
        if (amount <= 500000) {
          courtFee = 0; // Free at District Forum
          notes = ["District Consumer Forum - No court fee"];
        } else if (amount <= 2000000) {
          courtFee = 200;
          notes = ["District Consumer Forum - ₹200 fee"];
        } else if (amount <= 10000000) {
          courtFee = 400;
          notes = ["State Consumer Commission"];
        } else {
          courtFee = 500;
          notes = ["National Consumer Commission"];
        }
        stampDuty = 0;
        advocateFeeMin = 5000;
        advocateFeeMax = 25000;
        timeline = "3-12 months";
        notes.push("Consumer courts are faster and cheaper");
        break;

      case "Cheque Bounce (Section 138)":
        courtFee = 500; // Fixed fee for 138
        stampDuty = 50;
        advocateFeeMin = 15000;
        advocateFeeMax = 50000;
        timeline = "6-18 months";
        notes = [
          "Fixed court fee for criminal complaint",
          "Must file within 30 days of notice period expiry",
          "Legal notice mandatory before filing"
        ];
        break;

      case "Divorce (Mutual Consent)":
        courtFee = 500;
        stampDuty = 100;
        advocateFeeMin = 15000;
        advocateFeeMax = 50000;
        timeline = "6-12 months";
        notes = [
          "6-month cooling period mandatory",
          "Second motion after cooling period",
          "Both parties need to be present"
        ];
        break;

      case "Divorce (Contested)":
        courtFee = 1000;
        stampDuty = 100;
        advocateFeeMin = 50000;
        advocateFeeMax = 200000;
        timeline = "2-5 years";
        notes = [
          "Longer process with multiple hearings",
          "Alimony/maintenance hearings separate",
          "Child custody adds complexity"
        ];
        break;

      case "Bail Application":
        courtFee = 50;
        stampDuty = 0;
        advocateFeeMin = 10000;
        advocateFeeMax = 100000;
        processFee = 200;
        timeline = "1-7 days";
        notes = [
          "Urgent matter - can be filed same day",
          "Surety bond amount varies by case",
          "Higher courts have higher fees"
        ];
        break;

      case "Criminal Complaint":
        courtFee = 0;
        stampDuty = 0;
        advocateFeeMin = 15000;
        advocateFeeMax = 75000;
        timeline = "1-3 years";
        notes = [
          "No court fee for criminal matters",
          "FIR is free to file at police station",
          "Private complaint has nominal fee"
        ];
        break;

      case "Labour/Employment Dispute":
        courtFee = 0;
        stampDuty = 0;
        advocateFeeMin = 10000;
        advocateFeeMax = 50000;
        timeline = "6-24 months";
        notes = [
          "Labour courts have no fee for workers",
          "Industrial Tribunal for larger disputes",
          "Conciliation mandatory in some cases"
        ];
        break;

      case "RTI Appeal":
        courtFee = 0;
        stampDuty = 0;
        advocateFeeMin = 0;
        advocateFeeMax = 5000;
        processFee = 0;
        miscFee = 100;
        timeline = "1-3 months";
        notes = [
          "First appeal is free",
          "Second appeal: ₹0 (but process takes time)",
          "No lawyer required"
        ];
        break;

      case "Writ Petition (High Court)":
        courtFee = 500;
        stampDuty = 50;
        advocateFeeMin = 25000;
        advocateFeeMax = 200000;
        timeline = "3-12 months";
        notes = [
          "High Court filing",
          "Urgent listing available",
          "Constitutional remedy"
        ];
        break;

      default:
        courtFee = amount * 0.05;
        advocateFeeMin = 10000;
        advocateFeeMax = 50000;
        timeline = "1-3 years";
        notes = ["Standard estimate - consult lawyer for exact fees"];
    }

    // Round all values
    courtFee = Math.round(courtFee);
    stampDuty = Math.round(stampDuty);
    advocateFeeMin = Math.round(advocateFeeMin);
    advocateFeeMax = Math.round(advocateFeeMax);

    const totalMin = courtFee + stampDuty + processFee + miscFee + advocateFeeMin;
    const totalMax = courtFee + stampDuty + processFee + miscFee + advocateFeeMax;

    setFeeResult({
      courtFee,
      stampDuty,
      processFee,
      miscFee,
      advocateFeeMin,
      advocateFeeMax,
      totalMin,
      totalMax,
      timeline,
      notes,
      claimAmount: amount,
      caseType: feeCaseType,
      state: feeState
    });
  };

  const handleScam = async () => {
    setLoading(true);
    setResult("");
    try {
      let data;
      if (scamFile) {
        const fd = new FormData();
        fd.append("noticeFile", scamFile);
        if (scamText.trim()) fd.append("notice", scamText.trim());
        data = await callAPI("/detect-scam", fd, true);
      } else {
        data = await callAPI("/detect-scam", { notice: scamText });
      }
      setResult(data.reply || data.message || data.error);
    } catch { setResult("Error connecting to server."); }
    setLoading(false);
  };

  const newChat = () => {
    setChatMessages([]);
    setSessionId("");
    setResult("");
  };

  const switchFeature = (id: string) => {
    setFeature(id);
    setResult("");
    setPredResult(null);
    setVoiceTranscript("");
    setVoiceResponse("");
  };

  const inputStyle: CSSProperties = { ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
  const labelStyle: CSSProperties = { ...DM, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(255,255,255,.3)", marginBottom: 6 };
  const btnStyle: CSSProperties = { ...DM, background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "11px 20px", borderRadius: 10, border: "none", cursor: "pointer", boxShadow: SH_CARD, width: "100%", transition: "transform .2s ease" };

  return (
    <div style={{ ...DM, height: "100vh", color: "#fff", display: "flex", overflow: "hidden", background: "transparent", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "rgba(2,8,30,0.28)", pointerEvents: "none" }} />
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(30,95,255,.3); border-radius:3px; }
        .feat-btn:hover { transform:translateY(-2px); border-color:rgba(30,95,255,.5)!important; background:rgba(0,0,0,0.65)!important; }
      `}</style>

      {/* LEFT — Feature Selector */}
      <aside style={{ width: 260, minWidth: 260, height: "100vh", background: "rgba(10,20,60,0.18)", backdropFilter: "blur(2px)", borderRight: "1px solid rgba(90,130,220,0.2)", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <p style={{ fontSize: 18, fontWeight: 700, background: "linear-gradient(135deg,#fff 30%,#a8c8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>⚖ LegalMind AI</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 4, letterSpacing: "1.5px", textTransform: "uppercase" }}>AI Legal Assistant</p>
        </div>

        <div style={{ padding: "12px 10px", flex: 1 }}>
          {/* Group features by section */}
          {["Interactive AI", "Analysis Tools", "Planning & Filing", "Legal Support"].map((sectionName) => (
            <div key={sectionName} style={{ marginBottom: 16 }}>
              {/* Section Header */}
              <p style={{
                ...DM,
                fontSize: 9,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(168,200,255,.5)",
                padding: "8px 10px 6px",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <span style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: BLUEB,
                  display: "inline-block"
                }} />
                {sectionName}
              </p>

              {/* Features in this section */}
              {FEATURES.filter((f) => f.section === sectionName).map((f) => {
                const on = f.id === feature;
                return (
                  <button
                    key={f.id}
                    className="feat-btn"
                    onClick={() => switchFeature(f.id)}
                    style={{
                      ...DM,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      padding: "10px 14px",
                      borderRadius: 11,
                      border: on ? "1px solid rgba(30,95,255,.5)" : "1px solid rgba(30,95,255,.15)",
                      background: on ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.45)",
                      color: on ? "#fff" : "rgba(255,255,255,.5)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      marginBottom: 5,
                      textAlign: "left",
                      transition: "all .2s ease",
                      boxShadow: on ? "3px 4px 14px rgba(0,0,0,.6)" : "none"
                    }}
                  >
                    <span>{f.label}</span>
                    <span style={{ fontSize: 9, color: on ? "rgba(168,200,255,.5)" : "rgba(255,255,255,.2)" }}>{f.desc}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <button onClick={() => window.location.href = "/citizen"} style={{ ...DM, width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.15)", color: "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer" }}>← Back to Dashboard</button>
        </div>
      </aside>

      {/* RIGHT — Content */}
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ══ CHAT VIEW ══ */}
        {feature === "chat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600 }}>💬 Legal Chatbot</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 }}>Ask any legal question about Indian law</p>
              </div>
              <button onClick={newChat} style={{ ...DM, background: "rgba(255,255,255,.05)", border: "1px solid rgba(30,95,255,.2)", borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,.4)", fontSize: 11, cursor: "pointer" }}>+ New Chat</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ fontSize: 40, marginBottom: 16 }}>⚖️</p>
                  <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>LegalMind AI Assistant</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", lineHeight: 1.8, maxWidth: 400, margin: "0 auto" }}>
                    Ask me anything about Indian law — your rights, legal procedures, court processes, or any legal concept you need explained in simple language.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
                    {["What are my tenant rights?", "How to file an FIR?", "What is bail?", "Consumer complaint process"].map((q) => (
                      <button key={q} onClick={() => { setChatInput(q); }} style={{ ...DM, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(30,95,255,.2)", borderRadius: 20, padding: "8px 16px", color: "rgba(255,255,255,.5)", fontSize: 11, cursor: "pointer" }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
                  <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? BLUE : "rgba(0,0,0,0.6)", border: msg.role === "user" ? "none" : "1px solid rgba(30,95,255,.15)", boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}>
                    {msg.role === "assistant" && <p style={{ fontSize: 9, color: BLUEB, marginBottom: 6, fontWeight: 600 }}>⚖ LegalMind AI</p>}
                    <p style={{ fontSize: 13, color: msg.role === "user" ? "#fff" : "rgba(255,255,255,.7)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                  <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.15)" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleChat(); }} placeholder="Ask a legal question..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleChat} disabled={loading} style={{ ...DM, background: loading ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", padding: "10px 24px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Send</button>
              </div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,.15)", marginTop: 8, textAlign: "center" }}>LegalMind AI provides general legal information, not legal advice. Consult a qualified lawyer for specific matters.</p>
            </div>
          </div>
        )}

        {/* ══ VOICE CHAT VIEW ══ */}
        {feature === "voice" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 20, fontWeight: 700 }}>🎤 Voice Legal Chat</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Speak your legal questions and get instant answers</p>
              </div>

              {/* Mic Button */}
              <div style={{ textAlign: "center", margin: "40px 0" }}>
                <button
                  onClick={toggleRecording}
                  disabled={loading}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    border: "none",
                    background: isRecording ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    fontSize: 50,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
                    animation: isRecording ? "pulse 1.5s infinite" : "none"
                  }}
                >
                  🎤
                </button>
                <p style={{ fontSize: 14, color: BLUEB, marginTop: 16 }}>
                  {isRecording ? "🎤 Listening... Speak now!" : loading ? "⏳ Processing..." : "Click mic to start"}
                </p>
                <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
              </div>

              {/* Transcript */}
              {voiceTranscript && (
                <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "20px", border: "1px solid rgba(30,95,255,.15)", marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: BLUEB, marginBottom: 8, fontWeight: 600 }}>📝 You Said:</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", lineHeight: 1.8 }}>{voiceTranscript}</p>
                </div>
              )}

              {/* AI Response */}
              {voiceResponse && (
                <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "20px", border: "1px solid rgba(30,95,255,.15)" }}>
                  <p style={{ fontSize: 11, color: BLUEB, marginBottom: 8, fontWeight: 600 }}>🤖 AI Response:</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{voiceResponse}</p>
                  <button onClick={speakResponse} style={{ ...btnStyle, marginTop: 16, background: "#28a745" }}>🔊 Listen to Response</button>
                </div>
              )}

              {/* Instructions */}
              <div style={{ background: "rgba(255,243,205,.08)", border: "1px solid rgba(255,193,7,.2)", borderRadius: 10, padding: "16px", marginTop: 20 }}>
                <p style={{ fontSize: 11, color: "#ffc107", fontWeight: 600, marginBottom: 8 }}>📌 How to Use:</p>
                <ul style={{ fontSize: 11, color: "#ffc107", paddingLeft: 20, lineHeight: 2 }}>
                  <li>Click the microphone button</li>
                  <li>Ask your legal question in English</li>
                  <li>Click again to stop (or it stops automatically)</li>
                  <li>AI will respond — you can read or listen</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ══ CASE PREDICTION VIEW ══ */}
        {feature === "predict" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 20, fontWeight: 700 }}>🎯 Case Outcome Predictor</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Predict your case winning probability before filing</p>
              </div>

              <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px", border: "1px solid rgba(30,95,255,.15)", marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <p style={labelStyle}>Case Type *</p>
                    <input value={predCaseType} onChange={(e) => setPredCaseType(e.target.value)} placeholder="e.g. Cheque Bounce (Section 138), Consumer Complaint, Property Dispute..." style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Do you have evidence?</p>
                      <select value={predEvidence ? "yes" : "no"} onChange={(e) => setPredEvidence(e.target.value === "yes")} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {predEvidence && (
                      <div>
                        <p style={labelStyle}>Evidence Quality</p>
                        <select value={predEvidenceQuality} onChange={(e) => setPredEvidenceQuality(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                          <option value="weak">Weak</option>
                          <option value="moderate">Moderate</option>
                          <option value="strong">Strong</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Have witnesses?</p>
                      <select value={predWitnesses ? "yes" : "no"} onChange={(e) => setPredWitnesses(e.target.value === "yes")} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {predWitnesses && (
                      <>
                        <div>
                          <p style={labelStyle}>How many?</p>
                          <input type="number" value={predWitnessCount} onChange={(e) => setPredWitnessCount(e.target.value)} min="1" style={inputStyle} />
                        </div>
                        <div>
                          <p style={labelStyle}>Quality</p>
                          <select value={predWitnessQuality} onChange={(e) => setPredWitnessQuality(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="weak">Weak</option>
                            <option value="moderate">Moderate</option>
                            <option value="strong">Strong</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Legal precedents in your favor?</p>
                      <select value={predPrecedent ? "yes" : "no"} onChange={(e) => setPredPrecedent(e.target.value === "yes")} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="no">No / Don't know</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <p style={labelStyle}>Opposing party strength</p>
                      <select value={predOpponent} onChange={(e) => setPredOpponent(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="weak">Weak</option>
                        <option value="moderate">Moderate</option>
                        <option value="strong">Strong</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Lawyer experience (years)</p>
                      <input type="number" value={predLawyer} onChange={(e) => setPredLawyer(e.target.value)} min="0" max="50" style={inputStyle} />
                    </div>
                    <div>
                      <p style={labelStyle}>Jurisdiction (City/State)</p>
                      <input value={predJurisdiction} onChange={(e) => setPredJurisdiction(e.target.value)} placeholder="e.g. Hyderabad, Mumbai..." style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <p style={labelStyle}>Additional Information (optional)</p>
                    <textarea value={predInfo} onChange={(e) => setPredInfo(e.target.value)} placeholder="Describe your case situation..." rows={3} style={{ ...inputStyle, resize: "none" }} />
                  </div>

                  <button onClick={handlePredict} disabled={loading || !predCaseType} style={{ ...btnStyle, opacity: (loading || !predCaseType) ? 0.6 : 1 }}>
                    {loading ? "Analyzing..." : "🎯 Predict Case Outcome"}
                  </button>
                </div>
              </div>

              {/* Prediction Result */}
              {predResult && predResult.prediction && (
                <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px", border: "1px solid rgba(30,95,255,.15)" }}>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <p style={{ fontSize: 40 }}>
                      {predResult.prediction.verdict === "Highly Favorable" ? "🎯" : predResult.prediction.verdict === "Favorable" ? "✅" : predResult.prediction.verdict === "Neutral" ? "⚖️" : predResult.prediction.verdict === "Unfavorable" ? "⚠️" : "🚨"}
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: BLUEB, marginTop: 8 }}>
                      {predResult.prediction.winProbability}%
                    </p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                      {predResult.prediction.verdict}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 4 }}>
                      Confidence: {predResult.prediction.confidence}%
                    </p>
                  </div>

                  {predResult.prediction.strengths && predResult.prediction.strengths.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, marginBottom: 8 }}>💪 STRENGTHS:</p>
                      {predResult.prediction.strengths.map((s: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>✓ {s}</p>
                      ))}
                    </div>
                  )}

                  {predResult.prediction.weaknesses && predResult.prediction.weaknesses.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600, marginBottom: 8 }}>⚠️ WEAKNESSES:</p>
                      {predResult.prediction.weaknesses.map((w: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>• {w}</p>
                      ))}
                    </div>
                  )}

                  {predResult.prediction.recommendations && predResult.prediction.recommendations.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, color: BLUEB, fontWeight: 600, marginBottom: 8 }}>📋 RECOMMENDATIONS:</p>
                      {predResult.prediction.recommendations.map((r: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>{i + 1}. {r}</p>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>⏱️ TIMELINE</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{predResult.prediction.estimatedTimeline}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>💰 COST</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{predResult.prediction.estimatedCost}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, padding: "12px", background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", lineHeight: 1.8, textAlign: "center" }}>
                      ⚠️ This is a prediction based on provided information, not a guarantee. Always consult a qualified lawyer for legal advice.
                    </p>
                  </div>

                  <button onClick={() => setPredResult(null)} style={{ ...btnStyle, marginTop: 16, background: "rgba(255,255,255,.05)" }}>
                    Clear & Predict Another Case
                  </button>
                </div>
              )}

              {predResult && predResult.error && (
                <div style={{ background: "rgba(220,38,38,.1)", border: "1px solid rgba(220,38,38,.3)", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#ef4444" }}>{predResult.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ EXISTING FORM VIEWS (Notice, Deadline, etc.) ══ */}
        {feature !== "chat" && feature !== "voice" && feature !== "predict" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{FEATURES.find((f) => f.id === feature)?.label}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 4 }}>{FEATURES.find((f) => f.id === feature)?.desc}</p>
              </div>

              <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px", border: "1px solid rgba(30,95,255,.15)", boxShadow: SH_CARD, marginBottom: 20 }}>

                {/* NOTICE EXPLAINER */}
                {feature === "notice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Upload Notice (PDF or TXT)</p>
                      <input type="file" accept=".pdf,.txt" onChange={(e) => setNoticeFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: 8 }} />
                      {noticeFile && <p style={{ fontSize: 10, color: BLUEB, marginTop: 4 }}>📎 {noticeFile.name}</p>}
                    </div>
                    <div>
                      <p style={labelStyle}>Or Paste Notice Text</p>
                      <textarea value={noticeText} onChange={(e) => setNoticeText(e.target.value)} placeholder="Paste the legal notice text here..." rows={6} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <button onClick={handleNotice} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>{loading ? "Analyzing..." : "📄 Explain This Notice"}</button>
                  </div>
                )}

                {/* DEADLINE CALCULATOR */}
                {feature === "deadline" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Notice Type</p>
                      <select value={deadlineType} onChange={(e) => setDeadlineType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="">Select type...</option>
                        <option value="Eviction Notice">Eviction Notice</option>
                        <option value="Legal Notice under Section 138 NI Act">Cheque Bounce (Sec 138)</option>
                        <option value="Consumer Complaint Notice">Consumer Complaint</option>
                        <option value="Income Tax Notice">Income Tax Notice</option>
                        <option value="Show Cause Notice">Show Cause Notice</option>
                        <option value="Divorce Notice">Divorce Notice</option>
                        <option value="Property Dispute Notice">Property Dispute</option>
                        <option value="Labour Court Notice">Labour Court Notice</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <p style={labelStyle}>Date Received</p>
                      <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <p style={labelStyle}>Notice Content (optional — for more accurate results)</p>
                      <textarea value={deadlineNotice} onChange={(e) => setDeadlineNotice(e.target.value)} placeholder="Paste the notice text for more accurate deadline calculation..." rows={4} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <button onClick={handleDeadline} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>{loading ? "Calculating..." : "⏰ Calculate Deadline"}</button>
                  </div>
                )}

                {/* TERM DECODER */}
                {feature === "term" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Legal Term</p>
                      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. affidavit, adjournment, bail, habeas corpus..." style={inputStyle} />
                    </div>
                    <div>
                      <p style={labelStyle}>Context (optional)</p>
                      <textarea value={termContext} onChange={(e) => setTermContext(e.target.value)} placeholder="Where did you encounter this term? Paste the sentence or describe the situation..." rows={3} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)", width: "100%", marginBottom: 2 }}>Quick terms:</p>
                      {["Affidavit", "Adjournment", "Bail", "Cognizable", "FIR", "Habeas Corpus", "Injunction", "Plea Bargain", "Summons", "Writ"].map((t) => (
                        <button key={t} onClick={() => setTerm(t)} style={{ ...DM, background: "rgba(30,95,255,.1)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 20, padding: "4px 12px", color: BLUEB, fontSize: 10, cursor: "pointer" }}>{t}</button>
                      ))}
                    </div>
                    <button onClick={handleTerm} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>{loading ? "Decoding..." : "📖 Decode Term"}</button>
                  </div>
                )}

                {/* FILING GUIDE */}
                {feature === "filing" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Case Type</p>
                      <select value={filingType} onChange={(e) => setFilingType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="">Select case type...</option>
                        <option value="Property Dispute">Property Dispute</option>
                        <option value="Consumer Complaint">Consumer Complaint</option>
                        <option value="Divorce">Divorce</option>
                        <option value="Criminal Complaint (FIR)">Criminal Complaint (FIR)</option>
                        <option value="Civil Suit">Civil Suit</option>
                        <option value="Labour Dispute">Labour Dispute</option>
                        <option value="Cheque Bounce">Cheque Bounce</option>
                        <option value="RTI Application">RTI Application</option>
                        <option value="Domestic Violence">Domestic Violence</option>
                        <option value="Motor Accident Claim">Motor Accident Claim</option>
                      </select>
                    </div>
                    <div>
                      <p style={labelStyle}>State</p>
                      <input value={filingState} onChange={(e) => setFilingState(e.target.value)} placeholder="e.g. Karnataka, Maharashtra..." style={inputStyle} />
                    </div>
                    <div>
                      <p style={labelStyle}>Describe Your Situation (optional)</p>
                      <textarea value={filingDesc} onChange={(e) => setFilingDesc(e.target.value)} placeholder="Briefly describe what happened..." rows={3} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <button onClick={handleFiling} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>{loading ? "Generating guide..." : "📝 Get Filing Guide"}</button>
                  </div>
                )}

                {/* DOCUMENT CHECKLIST */}
                {feature === "checklist" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Case Type</p>
                      <select value={checklistType} onChange={(e) => setChecklistType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="">Select case type...</option>
                        <option value="Property Dispute">Property Dispute</option>
                        <option value="Consumer Complaint">Consumer Complaint</option>
                        <option value="Divorce (Mutual Consent)">Divorce (Mutual Consent)</option>
                        <option value="Divorce (Contested)">Divorce (Contested)</option>
                        <option value="Criminal Case">Criminal Case</option>
                        <option value="Civil Suit">Civil Suit</option>
                        <option value="Labour Case">Labour Case</option>
                        <option value="Cheque Bounce (Section 138)">Cheque Bounce</option>
                        <option value="RTI Application">RTI Application</option>
                        <option value="Bail Application">Bail Application</option>
                      </select>
                    </div>
                    <div>
                      <p style={labelStyle}>State</p>
                      <input value={checklistState} onChange={(e) => setChecklistState(e.target.value)} placeholder="e.g. Delhi, Tamil Nadu..." style={inputStyle} />
                    </div>
                    <button onClick={handleChecklist} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>{loading ? "Generating..." : "✅ Generate Checklist"}</button>
                  </div>
                )}

                {/* ══ COURT FEE CALCULATOR VIEW ══ */}
                {feature === "courtfee" && (
                  <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
                    <div style={{ maxWidth: 700, margin: "0 auto" }}>
                      <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 20, fontWeight: 700 }}>💰 Court Fee Calculator</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Calculate filing costs before going to court</p>
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px", border: "1px solid rgba(30,95,255,.15)", marginBottom: 20 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          
                          <div>
                            <p style={labelStyle}>State</p>
                            <select value={feeState} onChange={(e) => setFeeState(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                              <option value="Telangana">Telangana</option>
                              <option value="Andhra Pradesh">Andhra Pradesh</option>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Maharashtra">Maharashtra</option>
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Delhi">Delhi</option>
                              <option value="Other">Other State</option>
                            </select>
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 4 }}>* Fees calculated based on Telangana Court Fees Act. Other states may vary slightly.</p>
                          </div>

                          <div>
                            <p style={labelStyle}>Case Type *</p>
                            <select value={feeCaseType} onChange={(e) => setFeeCaseType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                              <option value="">Select case type...</option>
                              <option value="Civil Suit (Money Recovery)">Civil Suit (Money Recovery)</option>
                              <option value="Property Dispute">Property Dispute</option>
                              <option value="Consumer Complaint">Consumer Complaint</option>
                              <option value="Cheque Bounce (Section 138)">Cheque Bounce (Section 138)</option>
                              <option value="Divorce (Mutual Consent)">Divorce (Mutual Consent)</option>
                              <option value="Divorce (Contested)">Divorce (Contested)</option>
                              <option value="Bail Application">Bail Application</option>
                              <option value="Criminal Complaint">Criminal Complaint</option>
                              <option value="Labour/Employment Dispute">Labour/Employment Dispute</option>
                              <option value="RTI Appeal">RTI Appeal</option>
                              <option value="Writ Petition (High Court)">Writ Petition (High Court)</option>
                            </select>
                          </div>

                          <div>
                            <p style={labelStyle}>Claim/Suit Amount (₹)</p>
                            <input 
                              type="number" 
                              value={feeClaimAmount} 
                              onChange={(e) => setFeeClaimAmount(e.target.value)} 
                              placeholder="e.g. 500000" 
                              style={inputStyle} 
                            />
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Enter 0 for criminal/bail matters</p>
                          </div>

                          <button onClick={calculateCourtFee} style={{ ...btnStyle }}>
                            💰 Calculate Total Cost
                          </button>
                        </div>
                      </div>

                      {/* Results */}
                      {feeResult && (
                        <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px", border: "1px solid rgba(30,95,255,.15)" }}>
                          
                          {/* Header */}
                          <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>{feeResult.caseType}</p>
                            {feeResult.claimAmount > 0 && (
                              <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Claim Amount: ₹{feeResult.claimAmount.toLocaleString("en-IN")}</p>
                            )}
                          </div>

                          {/* Fee Breakdown */}
                          <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 12, color: BLUEB, fontWeight: 600, marginBottom: 12 }}>📋 FEE BREAKDOWN:</p>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Court Fee</span>
                                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>₹{feeResult.courtFee.toLocaleString("en-IN")}</span>
                              </div>
                              
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Stamp Duty</span>
                                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>₹{feeResult.stampDuty.toLocaleString("en-IN")}</span>
                              </div>
                              
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Process Fee</span>
                                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>₹{feeResult.processFee.toLocaleString("en-IN")}</span>
                              </div>
                              
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>Miscellaneous</span>
                                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>₹{feeResult.miscFee.toLocaleString("en-IN")}</span>
                              </div>
                              
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(30,95,255,.1)", borderRadius: 8, border: "1px solid rgba(30,95,255,.2)" }}>
                                <span style={{ fontSize: 13, color: BLUEB }}>Advocate Fee (Estimated)</span>
                                <span style={{ fontSize: 13, color: BLUEB, fontWeight: 600 }}>₹{feeResult.advocateFeeMin.toLocaleString("en-IN")} - ₹{feeResult.advocateFeeMax.toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          </div>

                          {/* Total */}
                          <div style={{ background: "linear-gradient(135deg, rgba(30,95,255,.15), rgba(30,95,255,.05))", border: "1px solid rgba(30,95,255,.3)", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "center" }}>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Estimated Total Cost</p>
                            <p style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>
                              ₹{feeResult.totalMin.toLocaleString("en-IN")} - ₹{feeResult.totalMax.toLocaleString("en-IN")}
                            </p>
                          </div>

                          {/* Timeline */}
                          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                            <div style={{ flex: 1, background: "rgba(255,255,255,.02)", padding: 16, borderRadius: 10, textAlign: "center" }}>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>⏱️ EXPECTED TIMELINE</p>
                              <p style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{feeResult.timeline}</p>
                            </div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,.02)", padding: 16, borderRadius: 10, textAlign: "center" }}>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 4 }}>📍 JURISDICTION</p>
                              <p style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{feeResult.state}</p>
                            </div>
                          </div>

                          {/* Notes */}
                          {feeResult.notes && feeResult.notes.length > 0 && (
                            <div style={{ background: "rgba(255,193,7,.05)", border: "1px solid rgba(255,193,7,.2)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                              <p style={{ fontSize: 11, color: "#ffc107", fontWeight: 600, marginBottom: 8 }}>📌 IMPORTANT NOTES:</p>
                              {feeResult.notes.map((note: string, i: number) => (
                                <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginBottom: 4, paddingLeft: 12 }}>• {note}</p>
                              ))}
                            </div>
                          )}

                          {/* Disclaimer */}
                          <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", lineHeight: 1.8 }}>
                              ⚠️ These are estimates based on Telangana Court Fees Act. Actual fees may vary. Consult a lawyer for exact costs.
                              <br />
                              💡 Can't afford these fees? Check "Legal Aid Eligibility" for free legal services.
                            </p>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                            <button onClick={() => setFeeResult(null)} style={{ ...btnStyle, flex: 1, background: "rgba(255,255,255,.05)" }}>
                              Calculate Another
                            </button>
                            <button onClick={() => switchFeature("legalaid")} style={{ ...btnStyle, flex: 1, background: "#16a34a" }}>
                              Check Legal Aid Eligibility
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Info Card */}
                      {!feeResult && (
                        <div style={{ background: "rgba(30,95,255,.05)", border: "1px solid rgba(30,95,255,.15)", borderRadius: 12, padding: 20 }}>
                          <p style={{ fontSize: 12, color: BLUEB, fontWeight: 600, marginBottom: 12 }}>💡 Why calculate court fees?</p>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 2 }}>
                            <p>• Know the total cost <b>before</b> meeting a lawyer</p>
                            <p>• Compare costs across different case types</p>
                            <p>• Decide if filing a case is worth the expense</p>
                            <p>• Check if you qualify for free legal aid</p>
                            <p>• Plan your budget for legal proceedings</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LEGAL AID */}
                {feature === "legalaid" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={labelStyle}>Annual Income (₹)</p>
                      <input value={aidIncome} onChange={(e) => setAidIncome(e.target.value)} placeholder="e.g. 150000" type="number" style={inputStyle} />
                    </div>
                    <div>
                      <p style={labelStyle}>Category</p>
                      <select value={aidCategory} onChange={(e) => setAidCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        <option value="">Select category...</option>
                        <option value="SC (Scheduled Caste)">SC (Scheduled Caste)</option>
                        <option value="ST (Scheduled Tribe)">ST (Scheduled Tribe)</option>
                        <option value="Woman">Woman</option>
                        <option value="Child (under 18)">Child (under 18)</option>
                        <option value="Person with Disability">Person with Disability</option>
                        <option value="Industrial Worker">Industrial Worker</option>
                        <option value="Victim of Trafficking">Victim of Trafficking</option>
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <p style={labelStyle}>Case Type</p>
                      <input value={aidCaseType} onChange={(e) => setAidCaseType(e.target.value)} placeholder="e.g. Property Dispute, Criminal Case..." style={inputStyle} />
                    </div>
                    <div>
                      <p style={labelStyle}>State</p>
                      <input value={aidState} onChange={(e) => setAidState(e.target.value)} placeholder="e.g. Uttar Pradesh, Gujarat..." style={inputStyle} />
                    </div>
                    <button onClick={handleLegalAid} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>{loading ? "Checking..." : "🏛️ Check Eligibility"}</button>
                  </div>
                )}

                {/* SCAM DETECTOR */}
                {feature === "scam" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.2)", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 12, color: "#ff8a8a", lineHeight: 1.7 }}>🚨 Received a suspicious legal notice? Upload or paste it here and our AI will analyze it for red flags and signs of fraud.</p>
                    </div>
                    <div>
                      <p style={labelStyle}>Upload Notice (PDF or TXT)</p>
                      <input type="file" accept=".pdf,.txt" onChange={(e) => setScamFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: 8 }} />
                      {scamFile && <p style={{ fontSize: 10, color: BLUEB, marginTop: 4 }}>📎 {scamFile.name}</p>}
                    </div>
                    <div>
                      <p style={labelStyle}>Or Paste Notice Text</p>
                      <textarea value={scamText} onChange={(e) => setScamText(e.target.value)} placeholder="Paste the suspicious notice text here..." rows={6} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <button onClick={handleScam} disabled={loading} style={{ ...btnStyle, background: loading ? "rgba(255,107,107,.4)" : "#dc2626", opacity: loading ? 0.6 : 1 }}>{loading ? "Analyzing..." : "🚨 Detect Scam / Verify Notice"}</button>
                  </div>
                )}
              </div>

              {/* RESULT */}
              {result && (
                <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px", border: "1px solid rgba(30,95,255,.15)", boxShadow: SH_CARD }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: BLUEB }}>⚖ AI Analysis</p>
                    <button onClick={() => setResult("")} style={{ ...DM, background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: 11 }}>Clear ✕</button>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 2, whiteSpace: "pre-wrap" }}>{result}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,.15)", marginTop: 16, textAlign: "center" }}>This is general legal information, not legal advice. Consult a qualified lawyer for specific matters.</p>
                </div>
              )}

              {/* Loading */}
              {loading && !result && feature !== "chat" && (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: "3px solid rgba(30,95,255,.3)",
                      borderTop: "3px solid #1e5fff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 14px",
                    }}
                  />
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
                    AI is analyzing...
                  </p>
                  {(feature === "notice" || feature === "scam") &&
                    (noticeFile || scamFile) && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,.2)",
                          marginTop: 8,
                          lineHeight: 1.8,
                        }}
                      >
                        📄 Processing uploaded document...
                        <br />
                        Scanned PDFs may take 30-60 seconds for OCR.
                      </p>
                    )}
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}