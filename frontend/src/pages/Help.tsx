// frontend/src/pages/Help.tsx

import { useState, useEffect, CSSProperties } from "react";
import CitizenLayout from "../components/CitizenLayout";
import { getFAQs, submitSupportMessage, getMySupportMessages } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";

const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.4)",
};

function categoryIcon(category: string): string {
  switch (category) {
    case "General": return "📌";
    case "Cases": return "📁";
    case "Lawyers": return "👤";
    case "Documents": return "📄";
    case "Hearings": return "📅";
    case "Account": return "⚙️";
    default: return "❓";
  }
}

function categoryColor(category: string): string {
  switch (category) {
    case "General": return BLUEB;
    case "Cases": return "#34d399";
    case "Lawyers": return "#a78bfa";
    case "Documents": return "#fbbf24";
    case "Hearings": return "#3b82f6";
    case "Account": return "#9ca3af";
    default: return "#6aadff";
  }
}

function supportStatusColor(status: string): string {
  switch (status) {
    case "open": return "#3b82f6";
    case "in_progress": return "#fbbf24";
    case "resolved": return "#34d399";
    default: return "#6aadff";
  }
}

function supportStatusLabel(status: string): string {
  switch (status) {
    case "open": return "Open";
    case "in_progress": return "In Progress";
    case "resolved": return "Resolved";
    default: return status;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Help() {
  const [tab, setTab] = useState<"faqs" | "contact" | "messages">("faqs");

  // FAQ state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [faqCategory, setFaqCategory] = useState("");
  const [faqLoading, setFaqLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Contact state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactMsg, setContactMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // My Messages state
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchFAQs();
  }, [faqCategory]);

  useEffect(() => {
    if (tab === "messages") fetchMessages();
  }, [tab]);

  const fetchFAQs = async () => {
    try {
      setFaqLoading(true);
      const res = await getFAQs(faqCategory || undefined);
      setFaqs(res.data.faqs);
      if (res.data.categories) setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setFaqLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const res = await getMySupportMessages();
      setSupportMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSubmitContact = async () => {
    if (!subject.trim() || !message.trim()) {
      setContactMsg({ type: "error", text: "Please fill in both subject and message" });
      return;
    }

    try {
      setSending(true);
      setContactMsg(null);
      await submitSupportMessage({ subject: subject.trim(), message: message.trim() });
      setContactMsg({ type: "success", text: "Support message submitted! We'll get back to you soon." });
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setContactMsg({ type: "error", text: err.response?.data?.message || "Failed to submit message" });
    } finally {
      setSending(false);
    }
  };

  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(f =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  // Group FAQs by category
  const groupedFaqs: Record<string, any[]> = {};
  filteredFaqs.forEach(f => {
    if (!groupedFaqs[f.category]) groupedFaqs[f.category] = [];
    groupedFaqs[f.category].push(f);
  });

  return (
    <CitizenLayout activeNav="help">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>SUPPORT</p>
          <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Help Center</p>
        </div>

        {/* Tab Switch */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          {[
            { id: "faqs" as const, label: "❓ FAQs" },
            { id: "contact" as const, label: "✉️ Contact Support" },
            { id: "messages" as const, label: "📬 My Messages" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...DM, fontSize: 12, fontWeight: 600, padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: tab === t.id ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: tab === t.id ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ FAQS TAB ═══ */}
        {tab === "faqs" && (
          <>
            {/* Search + Category Filter */}
            <div style={{ ...GLASS, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <input placeholder="Search FAQs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...DM, flex: 1, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,.6)", fontSize: 12, outline: "none" }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => setFaqCategory("")} style={{ ...DM, fontSize: 10, fontWeight: 600, padding: "6px 14px", borderRadius: 99, cursor: "pointer", background: faqCategory === "" ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: faqCategory === "" ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>All</button>
                {categories.map(c => (
                  <button key={c} onClick={() => setFaqCategory(c)} style={{ ...DM, fontSize: 10, fontWeight: 600, padding: "6px 14px", borderRadius: 99, cursor: "pointer", background: faqCategory === c ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: faqCategory === c ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
                    {categoryIcon(c)} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            {faqLoading ? (
              <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading FAQs...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div style={{ ...GLASS, borderRadius: 16, padding: 60, textAlign: "center" }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>❓</p>
                <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No FAQs found</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.keys(groupedFaqs).map(category => (
                  <div key={category}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                      <span style={{ fontSize: 16 }}>{categoryIcon(category)}</span>
                      <p style={{ ...DM, fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: categoryColor(category), fontWeight: 600 }}>{category}</p>
                    </div>
                    <div style={{ ...GLASS, borderRadius: 16, overflow: "hidden" }}>
                      {groupedFaqs[category].map((faq: any, i: number) => {
                        const isOpen = openFaq === faq._id;
                        return (
                          <div key={faq._id} style={{ borderBottom: i < groupedFaqs[category].length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                            <div onClick={() => setOpenFaq(isOpen ? null : faq._id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", transition: "background .2s ease" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.05)"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                              <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: isOpen ? "#fff" : "rgba(255,255,255,.7)", flex: 1 }}>{faq.question}</p>
                              <span style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s ease", flexShrink: 0, marginLeft: 12 }}>▾</span>
                            </div>
                            {isOpen && (
                              <div style={{ padding: "0 20px 18px 20px" }}>
                                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${categoryColor(category)}` }}>
                                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.8 }}>{faq.answer}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ CONTACT TAB ═══ */}
        {tab === "contact" && (
          <div style={{ display: "flex", gap: 24 }}>
            {/* Contact Form */}
            <div style={{ flex: 1 }}>
              <div style={{ ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
                <p style={{ ...DM, fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Send a Message</p>
                <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 24 }}>Our support team will respond within 24-48 hours.</p>

                {contactMsg && (
                  <div style={{ ...DM, background: contactMsg.type === "success" ? "rgba(52,211,153,.15)" : "rgba(255,107,107,.15)", border: `1px solid ${contactMsg.type === "success" ? "rgba(52,211,153,.3)" : "rgba(255,107,107,.3)"}`, borderRadius: 8, padding: "12px 14px", fontSize: 12, color: contactMsg.type === "success" ? "#34d399" : "#ff6b6b", marginBottom: 16 }}>
                    {contactMsg.type === "success" ? "✅" : "❌"} {contactMsg.text}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Subject *</p>
                    <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Issue with document upload" style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.6)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Message *</p>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Describe your issue or question in detail..." style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.6)", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={handleSubmitContact} disabled={sending} style={{ ...DM, background: sending ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 24px", borderRadius: 10, border: "none", cursor: sending ? "not-allowed" : "pointer", boxShadow: SH_CARD, transition: "transform .2s ease", alignSelf: "flex-start" }}
                    onMouseEnter={e => { if (!sending) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "📧", title: "Email Support", desc: "support@legalmind.com", sub: "Response within 24 hours" },
                { icon: "📞", title: "Phone Support", desc: "1800-XXX-XXXX", sub: "Mon-Fri, 9 AM - 6 PM" },
                { icon: "💬", title: "AI Assistant", desc: "Get instant help", sub: "Available 24/7" },
              ].map((info, i) => (
                <div key={i} style={{ ...GLASS, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14, transition: "transform .2s ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(30,95,255,.15)", border: "1px solid rgba(30,95,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {info.icon}
                  </div>
                  <div>
                    <p style={{ ...DM, fontSize: 12, fontWeight: 600, color: "#fff" }}>{info.title}</p>
                    <p style={{ ...DM, fontSize: 11, color: ICEB, marginTop: 2 }}>{info.desc}</p>
                    <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 2 }}>{info.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MY MESSAGES TAB ═══ */}
        {tab === "messages" && (
          <div style={{ ...GLASS, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

            {messagesLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading messages...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : supportMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📬</p>
                <p style={{ ...DM, fontSize: 16, color: "rgba(255,255,255,.3)" }}>No support messages yet</p>
                <button onClick={() => setTab("contact")} style={{ ...DM, background: BLUE, color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", marginTop: 16 }}>Contact Support</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {supportMessages.map((m, i) => (
                  <div key={m._id} style={{ padding: "18px 20px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,.06)", transition: "all .2s ease" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.4)"}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <p style={{ ...DM, fontSize: 14, fontWeight: 600, color: "#fff" }}>{m.subject}</p>
                      <span style={{ ...DM, fontSize: 9, padding: "4px 10px", borderRadius: 99, background: `${supportStatusColor(m.status)}15`, border: `1px solid ${supportStatusColor(m.status)}44`, color: supportStatusColor(m.status), fontWeight: 600, flexShrink: 0 }}>
                        {supportStatusLabel(m.status)}
                      </span>
                    </div>

                    <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.7, marginBottom: 8 }}>{m.message}</p>

                    <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.2)" }}>Submitted on {formatDate(m.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </CitizenLayout>
  );
}