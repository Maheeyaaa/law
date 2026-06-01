// frontend/src/pages/LegalChatbot.tsx
import {
  useState, useRef, useEffect, useCallback, type CSSProperties,
} from "react";

// ── Design tokens ────────────────────────────────────────────
const DM: CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const API_BASE = "http://localhost:8000/api";

// ── Types ────────────────────────────────────────────────────
interface Conversation {
  _id: string;
  title: string;
  type: string;
  lastMessage: string;
  messageCount: number;
  isPinned: boolean;
  lastActivityAt: string;
}

type MessageRole = "user" | "assistant" | "tool-form" | "tool-result";

interface ChatMsg {
  id: string;
  role: MessageRole;
  text?: string;
  toolId?: string;
}

// ── Tools config ─────────────────────────────────────────────
const TOOLS = [
  { id: "notice",   icon: "📄", label: "Notice Explainer",  desc: "Understand any legal notice" },
  { id: "scam",     icon: "🚨", label: "Scam Detector",      desc: "Verify if a notice is fake" },
  { id: "deadline", icon: "⏰", label: "Deadline Calculator",desc: "Calculate response deadlines" },
  { id: "term",     icon: "📖", label: "Term Decoder",       desc: "Decode legal jargon" },
  { id: "filing",   icon: "📝", label: "Filing Guide",       desc: "Step-by-step filing help" },
  { id: "checklist",icon: "✅", label: "Doc Checklist",      desc: "Get required documents list" },
  { id: "legalaid", icon: "🏛️", label: "Legal Aid Check",   desc: "Check free aid eligibility" },
];

const SUGGESTED = [
  "What are my tenant rights in India?",
  "How do I file a consumer complaint?",
  "What is the bail process?",
  "How to respond to a legal notice?",
];

// ── API helpers ───────────────────────────────────────────────
const getToken = () => localStorage.getItem("token") || "";

const authHeaders = (isForm = false) => {
  const h: Record<string, string> = { Authorization: `Bearer ${getToken()}` };
  if (!isForm) h["Content-Type"] = "application/json";
  return h;
};

const apiGet = (path: string) =>
  fetch(`${API_BASE}${path}`, { headers: authHeaders() }).then((r) => r.json());

const apiPost = (path: string, body: any, isForm = false) =>
  fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(isForm),
    body: isForm ? body : JSON.stringify(body),
  }).then((r) => r.json());

const apiPatch = (path: string, body: any) =>
  fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((r) => r.json());

const apiDelete = (path: string) =>
  fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then((r) => r.json());

// ── Tiny helpers ──────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2);

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ── Spinner ───────────────────────────────────────────────────
function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid rgba(30,95,255,.2)`,
      borderTop: `2px solid ${BLUE}`,
      animation: "spin 0.9s linear infinite",
      flexShrink: 0,
    }} />
  );
}

// ── Tool Forms ────────────────────────────────────────────────
function ToolForm({
  toolId,
  onSubmit,
  onCancel,
}: {
  toolId: string;
  onSubmit: (result: string) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Notice
  const [noticeText, setNoticeText] = useState("");
  const [noticeFile, setNoticeFile] = useState<File | null>(null);

  // Scam
  const [scamText, setScamText] = useState("");
  const [scamFile, setScamFile] = useState<File | null>(null);

  // Deadline
  const [dlType, setDlType] = useState("");
  const [dlDate, setDlDate] = useState("");
  const [dlNotice, setDlNotice] = useState("");

  // Term
  const [term, setTerm] = useState("");
  const [termCtx, setTermCtx] = useState("");

  // Filing
  const [filType, setFilType] = useState("");
  const [filState, setFilState] = useState("");
  const [filDesc, setFilDesc] = useState("");

  // Checklist
  const [clType, setClType] = useState("");
  const [clState, setClState] = useState("");

  // Legal Aid
  const [aidIncome, setAidIncome] = useState("");
  const [aidCat, setAidCat] = useState("");
  const [aidCase, setAidCase] = useState("");
  const [aidState, setAidState] = useState("");

  const tool = TOOLS.find((t) => t.id === toolId)!;

  const inp: CSSProperties = {
    ...DM, width: "100%", background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(30,95,255,.2)", borderRadius: 8,
    padding: "9px 12px", color: "#fff", fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };
  const lbl: CSSProperties = {
    ...DM, fontSize: 10, letterSpacing: "1.2px",
    textTransform: "uppercase", color: "rgba(255,255,255,.35)",
    marginBottom: 5, display: "block",
  };

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      let data: any;

      if (toolId === "notice") {
        if (!noticeText.trim() && !noticeFile) { setErr("Please paste text or upload a file."); setLoading(false); return; }
        if (noticeFile) {
          const fd = new FormData();
          fd.append("noticeFile", noticeFile);
          if (noticeText.trim()) fd.append("notice", noticeText.trim());
          data = await apiPost("/ai/explain-notice", fd, true);
        } else {
          data = await apiPost("/ai/explain-notice", { notice: noticeText });
        }
      } else if (toolId === "scam") {
        if (!scamText.trim() && !scamFile) { setErr("Please paste text or upload a file."); setLoading(false); return; }
        if (scamFile) {
          const fd = new FormData();
          fd.append("noticeFile", scamFile);
          if (scamText.trim()) fd.append("notice", scamText.trim());
          data = await apiPost("/ai/detect-scam", fd, true);
        } else {
          data = await apiPost("/ai/detect-scam", { notice: scamText });
        }
      } else if (toolId === "deadline") {
        if (!dlType && !dlNotice.trim()) { setErr("Please select notice type or paste notice text."); setLoading(false); return; }
        data = await apiPost("/ai/deadline", { noticeType: dlType, receivedDate: dlDate, noticeText: dlNotice });
      } else if (toolId === "term") {
        if (!term.trim()) { setErr("Please enter a legal term."); setLoading(false); return; }
        data = await apiPost("/ai/decode-term", { term, context: termCtx });
      } else if (toolId === "filing") {
        if (!filType) { setErr("Please select a case type."); setLoading(false); return; }
        data = await apiPost("/ai/filing-guide", { caseType: filType, state: filState, description: filDesc });
      } else if (toolId === "checklist") {
        if (!clType) { setErr("Please select a case type."); setLoading(false); return; }
        data = await apiPost("/ai/checklist", { caseType: clType, state: clState });
      } else if (toolId === "legalaid") {
        if (!aidIncome && !aidCat && !aidCase) { setErr("Please fill at least one field."); setLoading(false); return; }
        data = await apiPost("/ai/legal-aid", { annualIncome: aidIncome, category: aidCat, caseType: aidCase, state: aidState });
      }

      const reply = data?.reply || data?.message || data?.error || "No response received.";
      onSubmit(reply);
    } catch {
      setErr("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "rgba(10,20,55,.85)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(30,95,255,.25)", borderRadius: 16,
      padding: "20px 22px", maxWidth: 560,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{tool.icon}</span>
          <div>
            <p style={{ ...DM, fontSize: 14, fontWeight: 600, color: "#fff" }}>{tool.label}</p>
            <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 1 }}>{tool.desc}</p>
          </div>
        </div>
        <button onClick={onCancel} style={{
          background: "none", border: "none",
          color: "rgba(255,255,255,.3)", fontSize: 18,
          cursor: "pointer", lineHeight: 1, padding: "2px 6px",
          borderRadius: 6, transition: "color .2s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.3)")}
        >
          ×
        </button>
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* NOTICE */}
        {toolId === "notice" && <>
          <div>
            <label style={lbl}>Upload Notice (PDF / TXT)</label>
            <input type="file" accept=".pdf,.txt"
              onChange={(e) => setNoticeFile(e.target.files?.[0] || null)}
              style={{ ...inp, padding: 8, cursor: "pointer" }} />
            {noticeFile && <p style={{ ...DM, fontSize: 10, color: BLUEB, marginTop: 4 }}>📎 {noticeFile.name}</p>}
          </div>
          <div>
            <label style={lbl}>Or paste notice text</label>
            <textarea value={noticeText} onChange={(e) => setNoticeText(e.target.value)}
              placeholder="Paste notice content here..." rows={4}
              style={{ ...inp, resize: "none" }} />
          </div>
        </>}

        {/* SCAM */}
        {toolId === "scam" && <>
          <div style={{ background: "rgba(255,80,80,.07)", border: "1px solid rgba(255,80,80,.18)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ ...DM, fontSize: 12, color: "#ff9999", lineHeight: 1.7 }}>🚨 Upload or paste the suspicious notice to check for fraud indicators.</p>
          </div>
          <div>
            <label style={lbl}>Upload Notice (PDF / TXT)</label>
            <input type="file" accept=".pdf,.txt"
              onChange={(e) => setScamFile(e.target.files?.[0] || null)}
              style={{ ...inp, padding: 8, cursor: "pointer" }} />
            {scamFile && <p style={{ ...DM, fontSize: 10, color: BLUEB, marginTop: 4 }}>📎 {scamFile.name}</p>}
          </div>
          <div>
            <label style={lbl}>Or paste notice text</label>
            <textarea value={scamText} onChange={(e) => setScamText(e.target.value)}
              placeholder="Paste suspicious notice text..." rows={4}
              style={{ ...inp, resize: "none" }} />
          </div>
        </>}

        {/* DEADLINE */}
        {toolId === "deadline" && <>
          <div>
            <label style={lbl}>Notice Type</label>
            <select value={dlType} onChange={(e) => setDlType(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">Select type...</option>
              <option>Eviction Notice</option>
              <option>Cheque Bounce (Sec 138)</option>
              <option>Consumer Complaint</option>
              <option>Income Tax Notice</option>
              <option>Show Cause Notice</option>
              <option>Divorce Notice</option>
              <option>Property Dispute Notice</option>
              <option>Labour Court Notice</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Date Received</label>
            <input type="date" value={dlDate} onChange={(e) => setDlDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Notice Text (optional — for accuracy)</label>
            <textarea value={dlNotice} onChange={(e) => setDlNotice(e.target.value)}
              placeholder="Paste notice content for more accurate results..." rows={3}
              style={{ ...inp, resize: "none" }} />
          </div>
        </>}

        {/* TERM */}
        {toolId === "term" && <>
          <div>
            <label style={lbl}>Legal Term</label>
            <input value={term} onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Affidavit, Bail, Habeas Corpus..." style={inp} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Affidavit", "Bail", "FIR", "Injunction", "Habeas Corpus", "Summons", "Writ"].map((t) => (
              <button key={t} onClick={() => setTerm(t)} style={{
                ...DM, background: "rgba(30,95,255,.1)",
                border: "1px solid rgba(30,95,255,.25)",
                borderRadius: 20, padding: "4px 12px",
                color: BLUEB, fontSize: 11, cursor: "pointer",
              }}>{t}</button>
            ))}
          </div>
          <div>
            <label style={lbl}>Context (optional)</label>
            <textarea value={termCtx} onChange={(e) => setTermCtx(e.target.value)}
              placeholder="Where did you see this term?" rows={2}
              style={{ ...inp, resize: "none" }} />
          </div>
        </>}

        {/* FILING */}
        {toolId === "filing" && <>
          <div>
            <label style={lbl}>Case Type</label>
            <select value={filType} onChange={(e) => setFilType(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">Select...</option>
              <option>Property Dispute</option>
              <option>Consumer Complaint</option>
              <option>Divorce</option>
              <option>Criminal Complaint (FIR)</option>
              <option>Civil Suit</option>
              <option>Labour Dispute</option>
              <option>Cheque Bounce</option>
              <option>RTI Application</option>
              <option>Domestic Violence</option>
              <option>Motor Accident Claim</option>
            </select>
          </div>
          <div>
            <label style={lbl}>State</label>
            <input value={filState} onChange={(e) => setFilState(e.target.value)}
              placeholder="e.g. Telangana, Maharashtra..." style={inp} />
          </div>
          <div>
            <label style={lbl}>Brief description (optional)</label>
            <textarea value={filDesc} onChange={(e) => setFilDesc(e.target.value)}
              placeholder="Briefly describe your situation..." rows={2}
              style={{ ...inp, resize: "none" }} />
          </div>
        </>}

        {/* CHECKLIST */}
        {toolId === "checklist" && <>
          <div>
            <label style={lbl}>Case Type</label>
            <select value={clType} onChange={(e) => setClType(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">Select...</option>
              <option>Property Dispute</option>
              <option>Consumer Complaint</option>
              <option>Divorce (Mutual Consent)</option>
              <option>Divorce (Contested)</option>
              <option>Criminal Case</option>
              <option>Civil Suit</option>
              <option>Labour Case</option>
              <option>Cheque Bounce (Section 138)</option>
              <option>RTI Application</option>
              <option>Bail Application</option>
            </select>
          </div>
          <div>
            <label style={lbl}>State</label>
            <input value={clState} onChange={(e) => setClState(e.target.value)}
              placeholder="e.g. Delhi, Tamil Nadu..." style={inp} />
          </div>
        </>}

        {/* LEGAL AID */}
        {toolId === "legalaid" && <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Annual Income (₹)</label>
              <input type="number" value={aidIncome} onChange={(e) => setAidIncome(e.target.value)}
                placeholder="e.g. 150000" style={inp} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select value={aidCat} onChange={(e) => setAidCat(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                <option value="">Select...</option>
                <option>SC (Scheduled Caste)</option>
                <option>ST (Scheduled Tribe)</option>
                <option>Woman</option>
                <option>Child (under 18)</option>
                <option>Person with Disability</option>
                <option>Senior Citizen</option>
                <option>General</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Case Type</label>
              <input value={aidCase} onChange={(e) => setAidCase(e.target.value)}
                placeholder="e.g. Property Dispute" style={inp} />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input value={aidState} onChange={(e) => setAidState(e.target.value)}
                placeholder="e.g. Telangana" style={inp} />
            </div>
          </div>
        </>}
      </div>

      {/* Error */}
      {err && (
        <p style={{ ...DM, fontSize: 12, color: "#ff8080", marginTop: 10, padding: "8px 12px", background: "rgba(255,80,80,.08)", borderRadius: 8 }}>
          {err}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onCancel} style={{
          ...DM, flex: 1, padding: "10px", borderRadius: 10,
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.1)",
          color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer",
        }}>
          Cancel
        </button>
        <button onClick={submit} disabled={loading} style={{
          ...DM, flex: 2, padding: "10px", borderRadius: 10,
          background: loading ? "rgba(30,95,255,.4)" : BLUE,
          border: "none", color: "#fff", fontSize: 13,
          fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {loading ? <><Spinner size={16} /> Analyzing...</> : `${tool.icon} Run ${tool.label}`}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function LegalChatbot() {
  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Messages
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  // Input
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Tools
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // ── Scroll to bottom ───────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ── Background ─────────────────────────────────────────────
  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-marble.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    return () => { document.body.style.backgroundImage = ""; };
  }, []);

  // ── Close tools menu on outside click ──────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Voice setup ────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-IN";
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => prev ? prev + " " + t : t);
      setIsRecording(false);
    };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
  }, []);

  // ── Load conversations ─────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setConvsLoading(true);
    try {
      const data = await apiGet("/ai/conversations?limit=40");
      if (data.conversations) setConversations(data.conversations);
    } catch {
      console.error("Failed to load conversations");
    } finally {
      setConvsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Select conversation ────────────────────────────────────
  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConvId(conv._id);
    setActiveToolId(null);
    setMsgsLoading(true);
    setMessages([]);
    try {
      const data = await apiGet(`/ai/conversations/${conv._id}`);
      if (data.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            id: uid(),
            role: m.role as MessageRole,
            text: m.message,
          }))
        );
        setSessionId(`conv_${conv._id}`);
      }
    } catch {
      console.error("Failed to load messages");
    } finally {
      setMsgsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  // ── New chat ───────────────────────────────────────────────
  const newChat = useCallback(async () => {
    setMessages([]);
    setActiveToolId(null);
    setInput("");
    try {
      const data = await apiPost("/ai/conversations", { title: "New Conversation", type: "chatbot" });
      if (data.conversation) {
        setConversations((p) => [data.conversation, ...p]);
        setActiveConvId(data.conversation._id);
        setSessionId(data.sessionId || `conv_${data.conversation._id}`);
      } else {
        setActiveConvId(null);
        setSessionId(`sess_${Date.now()}`);
      }
    } catch {
      setActiveConvId(null);
      setSessionId(`sess_${Date.now()}`);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Send chat message ──────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    const userText = text.trim();
    setInput("");
    setActiveToolId(null);

    setMessages((p) => [...p, { id: uid(), role: "user", text: userText }]);
    setSending(true);

    try {
      const data = await apiPost("/ai/chatbot", {
        message: userText,
        sessionId: sessionId || undefined,
        conversationId: activeConvId || undefined,
      });

      if (data.sessionId) setSessionId(data.sessionId);

      if (data.conversationId) {
        if (!activeConvId) {
          setActiveConvId(data.conversationId);
          loadConversations();
        } else {
          setConversations((p) =>
            p.map((c) =>
              c._id === data.conversationId
                ? {
                    ...c,
                    // Update title if it was "New Conversation"
                    title: c.title === "New Conversation"
                      ? (data.conversationTitle || userText.substring(0, 60) + (userText.length > 60 ? "..." : ""))
                      : c.title,
                    lastMessage: (data.reply || "").substring(0, 100),
                    lastActivityAt: new Date().toISOString(),
                    messageCount: c.messageCount + 2,
                  }
                : c
            )
          );
        }
      }

      setMessages((p) => [
        ...p,
        { id: uid(), role: "assistant", text: data.reply || "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { id: uid(), role: "assistant", text: "Connection error. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }, [sending, sessionId, activeConvId, loadConversations]);

  // ── Tool result ────────────────────────────────────────────
  const handleToolResult = useCallback((result: string) => {
    setActiveToolId(null);
    setMessages((p) => [
      ...p,
      { id: uid(), role: "assistant", text: result },
    ]);
  }, []);

  // ── Delete conversation ────────────────────────────────────
  const deleteConv = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const conv = conversations.find((c) => c._id === id);
    const title = conv?.title || "this conversation";

    if (!window.confirm(`Delete "${title}"?\n\nThis will permanently remove all messages in this conversation.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await apiDelete(`/ai/conversations/${id}`);
      setConversations((p) => p.filter((c) => c._id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
        setSessionId("");
      }
    } finally {
      setDeletingId(null);
    }
  }, [activeConvId, conversations]);
  
  // ── Pin conversation ───────────────────────────────────────
  const pinConv = useCallback(async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiPatch(`/ai/conversations/${conv._id}`, { isPinned: !conv.isPinned });
    setConversations((p) =>
      p.map((c) => c._id === conv._id ? { ...c, isPinned: !c.isPinned } : c)
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        })
    );
  }, []);

  // ── Rename ─────────────────────────────────────────────────
  const submitRename = useCallback(async (id: string) => {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    await apiPatch(`/ai/conversations/${id}`, { title: renameVal.trim() });
    setConversations((p) => p.map((c) => c._id === id ? { ...c, title: renameVal.trim() } : c));
    setRenamingId(null);
  }, [renameVal]);

  // ── Delete all ─────────────────────────────────────────────
  const deleteAll = useCallback(async () => {
    if (!window.confirm("Delete all conversations? This cannot be undone.")) return;
    await apiDelete("/ai/conversations/all");
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);
    setSessionId("");
  }, []);

  // ── Voice toggle ───────────────────────────────────────────
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported. Please use Chrome or Edge.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // ── Input auto-resize ──────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ ...DM, height: "100vh", display: "flex", overflow: "hidden", color: "#fff", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "rgba(2,8,30,0.32)", pointerEvents: "none" }} />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink   { 0%,100% { opacity:.3; } 50% { opacity:1; } }
        @keyframes pulse   { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12); } }
        ::-webkit-scrollbar       { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(30,95,255,.25); border-radius: 3px; }
        .conv-row:hover            { background: rgba(255,255,255,.05) !important; }
        .conv-row:hover .conv-act  { opacity: 1 !important; }
        .tool-item:hover           { background: rgba(30,95,255,.12) !important; }
        .icon-btn:hover            { background: rgba(255,255,255,.1) !important; }
        select option              { background: #0a0f2c; color: #fff; }
        textarea                   { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        height: "100vh",
        background: "rgba(6,12,35,0.92)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(30,95,255,.15)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "width .25s ease, min-width .25s ease",
        flexShrink: 0,
      }}>
        <div style={{ width: 260, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Brand row */}
          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "linear-gradient(135deg,#0a1840,#1e5fff)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                }}>⚖</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".3px" }}>LegalMind AI</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Legal Assistant</p>
                </div>
              </div>
            </div>
          </div>

          {/* New chat button */}
          <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
            <button onClick={newChat} style={{
              ...DM, width: "100%", padding: "10px 14px",
              borderRadius: 10, border: "1px dashed rgba(30,95,255,.35)",
              background: "rgba(30,95,255,.06)", color: "rgba(255,255,255,.7)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all .2s",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.14)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.6)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.35)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.7)";
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
              New conversation
            </button>
          </div>

          {/* History label */}
          <div style={{ padding: "4px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <p style={{ fontSize: 9, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(255,255,255,.22)" }}>History</p>
            {conversations.length > 0 && (
              <button onClick={deleteAll} title="Clear all" style={{
                background: "none", border: "none",
                color: "rgba(255,80,80,.35)", fontSize: 12,
                cursor: "pointer", padding: "2px 4px", borderRadius: 4,
                transition: "color .2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,80,80,.8)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,80,80,.35)")}
              >
                🗑
              </button>
            )}
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {convsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                <Spinner size={20} />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 28, marginBottom: 10 }}>💬</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.2)", lineHeight: 1.8 }}>
                  No conversations yet.<br />Start a new chat!
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv._id === activeConvId;
                const isDeleting = deletingId === conv._id;
                const isRenaming = renamingId === conv._id;

                return (
                  <div
                    key={conv._id}
                    className="conv-row"
                    onClick={() => !isRenaming && selectConversation(conv)}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 9,
                      marginBottom: 2,
                      cursor: isRenaming ? "default" : "pointer",
                      background: isActive ? "rgba(30,95,255,.14)" : "transparent",
                      border: `1px solid ${isActive ? "rgba(30,95,255,.3)" : "transparent"}`,
                      opacity: isDeleting ? 0.4 : 1,
                      transition: "all .15s ease",
                      position: "relative",
                      animation: "fadeUp .2s ease",
                    }}
                  >
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onBlur={() => submitRename(conv._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename(conv._id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          ...DM, width: "100%",
                          background: "rgba(255,255,255,.08)",
                          border: "1px solid rgba(30,95,255,.4)",
                          borderRadius: 6, padding: "4px 8px",
                          color: "#fff", fontSize: 12, outline: "none",
                        }}
                      />
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingRight: 52 }}>
                          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1, opacity: .7 }}>
                            {conv.isPinned ? "📌" : "💬"}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{
                              fontSize: 12, fontWeight: isActive ? 600 : 400,
                              color: isActive ? "#fff" : "rgba(255,255,255,.65)",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {conv.title}
                            </p>
                            <p style={{
                              fontSize: 10, color: "rgba(255,255,255,.22)",
                              marginTop: 2,
                            }}>
                              {formatTime(conv.lastActivityAt)}
                              {conv.messageCount > 0 && ` · ${conv.messageCount} msgs`}
                            </p>
                          </div>
                        </div>

                        {/* Hover actions */}
                        <div
                          className="conv-act"
                          style={{
                            position: "absolute", top: "50%", right: 8,
                            transform: "translateY(-50%)",
                            display: "flex", gap: 3,
                            opacity: 0, transition: "opacity .15s",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button onClick={(e) => pinConv(conv, e)} title={conv.isPinned ? "Unpin" : "Pin"}
                            className="icon-btn"
                            style={{
                              background: "rgba(0,0,0,.6)", border: "none",
                              borderRadius: 5, padding: "3px 5px",
                              color: conv.isPinned ? "#ffd700" : "rgba(255,255,255,.4)",
                              fontSize: 10, cursor: "pointer", transition: "background .2s",
                            }}>📌</button>
                          <button onClick={(e) => { e.stopPropagation(); setRenamingId(conv._id); setRenameVal(conv.title); }}
                            title="Rename" className="icon-btn"
                            style={{
                              background: "rgba(0,0,0,.6)", border: "none",
                              borderRadius: 5, padding: "3px 5px",
                              color: "rgba(255,255,255,.4)", fontSize: 10, cursor: "pointer",
                            }}>✏️</button>
                          <button onClick={(e) => deleteConv(conv._id, e)} title="Delete"
                            className="icon-btn"
                            style={{
                              background: "rgba(0,0,0,.6)", border: "none",
                              borderRadius: 5, padding: "3px 5px",
                              color: "rgba(255,80,80,.6)", fontSize: 10, cursor: "pointer",
                            }}>✕</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom — back link */}
          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
            <button onClick={() => window.location.href = "/citizen"} style={{
              ...DM, width: "100%", padding: "9px 12px", borderRadius: 9,
              background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)",
              color: "rgba(255,255,255,.35)", fontSize: 12, cursor: "pointer",
              textAlign: "left", transition: "all .2s",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.7)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.35)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.03)";
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN
      ══════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", minWidth: 0, position: "relative" }}>

        {/* Top bar */}
        <div style={{
          height: 52, flexShrink: 0,
          display: "flex", alignItems: "center",
          padding: "0 20px", gap: 12,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: "rgba(2,8,30,.4)", backdropFilter: "blur(16px)",
        }}>
          {/* Sidebar toggle */}
          <button onClick={() => setSidebarOpen((v) => !v)} className="icon-btn" style={{
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 8, width: 34, height: 34,
            color: "rgba(255,255,255,.5)", fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background .2s",
          }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {activeConvId
                ? conversations.find((c) => c._id === activeConvId)?.title || "Legal Chat"
                : "LegalMind AI"}
            </p>
          </div>

          {/* New chat shortcut */}
          <button onClick={newChat} className="icon-btn" style={{
            ...DM, background: "rgba(30,95,255,.12)", border: "1px solid rgba(30,95,255,.3)",
            borderRadius: 8, padding: "6px 14px", color: BLUEB,
            fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
            transition: "background .2s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,95,255,.22)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(30,95,255,.12)")}
          >
            + New
          </button>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
          <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 20px" }}>

            {/* Loading */}
            {msgsLoading && (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <Spinner size={28} />
              </div>
            )}

            {/* Empty state */}
            {!msgsLoading && messages.length === 0 && !activeToolId && (
              <div style={{ textAlign: "center", paddingTop: 60, animation: "fadeUp .4s ease" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
                  background: "linear-gradient(135deg,#0a1840,#1e5fff)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                }}>⚖</div>
                <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>How can I help you?</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.8, maxWidth: 420, margin: "0 auto" }}>
                  Ask me anything about Indian law — your rights, court procedures,
                  legal notices, or any legal concept in plain language.
                </p>

                {/* Disclaimer */}
                <div style={{
                  background: "rgba(255,190,50,.07)", border: "1px solid rgba(255,190,50,.18)",
                  borderRadius: 10, padding: "10px 16px", maxWidth: 480,
                  margin: "18px auto 0", fontSize: 11, color: "rgba(255,210,100,.7)", lineHeight: 1.7,
                }}>
                  ⚠️ General legal information only — not legal advice.
                  Consult a qualified lawyer for your specific situation.
                </div>

                {/* Suggested questions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 28 }}>
                  {SUGGESTED.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)} style={{
                      ...DM, background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 20, padding: "8px 18px",
                      color: "rgba(255,255,255,.55)", fontSize: 12,
                      cursor: "pointer", transition: "all .2s",
                    }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.12)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.4)";
                        (e.currentTarget as HTMLElement).style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.04)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.1)";
                        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.55)";
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {!msgsLoading && messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: 20, animation: "fadeUp .2s ease" }}>
                {msg.role === "user" && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      maxWidth: "72%", padding: "11px 16px",
                      borderRadius: "18px 18px 4px 18px",
                      background: BLUE,
                      fontSize: 14, lineHeight: 1.8, color: "#fff",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && (
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#0a1840,#1e5fff)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}>⚖</div>
                    <div style={{
                      flex: 1, padding: "11px 16px",
                      borderRadius: "4px 18px 18px 18px",
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      fontSize: 14, lineHeight: 1.9,
                      color: "rgba(255,255,255,.82)", whiteSpace: "pre-wrap",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Inline tool form */}
            {activeToolId && (
              <div style={{ marginBottom: 20, animation: "fadeUp .25s ease" }}>
                <ToolForm
                  toolId={activeToolId}
                  onSubmit={handleToolResult}
                  onCancel={() => setActiveToolId(null)}
                />
              </div>
            )}

            {/* Typing indicator */}
            {sending && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#0a1840,#1e5fff)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>⚖</div>
                <div style={{
                  padding: "14px 18px",
                  borderRadius: "4px 18px 18px 18px",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: BLUEB,
                      animation: `blink 1.2s ease ${i * 0.22}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input area ─────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, padding: "12px 20px 18px",
          background: "rgba(2,8,30,.5)", backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,.06)",
        }}>
          <div style={{ maxWidth: 740, margin: "0 auto" }}>

            {/* Input box */}
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 8,
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(30,95,255,.2)",
              borderRadius: 14, padding: "8px 10px 8px 14px",
              transition: "border-color .2s",
            }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "rgba(30,95,255,.5)")}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "rgba(30,95,255,.2)")}
            >
              {/* Tools button */}
              <div style={{ position: "relative" }} ref={toolsMenuRef}>
                <button
                  onClick={() => setToolsOpen((v) => !v)}
                  title="Legal Tools"
                  className="icon-btn"
                  style={{
                    background: toolsOpen ? "rgba(30,95,255,.2)" : "rgba(255,255,255,.07)",
                    border: `1px solid ${toolsOpen ? "rgba(30,95,255,.5)" : "rgba(255,255,255,.1)"}`,
                    borderRadius: 8, width: 34, height: 34,
                    color: toolsOpen ? BLUEB : "rgba(255,255,255,.45)",
                    fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all .2s",
                  }}
                >
                  📎
                </button>

                {/* Tools popup menu */}
                {toolsOpen && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 10px)", left: 0,
                    width: 240,
                    background: "rgba(8,15,45,.97)", backdropFilter: "blur(24px)",
                    border: "1px solid rgba(30,95,255,.25)", borderRadius: 14,
                    padding: "8px 6px",
                    boxShadow: "0 12px 40px rgba(0,0,0,.7)",
                    zIndex: 100,
                    animation: "fadeUp .18s ease",
                  }}>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,.25)", letterSpacing: "1.8px", textTransform: "uppercase", padding: "4px 10px 8px" }}>Legal Tools</p>
                    {TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        className="tool-item"
                        onClick={() => {
                          setActiveToolId(tool.id);
                          setToolsOpen(false);
                        }}
                        style={{
                          ...DM, width: "100%", display: "flex", alignItems: "center",
                          gap: 10, padding: "9px 10px", borderRadius: 9, border: "none",
                          background: activeToolId === tool.id ? "rgba(30,95,255,.15)" : "transparent",
                          color: "#fff", fontSize: 13, cursor: "pointer",
                          textAlign: "left", transition: "background .15s",
                        }}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{tool.icon}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500 }}>{tool.label}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 1 }}>{tool.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question…"
                rows={1}
                style={{
                  ...DM, flex: 1, background: "none", border: "none",
                  outline: "none", color: "#fff", fontSize: 14,
                  resize: "none", lineHeight: 1.6, padding: "4px 0",
                  maxHeight: 140, overflowY: "auto",
                }}
              />

              {/* Mic button */}
              <button
                onClick={toggleVoice}
                title={isRecording ? "Stop recording" : "Voice input"}
                className="icon-btn"
                style={{
                  background: isRecording
                    ? "rgba(239,68,68,.2)"
                    : "rgba(255,255,255,.07)",
                  border: `1px solid ${isRecording ? "rgba(239,68,68,.5)" : "rgba(255,255,255,.1)"}`,
                  borderRadius: 8, width: 34, height: 34,
                  color: isRecording ? "#ef4444" : "rgba(255,255,255,.45)",
                  fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all .2s",
                  animation: isRecording ? "pulse 1.5s infinite" : "none",
                }}
              >
                🎤
              </button>

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending}
                style={{
                  background: !input.trim() || sending ? "rgba(30,95,255,.3)" : BLUE,
                  border: "none", borderRadius: 8,
                  width: 34, height: 34,
                  color: "#fff", fontSize: 16, cursor: !input.trim() || sending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background .2s",
                }}
              >
                {sending ? <Spinner size={16} /> : "↑"}
              </button>
            </div>

            <p style={{ fontSize: 10, color: "rgba(255,255,255,.15)", marginTop: 8, textAlign: "center" }}>
              General legal information only · Not legal advice · Consult a qualified lawyer for specific matters
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}