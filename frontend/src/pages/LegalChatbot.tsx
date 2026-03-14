// frontend/src/pages/LegalChatbot.tsx

import { useState, useRef, useEffect, type CSSProperties } from "react";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";
const API = "http://localhost:8000/api/ai";

const FEATURES = [
  { id: "chat", label: "💬 Legal Chatbot", desc: "Ask any legal question" },
  { id: "notice", label: "📄 Notice Explainer", desc: "Upload or paste a notice" },
  { id: "deadline", label: "⏰ Deadline Calculator", desc: "Calculate response deadlines" },
  { id: "term", label: "📖 Term Decoder", desc: "Understand legal terms" },
  { id: "filing", label: "📝 Filing Guide", desc: "Step-by-step filing help" },
  { id: "checklist", label: "✅ Doc Checklist", desc: "Get required documents list" },
  { id: "legalaid", label: "🏛️ Legal Aid Check", desc: "Check free legal aid eligibility" },
  { id: "scam", label: "🚨 Scam Detector", desc: "Verify if a notice is fake" },
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
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,.4)", padding: "8px 10px 6px" }}>Features</p>
          {FEATURES.map((f) => {
            const on = f.id === feature;
            return (
              <button key={f.id} className="feat-btn" onClick={() => switchFeature(f.id)} style={{ ...DM, width: "100%", display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", borderRadius: 11, border: on ? "1px solid rgba(30,95,255,.5)" : "1px solid rgba(30,95,255,.15)", background: on ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.45)", color: on ? "#fff" : "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 5, textAlign: "left", transition: "all .2s ease", boxShadow: on ? "3px 4px 14px rgba(0,0,0,.6)" : "none" }}>
                <span>{f.label}</span>
                <span style={{ fontSize: 9, color: on ? "rgba(168,200,255,.5)" : "rgba(255,255,255,.2)" }}>{f.desc}</span>
              </button>
            );
          })}
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
            {/* Header */}
            <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600 }}>💬 Legal Chatbot</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 2 }}>Ask any legal question about Indian law</p>
              </div>
              <button onClick={newChat} style={{ ...DM, background: "rgba(255,255,255,.05)", border: "1px solid rgba(30,95,255,.2)", borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,.4)", fontSize: 11, cursor: "pointer" }}>+ New Chat</button>
            </div>

            {/* Messages */}
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

            {/* Input */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleChat(); }} placeholder="Ask a legal question..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleChat} disabled={loading} style={{ ...DM, background: loading ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", padding: "10px 24px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Send</button>
              </div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,.15)", marginTop: 8, textAlign: "center" }}>LegalMind AI provides general legal information, not legal advice. Consult a qualified lawyer for specific matters.</p>
            </div>
          </div>
        )}

        {/* ══ FORM VIEWS ══ */}
        {feature !== "chat" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>

              {/* Feature Header */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{FEATURES.find((f) => f.id === feature)?.label}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 4 }}>{FEATURES.find((f) => f.id === feature)?.desc}</p>
              </div>

              {/* Form Card */}
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