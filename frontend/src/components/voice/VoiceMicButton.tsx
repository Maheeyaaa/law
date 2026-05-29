// src/components/voice/VoiceMicButton.tsx

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useVoice } from "../../context/VoiceContext";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";

const VoiceMicButton: React.FC = () => {
  const location = useLocation();

  const {
    isVoiceEnabled,
    isListening,
    isSpeaking,
    voicePromptDone,
    stopSpeaking,
    enableVoice,
  } = useVoice();

  const { startListening, stopListening, isBrowserSupported } =
    useVoiceAssistant();

  const [showTooltip, setShowTooltip] = useState(false);

  const isCitizenRoute = location.pathname.startsWith("/citizen");
  
  useEffect(() => {
    if (voicePromptDone && !isVoiceEnabled) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [voicePromptDone, isVoiceEnabled]);

  if (!isCitizenRoute) return null;
  if (!isBrowserSupported) return null;
  if (!voicePromptDone && !isVoiceEnabled) return null;

  const handleStop = () => {
    stopSpeaking();
    stopListening();
  };

  const handleMicTap = () => {
    if (isSpeaking || isListening) {
      handleStop();
      return;
    }

    if (!isVoiceEnabled) {
      enableVoice();
    }

    // 🆕 Just listen — no menu speaking
    setTimeout(() => {
      startListening();
    }, 100);
  };

  return (
    <>
      <style>{`
        @keyframes vPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes vRing { 0%{box-shadow:0 0 0 0 rgba(30,95,255,0.5)} 100%{box-shadow:0 0 0 12px rgba(30,95,255,0)} }
        @keyframes vListen { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 100%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {showTooltip && !isVoiceEnabled && (
        <div style={{
          position:"fixed", bottom:82, right:20, background:"rgba(4,8,26,0.95)",
          border:"1px solid rgba(30,95,255,0.3)", borderRadius:12, padding:"10px 14px",
          zIndex:9999, animation:"fadeUp 0.3s ease", maxWidth:220,
          boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"rgba(255,255,255,0.8)", margin:0, lineHeight:1.5 }}>
            👆 Tap for voice help
          </p>
        </div>
      )}

      {isVoiceEnabled && (
        <div style={{
          position:"fixed", bottom:82, right:20, zIndex:9998, background:"rgba(4,8,26,0.95)",
          border:`1px solid ${isListening?"rgba(239,68,68,0.4)":isSpeaking?"rgba(234,179,8,0.4)":"rgba(30,95,255,0.3)"}`,
          borderRadius:20, padding:"6px 14px", display:"flex", alignItems:"center", gap:8,
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%",
            background:isListening?"#ef4444":isSpeaking?"#eab308":"#1e5fff",
            animation:"vPulse 1.5s infinite",
          }}/>
          <span style={{
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:isListening?"#ef4444":isSpeaking?"#eab308":"rgba(255,255,255,0.6)",
          }}>
            {isListening?"Listening...":isSpeaking?"Speaking...":"Voice Ready"}
          </span>
          {(isSpeaking||isListening) && (
            <button onClick={handleStop} style={{
              background:"rgba(255,255,255,0.08)", border:"none", borderRadius:6,
              padding:"2px 8px", color:"rgba(255,255,255,0.5)", cursor:"pointer",
              fontSize:10, fontFamily:"'DM Sans',sans-serif",
            }}>⏹ Stop</button>
          )}
        </div>
      )}

      <button onClick={handleMicTap} style={{
        position:"fixed", bottom:20, right:20, width:54, height:54, borderRadius:"50%",
        background:isListening?"#ef4444":isSpeaking?"#eab308":"#1e5fff",
        border:"none", display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", zIndex:9999, fontSize:22, transition:"all 0.2s ease",
        animation:isListening?"vListen 1s infinite":"vRing 2s infinite",
      }}>
        {isListening||isSpeaking?"⏹":"🎙️"}
      </button>
    </>
  );
};

export default VoiceMicButton;