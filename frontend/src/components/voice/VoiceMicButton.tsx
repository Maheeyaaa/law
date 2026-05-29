// src/components/voice/VoiceMicButton.tsx

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVoice } from "../../context/VoiceContext";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";
import { voiceChat } from "../../services/api";
import { matchCommand } from "../../utils/voiceCommands";
import { useNavigate } from "react-router-dom";

const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

const VoiceMicButton: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isVoiceEnabled,
    isListening,
    isSpeaking,
    voicePromptDone,
    messages,
    speak,
    sessionId,
    setSessionId,
    addMessage,
    clearMessages,
    stopSpeaking,
    enableVoice,
    lastSpoken,
    disableVoice,
  } = useVoice();

  const { startListening, stopListening } = useVoiceAssistant();

  const [open, setOpen] = useState(false);
  const [manualListening, setManualListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only show on citizen pages
  const isCitizenRoute = location.pathname.startsWith("/citizen");
  if (!isCitizenRoute) return null;

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show tooltip on first visit after voice prompt
  useEffect(() => {
    if (voicePromptDone && !isVoiceEnabled) {
      setShowTooltip(true);
      const t = setTimeout(() => setShowTooltip(false), 4000);
      return () => clearTimeout(t);
    }
  }, [voicePromptDone]);

  // Manual listening - one shot
  const handleManualListen = () => {
    if (!SpeechRecognition) {
      speak("Your browser does not support voice recognition. Please use Chrome browser.");
      return;
    }

    if (manualListening) {
      recognitionRef.current?.stop();
      setManualListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setManualListening(true);

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setManualListening(false);
      await handleUserSpeech(text);
    };

    recognition.onerror = () => {
      setManualListening(false);
      speak("Sorry, I could not hear you clearly. Please tap the microphone and try again.");
    };

    recognition.onend = () => setManualListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Process speech - check commands first then AI
  const handleUserSpeech = async (text: string) => {
    const lower = text.toLowerCase();

    // Check repeat
    if (
      lower.includes("repeat") ||
      lower.includes("say again") ||
      lower.includes("again") ||
      lower.includes("pardon")
    ) {
      if (lastSpoken) {
        await speak(lastSpoken);
      } else {
        await speak("How can I help you?");
      }
      return;
    }

    // Check navigation commands
    const command = matchCommand(text);
    if (command) {
      await speak(command.response);
      if (command.action === "EXIT_VOICE") {
        disableVoice();
      } else if (command.route) {
        navigate(command.route);
        setOpen(false);
      }
      return;
    }

    // Send to AI
    await handleAskAI(text);
  };

  const handleAskAI = async (text: string) => {
    try {
      setLoading(true);
      addMessage({ role: "user", text });

      await speak("Let me find that for you. Please wait a moment.");

      const res = await voiceChat({
        message: text,
        sessionId: sessionId || undefined,
      });

      const { reply, sessionId: newSessionId } = res.data;

      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }

      addMessage({ role: "assistant", text: reply });
      await speak(reply);

      // After response - prompt for more
      await speak(
        "I hope that was helpful. Tap the microphone if you have more questions."
      );
    } catch {
      const errMsg =
        "Sorry, I had some trouble with that. Please try again by tapping the microphone.";
      addMessage({ role: "assistant", text: errMsg });
      await speak(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Voice enabled mode - show status pill + mic
  if (isVoiceEnabled) {
    return (
      <>
        <style>{`
          @keyframes listeningPulse {
            0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239,68,68,0); }
          }
          @keyframes speakingPulse {
            0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234,179,8,0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(234,179,8,0); }
          }
          @keyframes idlePulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(30,95,255,0.4); }
            50% { box-shadow: 0 0 0 8px rgba(30,95,255,0); }
          }
        `}</style>

        {/* Status pill */}
        <div
          style={{
            position: "fixed",
            bottom: 82,
            right: 20,
            zIndex: 9998,
            background: "rgba(4,8,26,0.95)",
            border: `1px solid ${
              isListening
                ? "rgba(239,68,68,0.5)"
                : isSpeaking
                ? "rgba(234,179,8,0.5)"
                : "rgba(30,95,255,0.3)"
            }`,
            borderRadius: 20,
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isListening
                ? "#ef4444"
                : isSpeaking
                ? "#eab308"
                : "#1e5fff",
              display: "inline-block",
              animation: isListening || isSpeaking
                ? "none"
                : "idlePulse 2s infinite",
            }}
          />
          <span
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 11,
              color: isListening
                ? "#ef4444"
                : isSpeaking
                ? "#eab308"
                : "rgba(255,255,255,0.6)",
            }}
          >
            {isListening
              ? "Listening..."
              : isSpeaking
              ? "Speaking..."
              : "Voice Active"}
          </span>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 10,
                padding: "0 0 0 4px",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              ⏹
            </button>
          )}
        </div>

        {/* Voice mic button in enabled mode */}
        <button
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: isListening
              ? "#ef4444"
              : isSpeaking
              ? "#eab308"
              : "#1e5fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 9999,
            fontSize: 22,
            transition: "all 0.2s ease",
            animation: isListening
              ? "listeningPulse 1s infinite"
              : isSpeaking
              ? "speakingPulse 1s infinite"
              : "idlePulse 2s infinite",
          }}
        >
          {isListening ? "⏹" : isSpeaking ? "🔊" : "🎙️"}
        </button>
      </>
    );
  }

  // Manual mode (said NO) - only show after prompt done
  if (!voicePromptDone) return null;

  return (
    <>
      <style>{`
        @keyframes micPulse {
          0%,100% { box-shadow: 0 8px 24px rgba(30,95,255,0.4); }
          50% { box-shadow: 0 8px 32px rgba(30,95,255,0.7); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes dotBounce {
          0%,80%,100% { transform:scale(0.8); opacity:0.5; }
          40% { transform:scale(1.2); opacity:1; }
        }
        @keyframes listeningRing {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          100% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }
        }
      `}</style>

      {/* Tooltip - shows briefly after NO response */}
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            bottom: 82,
            right: 20,
            background: "rgba(4,8,26,0.95)",
            border: "1px solid rgba(30,95,255,0.3)",
            borderRadius: 12,
            padding: "10px 14px",
            zIndex: 9999,
            animation: "fadeUp 0.3s ease",
            maxWidth: 200,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            👆 Tap this mic button anytime to ask a legal question or get help navigating the app.
          </p>
        </div>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 340,
            maxHeight: 500,
            background: "rgba(4,8,26,0.97)",
            border: "1px solid rgba(30,95,255,0.3)",
            borderRadius: 20,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeUp 0.2s ease",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(30,95,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#1e5fff,#4d8aff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                ⚖️
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  LegalMind Assistant
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    margin: 0,
                  }}
                >
                  {manualListening
                    ? "🎙️ Listening..."
                    : isSpeaking
                    ? "🔊 Speaking..."
                    : "Tap mic to speak"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* Enable always-on */}
              <button
                onClick={() => {
                  enableVoice();
                  setOpen(false);
                  speak(
                    "Voice mode is now always on. I will guide you as you navigate. Just tap the microphone anytime to speak."
                  );
                  setTimeout(() => startListening(), 2000);
                }}
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  background: "rgba(30,95,255,0.15)",
                  border: "1px solid rgba(30,95,255,0.3)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: 10,
                  color: "#4d8aff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                🎙️ Always On
              </button>
              <button
                onClick={clearMessages}
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(30,95,255,0.1)",
                    border: "1px solid rgba(30,95,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  🎙️
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                      margin: "0 0 6px 0",
                      fontWeight: 600,
                    }}
                  >
                    How can I help you?
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    Tap the microphone below and speak. You can ask legal
                    questions or say things like "Find me a lawyer" or "Track
                    my case"
                  </p>
                </div>

                {/* Quick suggestion chips */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                >
                  {[
                    "I got a notice",
                    "Find me a lawyer",
                    "Track my case",
                    "I have a question",
                    "Check a scam",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAskAI(suggestion)}
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        background: "rgba(30,95,255,0.1)",
                        border: "1px solid rgba(30,95,255,0.25)",
                        borderRadius: 20,
                        padding: "5px 12px",
                        fontSize: 11,
                        color: "#4d8aff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 4,
                  animation: "fadeUp 0.2s ease",
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.2)",
                    paddingLeft: msg.role === "assistant" ? 4 : 0,
                    paddingRight: msg.role === "user" ? 4 : 0,
                  }}
                >
                  {msg.role === "user" ? "You" : "LegalMind"}
                </span>
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    background:
                      msg.role === "user"
                        ? "#1e5fff"
                        : "rgba(255,255,255,0.05)",
                    border:
                      msg.role === "assistant"
                        ? "1px solid rgba(30,95,255,0.15)"
                        : "none",
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 12,
                    color:
                      msg.role === "user"
                        ? "#fff"
                        : "rgba(255,255,255,0.8)",
                    lineHeight: 1.6,
                  }}
                >
                  {msg.text}
                </div>

                {/* Repeat button for assistant messages */}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => speak(msg.text)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 10,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                      paddingLeft: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    🔊 Repeat
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#1e5fff",
                        animation: "dotBounce 1.2s infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  Looking that up...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom bar */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(30,95,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                margin: 0,
              }}
            >
              General legal information only. Not legal advice.
            </p>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ⏹ Stop
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Mic Button */}
      <button
        onClick={() => {
          setOpen(true);
          handleManualListen();
        }}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: manualListening ? "#ef4444" : "#1e5fff",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9998,
          fontSize: 22,
          transition: "all 0.2s ease",
          animation: manualListening
            ? "listeningRing 1s infinite"
            : "micPulse 2s infinite",
        }}
      >
        {manualListening ? "⏹" : "🎙️"}
      </button>
    </>
  );
};

export default VoiceMicButton;