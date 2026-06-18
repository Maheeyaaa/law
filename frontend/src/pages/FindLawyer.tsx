import { useState, useEffect, CSSProperties } from "react";
import {
  browseLawyers,
  getLawyerPublicProfile,
  recommendLawyers,
  generateContactEmail,
  classifyCaseType,
} from "../services/api";

// ── Fonts & Colors ────────────────────────────────────────────────
const DM:    CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const SERIF: CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const GOLD  = "#C9A84C";
const GREEN = "#34d399";
const RED   = "#ef4444";

const CARD: CSSProperties = {
  background:   "rgba(20, 15, 10, 0.55)",
  border:       "1px solid rgba(201, 168, 76, 0.25)",
  borderRadius: 0,
  boxShadow:    "none",
};

// ── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || "?";
}

function getAvatarGradient(name: string): string {
  const colors = [
    "linear-gradient(135deg,#1e5fff,#7c3aed)",
    "linear-gradient(135deg,#0ea5e9,#1e5fff)",
    "linear-gradient(135deg,#7c3aed,#ec4899)",
    "linear-gradient(135deg,#10b981,#1e5fff)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getMatchColor(score: number): string {
  if (score >= 90) return "#34d399";
  if (score >= 70) return "#C9A84C";
  if (score >= 40) return "#f97316";
  return "#94a3b8";
}

function getDisplaySpec(lawyer: any, preferredSpec?: string): string {
  const specs = lawyer.specializations?.length
    ? lawyer.specializations
    : [lawyer.specialization].filter(Boolean);

  if (specs.length === 0) return "General Practice";

  if (preferredSpec) {
    const target = preferredSpec.toLowerCase().trim();
    const matched = specs.find((s: string) =>
      s.toLowerCase().includes(target) || target.includes(s.toLowerCase())
    );
    if (matched) return matched;
  }

  if (lawyer.matchedSpec) return lawyer.matchedSpec;

  return specs[0];
}

function getSpecCount(lawyer: any): number {
  return lawyer.specializations?.length ||
         (lawyer.specialization ? 1 : 0);
}

// ═════════════════════════════════════════════════════════════════
// EMAIL MODAL
// ═════════════════════════════════════════════════════════════════
function EmailModal({
  lawyer,
  onClose,
}: {
  lawyer: any;
  onClose: () => void;
}) {
  const [loading, setLoading]     = useState(false);
  const [emailData, setEmailData] = useState<any>(null);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  useEffect(() => { generateEmail(); }, []);

  const generateEmail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await generateContactEmail(lawyer._id, {
        caseType:         lawyer._recommendedFor || "Legal Matter",
        caseLocation:     lawyer.district || "Telangana",
        aiSummary:        lawyer._aiSummary || "",
        documentAttached: false,
      });
      setEmailData(res.data.email);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not generate email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailData?.body || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,.9)",
          backdropFilter: "blur(12px)",
        }}
      />
      <div style={{
        position: "relative", width: "100%", maxWidth: 600,
        maxHeight: "85vh",
        background: "rgba(12, 10, 6, 0.98)",
        border: `1px solid ${GOLD}`,
        boxShadow: "0 40px 100px rgba(0,0,0,.95)",
        animation: "fadeIn .25s ease both",
        overflowY: "auto",
      }}>
        <div style={{
          padding: "24px 28px 18px",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          position: "sticky", top: 0,
          background: "rgba(12, 10, 6, 0.98)",
          zIndex: 2,
        }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <p style={{
              ...DM, fontSize: 9, letterSpacing: "2px",
              color: GOLD, textTransform: "uppercase", marginBottom: 6,
            }}>
              Contact Lawyer
            </p>
            <p style={{
              ...SERIF, fontSize: 18, fontWeight: 700, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {lawyer.name}
            </p>
            <p style={{
              ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              📧 {lawyer.email || "No email"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, flexShrink: 0,
              background: "rgba(201,168,76,.05)",
              border: `1px solid ${GOLD}`, color: GOLD,
              fontSize: 14, cursor: "pointer", ...DM,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        <div style={{ padding: "20px 28px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{
                width: 36, height: 36,
                border: "3px solid rgba(201,168,76,0.1)",
                borderTop: `3px solid ${GOLD}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 14px",
              }} />
              <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.5)" }}>
                Generating email...
              </p>
            </div>
          ) : error ? (
            <div style={{
              background: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.3)",
              padding: "16px 20px",
            }}>
              <p style={{ ...DM, fontSize: 12, color: "#ef4444" }}>⚠️ {error}</p>
            </div>
          ) : emailData ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <p style={{
                  ...DM, fontSize: 9, color: "rgba(255,255,255,.35)",
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8,
                }}>Subject</p>
                <div style={{ ...CARD, padding: "10px 14px" }}>
                  <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.7)" }}>
                    {emailData.subject}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 8,
                }}>
                  <p style={{
                    ...DM, fontSize: 9, color: "rgba(255,255,255,.35)",
                    textTransform: "uppercase", letterSpacing: "1px",
                  }}>Email Body</p>
                  <button
                    onClick={handleCopyBody}
                    style={{
                      ...DM, fontSize: 9, fontWeight: 600, padding: "4px 10px",
                      background: copied ? "rgba(52,211,153,.1)" : "rgba(201,168,76,.08)",
                      border: `1px solid ${copied ? "rgba(52,211,153,.3)" : "rgba(201,168,76,.2)"}`,
                      color: copied ? GREEN : GOLD, cursor: "pointer",
                    }}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <pre style={{
                  ...DM, fontSize: 11, color: "rgba(255,255,255,.6)",
                  background: "rgba(0,0,0,.3)",
                  border: "1px solid rgba(201,168,76,.15)",
                  padding: "14px 16px", lineHeight: 1.8,
                  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                }}>
                  {emailData.body}
                </pre>
              </div>

              <div style={{
                background: "rgba(201,168,76,.05)",
                border: "1px solid rgba(201,168,76,.2)",
                padding: "12px 14px",
                display: "flex", gap: 10, alignItems: "flex-start",
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 14 }}>💡</span>
                <p style={{ ...DM, fontSize: 11, color: "rgba(201,168,76,.8)", lineHeight: 1.6 }}>
                  Gmail will open with this pre-filled message. You can{" "}
                  <strong style={{ color: GOLD }}>edit it</strong> before sending.
                </p>
              </div>
            </>
          ) : null}
        </div>

        {emailData && (
          <div style={{
            padding: "14px 28px",
            borderTop: "1px solid rgba(201,168,76,0.2)",
            display: "flex", gap: 10,
            position: "sticky", bottom: 0,
            background: "rgba(12, 10, 6, 0.98)",
            zIndex: 2,
          }}>
            <button
              onClick={() => window.open(emailData.gmailLink, "_blank")}
              style={{
                ...DM, flex: 2,
                background: GOLD, color: "#111",
                fontSize: 13, fontWeight: 700,
                padding: "12px 20px", border: "none", cursor: "pointer",
              }}
            >
              📧 Open in Gmail
            </button>
            <a
              href={emailData.mailtoLink}
              style={{
                ...DM, flex: 1,
                background: "rgba(201,168,76,.1)", color: GOLD,
                fontSize: 12, fontWeight: 600,
                padding: "12px 16px",
                border: "1px solid rgba(201,168,76,.25)",
                textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              Other Mail
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// LAWYER CARD (Browse Grid)
// ═════════════════════════════════════════════════════════════════
function LawyerCard({
  lawyer: l,
  idx,
  onViewProfile,
  activeSpecFilter,
}: {
  lawyer: any;
  idx: number;
  onViewProfile: (id: string) => void;
  activeSpecFilter?: string;
}) {
  const primarySpec = getDisplaySpec(l, activeSpecFilter);
  const moreCount   = getSpecCount(l) - 1;

  return (
    <div
      className="lawyer-card"
      onClick={() => onViewProfile(l._id)}
      style={{
        ...CARD,
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .25s ease",
        animationDelay: `${idx * 50}ms`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform  = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.background = "rgba(20,15,10,0.75)";
        (e.currentTarget as HTMLElement).style.border     = `1px solid ${GOLD}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform  = "translateY(0)";
        (e.currentTarget as HTMLElement).style.background = "rgba(20,15,10,0.55)";
        (e.currentTarget as HTMLElement).style.border     = "1px solid rgba(201,168,76,0.25)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
        background: `linear-gradient(90deg,transparent,${GOLD},transparent)`,
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: getAvatarGradient(l.name),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff", ...DM,
          boxShadow: "0 4px 12px rgba(0,0,0,.4)",
        }}>
          {getInitials(l.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            ...SERIF, fontSize: 15, fontWeight: 700, color: "#fff",
            lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {l.name}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, padding: "2px 8px",
              background: activeSpecFilter
                ? "rgba(52,211,153,.1)"
                : "rgba(201,168,76,.08)",
              border: activeSpecFilter
                ? "1px solid rgba(52,211,153,.3)"
                : "1px solid rgba(201,168,76,.2)",
              color: activeSpecFilter ? GREEN : GOLD,
            }}>
              {primarySpec}
            </span>
            {moreCount > 0 && (
              <span style={{
                ...DM, fontSize: 9, color: "rgba(255,255,255,.4)",
              }}>
                +{moreCount} more
              </span>
            )}
          </div>

          {l.district && (
            <p style={{
              ...DM, fontSize: 10,
              color: "rgba(255,255,255,.4)",
              marginTop: 4,
            }}>
              📍 {l.city ? `${l.city}, ` : ""}{l.district}
            </p>
          )}
        </div>

        {l.isVerified && (
          <div style={{
            flexShrink: 0,
            fontSize: 10, color: GREEN, fontWeight: 600,
            ...DM,
          }}>
            ✓ Verified
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile(l._id);
        }}
        style={{
          ...DM, width: "100%",
          background: "rgba(201,168,76,.10)",
          color: GOLD, fontSize: 11, fontWeight: 600,
          padding: "10px 14px",
          border: `1px solid ${GOLD}`,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,.20)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(201,168,76,.10)")}
      >
        View Profile →
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// RECOMMENDATION CARD
// ═════════════════════════════════════════════════════════════════
function RecommendationCard({
  lawyer,
  rank,
  onClick,
}: {
  lawyer: any;
  rank: number;
  onClick: () => void;
}) {
  const score = lawyer.matchScore || 0;
  const color = getMatchColor(score);

  return (
    <div
      onClick={onClick}
      style={{
        ...CARD,
        padding: "18px",
        cursor: "pointer",
        position: "relative",
        transition: "all .25s ease",
        animation: `fadeIn .3s ease ${rank * 80}ms both`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.border     = `1px solid ${GOLD}`;
        (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.08)";
        (e.currentTarget as HTMLElement).style.transform  = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.border     = "1px solid rgba(201,168,76,0.25)";
        (e.currentTarget as HTMLElement).style.background = "rgba(20, 15, 10, 0.55)";
        (e.currentTarget as HTMLElement).style.transform  = "translateY(0)";
      }}
    >
      <div style={{
        position: "absolute", top: 12, right: 12,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{
          ...DM, fontSize: 9, fontWeight: 700,
          padding: "3px 8px",
          background: rank === 0 ? "rgba(201,168,76,.2)" : "rgba(255,255,255,.05)",
          border: rank === 0 ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,.1)",
          color: rank === 0 ? GOLD : "rgba(255,255,255,.4)",
        }}>
          #{rank + 1}
        </span>

        <span style={{
          ...DM, fontSize: 11, fontWeight: 700,
          padding: "3px 10px",
          background: `${color}22`,
          border: `1px solid ${color}66`,
          color: color,
        }}>
          {score}% match
        </span>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 14, marginTop: 4,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: getAvatarGradient(lawyer.name),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#fff", ...DM,
        }}>
          {getInitials(lawyer.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 90 }}>
          <p style={{
            ...SERIF, fontSize: 14, fontWeight: 700, color: "#fff",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {lawyer.name}
          </p>
          {lawyer.isVerified && (
            <p style={{ ...DM, fontSize: 9, color: GREEN, marginTop: 2, fontWeight: 600 }}>
              ✓ Verified Advocate
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{
              ...DM, fontSize: 10, fontWeight: 600,
              padding: "2px 7px",
              background: "rgba(52,211,153,.1)",
              border: "1px solid rgba(52,211,153,.3)",
              color: GREEN,
            }}>
              {lawyer.matchedSpec || getDisplaySpec(lawyer)}
            </span>
            {getSpecCount(lawyer) > 1 && (
              <span style={{
                ...DM, fontSize: 9, color: "rgba(255,255,255,.4)",
              }}>
                +{getSpecCount(lawyer) - 1} more
              </span>
            )}
          </div>
          <p style={{ ...DM, fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
            📍 {lawyer.city ? `${lawyer.city}, ` : ""}{lawyer.district}
          </p>
        </div>
      </div>

      {lawyer.matchReasons?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {lawyer.matchReasons.map((reason: string, i: number) => (
            <p key={i} style={{
              ...DM, fontSize: 10, color: "rgba(255,255,255,.55)",
            }}>
              ✓ {reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PROFILE MODAL
// ═════════════════════════════════════════════════════════════════
function ProfileModal({
  loading,
  lawyer,
  copiedField,
  onClose,
  onContact,
  onCopy,
}: {
  loading: boolean;
  lawyer: any;
  copiedField: string | null;
  onClose: () => void;
  onContact: (lawyer: any) => void;
  onCopy: (text: string, fieldKey: string) => void;
}) {
  const allSpecs: string[] = lawyer
    ? (lawyer.specializations?.length
        ? lawyer.specializations
        : [lawyer.specialization || "General Practice"])
    : [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,.85)",
          backdropFilter: "blur(10px)",
        }}
      />

      <div style={{
        position: "relative", width: "100%", maxWidth: 620,
        maxHeight: "90vh", overflowY: "auto",
        background: "rgba(12,10,6,0.98)",
        border: `1px solid ${GOLD}`,
        boxShadow: "0 32px 80px rgba(0,0,0,.9)",
        animation: "fadeIn .25s ease both",
      }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{
              width: 40, height: 40,
              border: "3px solid rgba(201,168,76,0.1)",
              borderTop: `3px solid ${GOLD}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ ...DM, fontSize: 14, color: "rgba(255,255,255,.5)" }}>
              Loading profile...
            </p>
          </div>
        )}

        {!loading && lawyer && (
          <>
            <div style={{
              padding: "32px 32px 24px",
              borderBottom: "1px solid rgba(201,168,76,0.2)",
              position: "relative",
            }}>
              <button
                onClick={onClose}
                style={{
                  position: "absolute", top: 20, right: 20,
                  width: 32, height: 32,
                  background: "rgba(201,168,76,.05)",
                  border: `1px solid ${GOLD}`,
                  color: GOLD, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                  background: getAvatarGradient(lawyer.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 700, color: "#fff", ...DM,
                  boxShadow: "0 8px 24px rgba(0,0,0,.6)",
                }}>
                  {getInitials(lawyer.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 44 }}>
                  <p style={{
                    ...SERIF, fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.3,
                  }}>
                    {lawyer.name}
                  </p>

                  {lawyer.isVerified && (
                    <p style={{
                      ...DM, fontSize: 10, fontWeight: 600, marginTop: 4,
                      color: GREEN,
                    }}>
                      ✓ Verified Advocate
                    </p>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {allSpecs.map((spec: string) => (
                      <span key={spec} style={{
                        fontSize: 11, padding: "3px 9px",
                        background: "rgba(201,168,76,.08)",
                        border: "1px solid rgba(201,168,76,.2)",
                        color: GOLD,
                      }}>
                        {spec}
                      </span>
                    ))}
                  </div>

                  {lawyer.district && (
                    <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 8 }}>
                      📍 {lawyer.city ? `${lawyer.city}, ` : ""}{lawyer.district}, Telangana
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
              }}>
                {[
                  {
                    label:    "District",
                    value:    lawyer.district || "Not available",
                    copyable: false,
                  },
                  {
                    label:    "City",
                    value:    lawyer.city || "Not available",
                    copyable: false,
                  },
                  {
                    label:    "Email",
                    value:    lawyer.email || "Not available",
                    copyable: !!lawyer.email,
                    fieldKey: "email",
                  },
                  {
                    label:    "Phone",
                    value:    lawyer.phone || "Not available",
                    copyable: !!lawyer.phone,
                    fieldKey: "phone",
                  },
                ].map((d, i) => (
                  <div key={i} style={{
                    ...CARD, padding: "12px 14px",
                    position: "relative",
                  }}>
                    <p style={{
                      ...DM, fontSize: 9, color: "rgba(255,255,255,.35)",
                      textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6,
                    }}>
                      {d.label}
                    </p>
                    <p style={{
                      ...DM, fontSize: 12, color: "#fff", fontWeight: 600,
                      wordBreak: "break-all",
                      paddingRight: d.copyable ? 48 : 0,
                    }}>
                      {d.value}
                    </p>
                    {d.copyable && d.value !== "Not available" && (
                      <button
                        onClick={() => onCopy(d.value, d.fieldKey!)}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          background: "rgba(201,168,76,.05)",
                          border: `1px solid ${GOLD}`,
                          color: copiedField === d.fieldKey ? GREEN : GOLD,
                          fontSize: 9, fontWeight: 600,
                          padding: "3px 8px", cursor: "pointer", ...DM,
                        }}
                      >
                        {copiedField === d.fieldKey ? "✓" : "Copy"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {lawyer.education?.length > 0 && (
                <div>
                  <p style={{
                    ...DM, fontSize: 9, color: "rgba(255,255,255,.4)",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8,
                  }}>
                    Education
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lawyer.education.map((edu: string, i: number) => (
                      <div key={i} style={{
                        ...DM, fontSize: 11, color: "rgba(255,255,255,.6)",
                        padding: "6px 12px",
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.07)",
                      }}>
                        🎓 {edu}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lawyer.bio && (
                <div>
                  <p style={{
                    ...DM, fontSize: 9, color: "rgba(255,255,255,.4)",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8,
                  }}>
                    About
                  </p>
                  <p style={{
                    ...DM, fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.8,
                  }}>
                    {lawyer.bio}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lawyer.email && (
                  <button
                    onClick={() => onContact(lawyer)}
                    style={{
                      ...DM, width: "100%",
                      background: GOLD, color: "#111",
                      fontSize: 13, fontWeight: 700,
                      padding: "14px 20px", border: "none", cursor: "pointer",
                    }}
                  >
                    📧 Send Email via LegalMind
                  </button>
                )}

                {lawyer.phone && (
                  <a
                    href={`https://wa.me/91${lawyer.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...DM, width: "100%",
                      background: "#25D366", color: "#fff",
                      fontSize: 13, fontWeight: 700,
                      padding: "14px 20px",
                      textDecoration: "none", textAlign: "center",
                      display: "block", boxSizing: "border-box",
                    }}
                  >
                    💬 Contact on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function FindLawyer() {
  // ── Browse Data ─────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true);
  const [lawyers, setLawyers]       = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableSpecs, setAvailableSpecs]         = useState<string[]>([]);

  // ── Filters ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [specFilter, setSpecFilter]         = useState("");
  const [sortBy, setSortBy]                 = useState("name");

  // ── Profile Modal ───────────────────────────────────────────────
  const [showProfile, setShowProfile]       = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [copiedField, setCopiedField]       = useState<string | null>(null);

  // ── Email Modal ─────────────────────────────────────────────────
  const [showEmail, setShowEmail]     = useState(false);
  const [emailLawyer, setEmailLawyer] = useState<any>(null);

  // ── AI Recommendation Results ───────────────────────────────────
  const [recLoading, setRecLoading]     = useState(false);
  const [recommended, setRecommended]   = useState<any[]>([]);
  const [analysisInfo, setAnalysisInfo] = useState<{
    caseType: string;
    district: string | null;
    city: string | null;
  } | null>(null);

  // ── Notice Upload ───────────────────────────────────────────────
  const [uploadFile, setUploadFile]         = useState<File | null>(null);
  const [uploadText, setUploadText]         = useState("");
  const [uploadLoading, setUploadLoading]   = useState(false);
  const [uploadMessage, setUploadMessage]   = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // ── Fetch lawyers ───────────────────────────────────────────────
  useEffect(() => {
    fetchLawyers();
  }, [searchQuery, districtFilter, specFilter, sortBy, page]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12, sortBy };
      if (searchQuery.trim()) params.search         = searchQuery.trim();
      if (districtFilter)     params.district       = districtFilter;
      if (specFilter)         params.specialization = specFilter;

      const res = await browseLawyers(params);
      setLawyers(res.data.lawyers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);

      if (res.data.filters?.districts)
        setAvailableDistricts(res.data.filters.districts);
      if (res.data.filters?.specializations)
        setAvailableSpecs(res.data.filters.specializations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Profile Handling ────────────────────────────────────────────
  const handleViewProfile = async (lawyerId: string) => {
    try {
      setProfileLoading(true);
      setShowProfile(true);
      setSelectedLawyer(null);
      const res = await getLawyerPublicProfile(lawyerId);
      setSelectedLawyer(res.data.lawyer);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleContactLawyer = (lawyer: any) => {
    setEmailLawyer(lawyer);
    setShowEmail(true);
    setShowProfile(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDistrictFilter("");
    setSpecFilter("");
    setSortBy("name");
    setPage(1);
  };

  // ── Handle Notice Upload, Detect, AND Recommend ────────────────
  const handleAnalyzeAndRecommend = async () => {
    if (!uploadFile && !uploadText.trim()) {
      setUploadMessage({
        type: "error",
        text: "Please upload a notice or paste the text.",
      });
      return;
    }

    setUploadLoading(true);
    setUploadMessage(null);
    setAnalysisInfo(null);
    setRecommended([]);

    try {
      let res;
      if (uploadFile) {
        const fd = new FormData();
        fd.append("noticeFile", uploadFile);
        if (uploadText.trim()) fd.append("notice", uploadText.trim());
        res = await classifyCaseType(fd);
      } else {
        res = await classifyCaseType({ notice: uploadText.trim() });
      }

      const { success, detectedCaseType, detectedDistrict, detectedCity, message } = res.data;

      if (!success || !detectedCaseType) {
        setUploadMessage({
          type: "error",
          text: message || "Could not detect the case type. Please try a clearer notice.",
        });
        setUploadLoading(false);
        return;
      }

      setRecLoading(true);

      const params: any = {
        caseType: detectedCaseType,
        limit: 10,
      };
      if (detectedDistrict) params.district = detectedDistrict;
      if (detectedCity)     params.city     = detectedCity;

      const recRes = await recommendLawyers(params);

      setAnalysisInfo({
        caseType: detectedCaseType,
        district: detectedDistrict,
        city: detectedCity,
      });

      setRecommended(recRes.data.recommended || []);
      setUploadMessage(null);

      setTimeout(() => {
        const resultsEl = document.getElementById("ai-results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

    } catch (err: any) {
      setUploadMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to analyze notice. Please try again.",
      });
    } finally {
      setUploadLoading(false);
      setRecLoading(false);
    }
  };

  const handleClearAnalysis = () => {
    setAnalysisInfo(null);
    setRecommended([]);
    setUploadFile(null);
    setUploadText("");
    setUploadMessage(null);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasActiveFilters =
    searchQuery || districtFilter || specFilter || sortBy !== "name";

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      backgroundImage:
        "linear-gradient(rgba(15,10,5,0.75),rgba(15,10,5,0.75)), url('/find.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .lawyer-card { animation: fadeIn .3s ease both; }
        .skeleton {
          background: linear-gradient(90deg,rgba(201,168,76,.04) 25%,rgba(201,168,76,.08) 50%,rgba(201,168,76,.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 99px; }
      `}</style>

      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ══ HERO HEADER ══ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", flexWrap: "wrap", gap: 24,
          }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{
                ...DM, fontSize: 9, letterSpacing: "2.5px",
                textTransform: "uppercase", color: "#f5e6c8", marginBottom: 8,
              }}>
                Legal Assistance — Telangana
              </p>
              <p style={{
                ...SERIF, fontWeight: 700, fontSize: 32, color: "#f5e6c8",
                lineHeight: 1, marginBottom: 12, letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Find a Lawyer
              </p>
              <p style={{
                ...DM, fontSize: 13, color: "rgba(255,255,255,.5)",
                lineHeight: 1.7, maxWidth: 600,
              }}>
                Upload your legal notice for AI-powered lawyer recommendations,
                or browse verified advocates across Telangana.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { value: total.toString().padStart(3, "0"), label: "Lawyers"   },
                { value: String(availableDistricts.length), label: "Districts" },
                { value: String(availableSpecs.length),     label: "Areas"     },
              ].map((stat) => (
                <div key={stat.label} style={{
                  ...CARD, padding: "16px 22px",
                  minWidth: 110, textAlign: "center",
                }}>
                  <p style={{ ...SERIF, fontWeight: 700, fontSize: 28, color: GOLD, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  <p style={{
                    ...DM, fontSize: 9, letterSpacing: "1.5px",
                    color: GOLD, textTransform: "uppercase", marginTop: 6,
                  }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ AI ANALYSIS SECTION ══ */}
        <div style={{
          ...CARD,
          border: `1px solid rgba(52, 211, 153, 0.4)`,
          padding: "24px 28px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
          }} />

          <div style={{ marginBottom: 20 }}>
            <p style={{
              ...DM, fontSize: 9, letterSpacing: "2px",
              color: GREEN, textTransform: "uppercase", fontWeight: 700,
            }}>
              ✨ AI Powered
            </p>
            <p style={{
              ...SERIF, fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 4,
            }}>
              Upload Your Legal Notice
            </p>
            <p style={{
              ...DM, fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 6, lineHeight: 1.6,
            }}>
              Our AI will analyze your notice, detect the case type and location,
              then recommend the best matching lawyers ranked by relevance.
            </p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              ...DM, fontSize: 10, color: "rgba(255,255,255,.5)",
              textTransform: "uppercase", letterSpacing: "1px",
              display: "block", marginBottom: 8,
            }}>
              Upload Notice (PDF or TXT)
            </label>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              disabled={uploadLoading}
              style={{
                ...DM, width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.2)",
                padding: "12px",
                color: "rgba(255,255,255,.7)",
                fontSize: 12,
                cursor: uploadLoading ? "not-allowed" : "pointer",
                boxSizing: "border-box",
              }}
            />
            {uploadFile && (
              <p style={{ ...DM, fontSize: 11, color: GREEN, marginTop: 6 }}>
                📎 {uploadFile.name}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
            <span style={{
              ...DM, fontSize: 10, color: "rgba(255,255,255,.3)",
              letterSpacing: "1.5px", textTransform: "uppercase",
            }}>Or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              ...DM, fontSize: 10, color: "rgba(255,255,255,.5)",
              textTransform: "uppercase", letterSpacing: "1px",
              display: "block", marginBottom: 8,
            }}>
              Paste Notice Text
            </label>
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste the contents of your legal notice here..."
              rows={5}
              disabled={uploadLoading}
              style={{
                ...DM, width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.2)",
                padding: "12px",
                color: "rgba(255,255,255,.8)",
                fontSize: 12,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
              }}
            />
          </div>

          {uploadMessage && (
            <div style={{
              padding: "12px 16px",
              marginBottom: 14,
              background:
                uploadMessage.type === "success" ? "rgba(52,211,153,.1)" :
                uploadMessage.type === "error"   ? "rgba(239,68,68,.1)" :
                                                    "rgba(201,168,76,.1)",
              border: `1px solid ${
                uploadMessage.type === "success" ? "rgba(52,211,153,.3)" :
                uploadMessage.type === "error"   ? "rgba(239,68,68,.3)" :
                                                    "rgba(201,168,76,.3)"
              }`,
            }}>
              <p style={{
                ...DM, fontSize: 12,
                color:
                  uploadMessage.type === "success" ? GREEN :
                  uploadMessage.type === "error"   ? RED :
                                                      GOLD,
              }}>
                {uploadMessage.text}
              </p>
            </div>
          )}

          <button
            onClick={handleAnalyzeAndRecommend}
            disabled={uploadLoading || recLoading || (!uploadFile && !uploadText.trim())}
            style={{
              ...DM, width: "100%",
              background: uploadLoading || recLoading || (!uploadFile && !uploadText.trim())
                ? "rgba(52,211,153,.2)"
                : GREEN,
              color: uploadLoading || recLoading || (!uploadFile && !uploadText.trim())
                ? "rgba(255,255,255,.5)"
                : "#111",
              fontSize: 14, fontWeight: 700,
              padding: "14px 20px",
              border: "none",
              cursor: uploadLoading || recLoading || (!uploadFile && !uploadText.trim())
                ? "not-allowed"
                : "pointer",
              transition: "transform .2s ease",
            }}
            onMouseEnter={(e) => {
              if (!uploadLoading && !recLoading && (uploadFile || uploadText.trim())) {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {uploadLoading ? "🔍 Analyzing notice..." :
             recLoading    ? "⚖️ Finding best lawyers..." :
                             "✨ Analyze & Find Lawyers"}
          </button>

          <p style={{
            ...DM, fontSize: 10,
            color: "rgba(255,255,255,.3)",
            textAlign: "center",
            lineHeight: 1.6,
            marginTop: 10,
          }}>
            Your notice is analyzed by AI and not stored.
          </p>
        </div>

        {/* ══ AI RESULTS SECTION ══ */}
        {analysisInfo && (
          <div id="ai-results" style={{
            ...CARD,
            border: `1px solid ${GOLD}`,
            padding: "24px 28px",
            position: "relative",
            overflow: "hidden",
            animation: "fadeIn .4s ease both",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            }} />

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", gap: 14, flexWrap: "wrap",
              marginBottom: 20,
            }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <p style={{
                  ...DM, fontSize: 9, letterSpacing: "2px",
                  color: GOLD, textTransform: "uppercase", fontWeight: 700,
                }}>
                  ✓ Analysis Complete
                </p>
                <p style={{
                  ...SERIF, fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4,
                }}>
                  Detected:{" "}
                  <span style={{ color: GOLD }}>{analysisInfo.caseType}</span>
                  {analysisInfo.district && (
                    <> in <span style={{ color: GOLD }}>{analysisInfo.district}</span></>
                  )}
                  {analysisInfo.city && (
                    <>, <span style={{ color: GOLD }}>{analysisInfo.city}</span></>
                  )}
                </p>
                <p style={{
                  ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 6,
                }}>
                  Showing top <strong style={{ color: GOLD }}>{recommended.length}</strong> ranked lawyers
                  by specialization (70%), district (20%), and city (10%) match.
                </p>
              </div>

              <button
                onClick={handleClearAnalysis}
                style={{
                  ...DM, fontSize: 11, fontWeight: 600,
                  padding: "10px 18px",
                  background: "rgba(239,68,68,.08)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: RED,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ✕ Clear & Try Another
              </button>
            </div>

            {recommended.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px" }}>
                <p style={{ ...SERIF, fontSize: 16, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>
                  No matching lawyers found
                </p>
                <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                  We couldn't find lawyers matching this case in your area. Try browsing all lawyers below.
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}>
                {recommended.map((lawyer, idx) => (
                  <RecommendationCard
                    key={lawyer._id}
                    lawyer={lawyer}
                    rank={idx}
                    onClick={() => handleViewProfile(lawyer._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ DIVIDER ══ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, margin: "8px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Or Browse All Lawyers
          </p>
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
        </div>

        {/* ══ SEARCH + FILTERS ══ */}
        <div style={{
          ...CARD, padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <input
            placeholder="Search by name, phone, email, specialization..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            style={{
              ...DM, width: "100%", background: "transparent",
              border: "1px solid rgba(201,168,76,0.2)",
              padding: "14px", color: "rgba(255,255,255,.85)",
              fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.border = `1px solid ${GOLD}`)}
            onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.2)")}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={districtFilter}
              onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
              style={selectStyle}
            >
              <option value="">All Districts ({availableDistricts.length})</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={specFilter}
              onChange={(e) => { setSpecFilter(e.target.value); setPage(1); }}
              style={selectStyle}
            >
              <option value="">All Specializations ({availableSpecs.length})</option>
              {availableSpecs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              style={selectStyle}
            >
              <option value="name">Name (A–Z)</option>
              <option value="name-z">Name (Z–A)</option>
              <option value="verified">Verified First</option>
              <option value="newest">Recently Added</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  ...DM, background: "rgba(239,68,68,.08)", color: RED,
                  fontSize: 11, fontWeight: 600, padding: "10px 16px",
                  border: "1px solid rgba(239,68,68,.2)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.5)" }}>
            {loading
              ? "Loading..."
              : <><strong style={{ color: GOLD }}>{total}</strong> lawyer{total !== 1 ? "s" : ""} found</>
            }
          </p>
        </div>

        {/* ══ LAWYERS GRID ══ */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 16,
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...CARD, padding: 20, height: 160 }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 10, width: "50%" }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 36, width: "100%" }} />
              </div>
            ))}
          </div>
        ) : lawyers.length === 0 ? (
          <div style={{ ...CARD, padding: 80, textAlign: "center" }}>
            <p style={{ ...SERIF, fontWeight: 700, fontSize: 22, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>
              No lawyers found
            </p>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.4)", maxWidth: 400, margin: "0 auto 24px" }}>
              Try adjusting your filters or search terms.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  ...DM, background: GOLD, color: "#111",
                  fontSize: 12, fontWeight: 600,
                  padding: "11px 24px", border: "none", cursor: "pointer",
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 16,
            }}>
              {lawyers.map((l, idx) => (
                <LawyerCard
                  key={l._id}
                  lawyer={l}
                  idx={idx}
                  onViewProfile={handleViewProfile}
                  activeSpecFilter={specFilter}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "center",
                alignItems: "center", gap: 14, marginTop: 12,
              }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    ...DM, background: "rgba(20,15,10,0.55)",
                    color: page === 1 ? "rgba(255,255,255,.2)" : "#fff",
                    fontSize: 12, fontWeight: 600,
                    padding: "10px 18px",
                    border: "1px solid rgba(201,168,76,.25)",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Prev
                </button>
                <div style={{
                  ...DM, fontSize: 12, color: "rgba(255,255,255,.6)",
                  padding: "10px 18px", background: "rgba(20,15,10,0.55)",
                  border: "1px solid rgba(201,168,76,.25)",
                }}>
                  Page <strong style={{ color: GOLD }}>{page}</strong> of{" "}
                  <strong style={{ color: GOLD }}>{totalPages}</strong>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    ...DM, background: "rgba(20,15,10,0.55)",
                    color: page === totalPages ? "rgba(255,255,255,.2)" : "#fff",
                    fontSize: 12, fontWeight: 600,
                    padding: "10px 18px",
                    border: "1px solid rgba(201,168,76,.25)",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ PROFILE MODAL ══ */}
        {showProfile && (
          <ProfileModal
            loading={profileLoading}
            lawyer={selectedLawyer}
            copiedField={copiedField}
            onClose={() => { setShowProfile(false); setSelectedLawyer(null); }}
            onContact={handleContactLawyer}
            onCopy={handleCopy}
          />
        )}
      </div>

      {/* ══ EMAIL MODAL ══ */}
      {showEmail && emailLawyer && (
        <EmailModal
          lawyer={emailLawyer}
          onClose={() => { setShowEmail(false); setEmailLawyer(null); }}
        />
      )}
    </div>
  );
}

// ── Shared select style ───────────────────────────────────────────
const selectStyle: CSSProperties = {
  fontFamily:   "'DM Sans', sans-serif",
  background:   "rgba(20,15,10,0.55)",
  border:       "1px solid rgba(201,168,76,0.25)",
  borderRadius: 0,
  padding:      "10px 16px",
  color:        "rgba(255,255,255,.75)",
  fontSize:     12,
  outline:      "none",
  cursor:       "pointer",
};