// src/hooks/useVoiceAssistant.ts

import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVoice, Language } from "../context/VoiceContext";
import { matchCommand } from "../utils/voiceCommands";
import { t } from "../utils/voiceTranslations";
import { updateLanguage as updateLanguageAPI } from "../services/api";

// ── Action to route mapping ────────────────────────
const ACTION_ROUTE_MAP: Record<string, string> = {
  NOTICE: "/citizen/ai-assistant",
  QUESTION: "/citizen/ai-assistant",
  SCAM: "/citizen/ai-assistant",
  LAWYER: "/citizen/find-lawyer",
  CASE: "/citizen/track",
  CASES: "/citizen/cases",
  DOCUMENTS: "/citizen/documents",
  NOTIFICATIONS: "/citizen/notifications",
  HELP: "/citizen/help",
  ACCOUNT: "/citizen/account",
  HOME: "/citizen",
};

// ── Already on page messages ───────────────────────
const ALREADY_HERE: Record<Language, string> = {
  english: "You are already on this page.",
  hindi: "आप पहले से इस पेज पर हैं।",
  telugu: "మీరు ఇప్పటికే ఈ పేజీలో ఉన్నారు.",
};

// ── Language change messages ───────────────────────
const LANGUAGE_ASK: Record<Language, string> = {
  english: "Which language would you like? Say English, Hindi, or Telugu.",
  hindi: "कौन सी भाषा चाहिए? English, Hindi, या Telugu बोलें।",
  telugu: "ఏ భాష కావాలి? English, Hindi, లేదా Telugu అని చెప్పండి.",
};

// 🆕 Speak switching message in CURRENT language first
// So user always hears confirmation regardless of new language TTS support
const LANGUAGE_SWITCHING: Record<Language, Record<Language, string>> = {
  english: {
    english: "Switching language to English.",
    hindi: "Switching language to Hindi.",
    telugu: "Switching language to Telugu.",
  },
  hindi: {
    english: "भाषा English में बदली जा रही है।",
    hindi: "भाषा Hindi में बदली जा रही है।",
    telugu: "भाषा Telugu में बदली जा रही है।",
  },
  telugu: {
    english: "భాషను English కు మారుస్తున్నాను.",
    hindi: "భాషను Hindi కు మారుస్తున్నాను.",
    telugu: "భాషను Telugu కు మారుస్తున్నాను.",
  },
};

const LANGUAGE_CHANGED: Record<Language, string> = {
  english: "Language changed to English.",
  hindi: "भाषा हिंदी में बदल दी गई।",
  telugu: "భాష తెలుగుకు మార్చబడింది.",
};

const LANGUAGE_NOT_UNDERSTOOD: Record<Language, string> = {
  english: "Sorry, I did not understand. Please say English, Hindi, or Telugu.",
  hindi: "माफ करें, समझ नहीं आया। English, Hindi, या Telugu बोलें।",
  telugu: "క్షమించండి, అర్థం కాలేదు. English, Hindi, లేదా Telugu అనండి.",
};

const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

// ── Page context messages ──────────────────────────
const PAGE_CONTEXT: Record<string, Record<Language, string>> = {
  "/citizen": {
    english: "You are on the dashboard.",
    hindi: "आप डैशबोर्ड पर हैं।",
    telugu: "మీరు డాష్‌బోర్డ్‌లో ఉన్నారు.",
  },
  "/citizen/find-lawyer": {
    english: "You are on the Find Lawyers page. You can search and filter lawyers here.",
    hindi: "आप वकील ढूंढने के पेज पर हैं। यहां वकीलों को खोज और फ़िल्टर कर सकते हैं।",
    telugu: "మీరు న్యాయవాదులు కనుగొను పేజీలో ఉన్నారు. ఇక్కడ న్యాయవాదులను వెతకవచ్చు.",
  },
  "/citizen/ai-assistant": {
    english: "You are on the AI Legal Assistant page. You can type or ask legal questions here.",
    hindi: "आप AI कानूनी सहायक पेज पर हैं। यहां कानूनी सवाल पूछ सकते हैं।",
    telugu: "మీరు AI న్యాయ సహాయకుడి పేజీలో ఉన్నారు. ఇక్కడ న్యాయ ప్రశ్నలు అడగవచ్చు.",
  },
  "/citizen/track": {
    english: "You are on the Case Tracking page. Enter your case ID to check progress.",
    hindi: "आप केस ट्रैकिंग पेज पर हैं। प्रगति जानने के लिए केस ID डालें।",
    telugu: "మీరు కేసు ట్రాకింగ్ పేజీలో ఉన్నారు. ప్రగతి తెలుసుకోవడానికి కేసు ID నమోదు చేయండి.",
  },
  "/citizen/cases": {
    english: "You are on the My Cases page. You can see all your registered cases here.",
    hindi: "आप मेरे केस पेज पर हैं। यहां आपके सभी दर्ज केस देख सकते हैं।",
    telugu: "మీరు నా కేసులు పేజీలో ఉన్నారు. మీ నమోదిత కేసులు ఇక్కడ చూడవచ్చు.",
  },
  "/citizen/documents": {
    english: "You are on the Documents page. You can upload and view documents here.",
    hindi: "आप दस्तावेज़ पेज पर हैं। यहां दस्तावेज़ अपलोड और देख सकते हैं।",
    telugu: "మీరు పత్రాల పేజీలో ఉన్నారు. ఇక్కడ పత్రాలను అప్‌లోడ్ చేయవచ్చు.",
  },
  "/citizen/notifications": {
    english: "You are on the Notifications page. You can see your latest updates here.",
    hindi: "आप सूचनाएं पेज पर हैं। यहां आपके अपडेट देख सकते हैं।",
    telugu: "మీరు నోటిఫికేషన్ పేజీలో ఉన్నారు. మీ తాజా అప్‌డేట్‌లు ఇక్కడ చూడవచ్చు.",
  },
  "/citizen/help": {
    english: "You are on the Help Center page. You can contact support from here.",
    hindi: "आप सहायता केंद्र पर हैं। यहां से सपोर्ट से संपर्क कर सकते हैं।",
    telugu: "మీరు సహాయ కేంద్రంలో ఉన్నారు. ఇక్కడ నుండి సపోర్ట్ సంప్రదించవచ్చు.",
  },
  "/citizen/account": {
    english: "You are on the Account Settings page. You can update your details here.",
    hindi: "आप खाता सेटिंग्स पर हैं। यहां अपनी जानकारी बदल सकते हैं।",
    telugu: "మీరు ఖాతా సెట్టింగ్స్ పేజీలో ఉన్నారు. మీ వివరాలు ఇక్కడ మార్చవచ్చు.",
  },
};

const getPageContext = (pathname: string, lang: Language): string => {
  const context = PAGE_CONTEXT[pathname];
  if (context) return context[lang] || context.english;
  const defaults: Record<Language, string> = {
    english: "You can say a command to navigate or say menu for options.",
    hindi: "नेविगेट करने के लिए कमांड बोलें या विकल्प के लिए मेनू बोलें।",
    telugu: "నావిగేట్ చేయడానికి కమాండ్ చెప్పండి లేదా ఎంపికల కోసం మెనూ అనండి.",
  };
  return defaults[lang];
};

const getNavPrompt = (lang: Language): string => {
  const prompts: Record<Language, string> = {
    english: "Say a command to navigate or say menu for all options.",
    hindi: "नेविगेट करने के लिए कमांड बोलें या सभी विकल्पों के लिए मेनू बोलें।",
    telugu: "నావిగేట్ చేయడానికి కమాండ్ చెప్పండి లేదా అన్ని ఎంపికల కోసం మెనూ అనండి.",
  };
  return prompts[lang];
};

export const useVoiceAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isVoiceEnabled,
    setIsListening,
    setTranscript,
    speak,
    disableVoice,
    lastSpoken,
    language,
    setLanguage,
  } = useVoice();

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const postSpeechCooldownRef = useRef(false);
  const voiceEnabledRef = useRef(isVoiceEnabled);
  const languageRef = useRef(language);
  const isBrowserSupported = !!SpeechRecognition;
  const pendingActionRef = useRef<string | null>(null);
  const pendingLanguageChangeRef = useRef(false);

  useEffect(() => {
    voiceEnabledRef.current = isVoiceEnabled;
  }, [isVoiceEnabled]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // ── Safe speak ─────────────────────────────────────
  const safeSpeak = useCallback(
    async (text: string, lang: Language) => {
      isSpeakingRef.current = true;
      postSpeechCooldownRef.current = true;
      try {
        await speak(text, lang);
      } finally {
        isSpeakingRef.current = false;
        setTimeout(() => {
          postSpeechCooldownRef.current = false;
        }, 1000);
      }
    },
    [speak]
  );

  // ── Stop listening ─────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
  }, [setIsListening]);

  const startListeningRef = useRef<() => void>(() => {});

  const canListen = useCallback(() => {
    return (
      voiceEnabledRef.current &&
      !isListeningRef.current &&
      !isSpeakingRef.current &&
      !isProcessingRef.current &&
      !postSpeechCooldownRef.current
    );
  }, []);

  // ── Confirmation messages ──────────────────────────
  const getConfirmationMessage = useCallback(
    (action: string, lang: Language): string => {
      const messages: Record<Language, Record<string, string>> = {
        english: {
          NOTICE: "You want help with a legal notice. Say yes to confirm or no to cancel.",
          LAWYER: "You want to find a lawyer. Say yes to confirm or no to cancel.",
          CASE: "You want to track your case. Say yes to confirm or no to cancel.",
          QUESTION: "You want to ask a legal question. Say yes to confirm or no to cancel.",
          SCAM: "You want to check for fraud or scam. Say yes to confirm or no to cancel.",
          HOME: "You want to go to home page. Say yes to confirm or no to cancel.",
          DOCUMENTS: "You want to open documents. Say yes to confirm or no to cancel.",
          NOTIFICATIONS: "You want to open notifications. Say yes to confirm or no to cancel.",
          HELP: "You want to open help center. Say yes to confirm or no to cancel.",
          ACCOUNT: "You want to open account settings. Say yes to confirm or no to cancel.",
          CASES: "You want to see all your cases. Say yes to confirm or no to cancel.",
        },
        hindi: {
          NOTICE: "आप कानूनी नोटिस की मदद चाहते हैं। हां या ना बोलें।",
          LAWYER: "आप वकील ढूंढना चाहते हैं। हां या ना बोलें।",
          CASE: "आप केस ट्रैक करना चाहते हैं। हां या ना बोलें।",
          QUESTION: "आप कानूनी सवाल पूछना चाहते हैं। हां या ना बोलें।",
          SCAM: "आप धोखाधड़ी जांचना चाहते हैं। हां या ना बोलें।",
          HOME: "आप होम पेज जाना चाहते हैं। हां या ना बोलें।",
          DOCUMENTS: "आप दस्तावेज़ खोलना चाहते हैं। हां या ना बोलें।",
          NOTIFICATIONS: "आप सूचनाएं खोलना चाहते हैं। हां या ना बोलें।",
          HELP: "आप सहायता केंद्र खोलना चाहते हैं। हां या ना बोलें।",
          ACCOUNT: "आप खाता सेटिंग्स खोलना चाहते हैं। हां या ना बोलें।",
          CASES: "आप अपने सभी केस देखना चाहते हैं। हां या ना बोलें।",
        },
        telugu: {
          NOTICE: "మీరు న్యాయ నోటీసు సహాయం కోరుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          LAWYER: "మీరు న్యాయవాదిని కనుగొనాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          CASE: "మీరు కేసు ట్రాక్ చేయాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          QUESTION: "మీరు న్యాయ ప్రశ్న అడగాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          SCAM: "మీరు మోసం తనిఖీ చేయాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          HOME: "మీరు హోమ్ పేజీకి వెళ్ళాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          DOCUMENTS: "మీరు పత్రాలు తెరవాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          NOTIFICATIONS: "మీరు నోటిఫికేషన్లు తెరవాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          HELP: "మీరు సహాయ కేంద్రం తెరవాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          ACCOUNT: "మీరు ఖాతా సెట్టింగ్స్ తెరవాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
          CASES: "మీరు మీ అన్ని కేసులు చూడాలనుకుంటున్నారు. అవును లేదా కాదు అని చెప్పండి.",
        },
      };
      return messages[lang]?.[action] || messages.english[action] || "";
    },
    []
  );

  const isYes = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const yesWords = [
      "yes", "yeah", "yep", "sure", "ok", "okay", "confirm",
      "haan", "ha", "ji", "han", "theek", "avunu",
    ];
    return yesWords.some((w) => lower.includes(w));
  };

  const isNo = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const noWords = [
      "no", "nah", "nope", "cancel", "stop",
      "nahi", "na", "mat", "nako", "kadu", "vaddu",
    ];
    return noWords.some((w) => lower.includes(w));
  };

  const getCancelledMessage = useCallback(
    (lang: Language): string => {
      const messages: Record<Language, string> = {
        english: "Okay, cancelled. Tap the microphone when ready.",
        hindi: "ठीक है, रद्द किया। तैयार होने पर माइक्रोफोन दबाएं।",
        telugu: "సరే, రద్దు చేయబడింది. మైక్రోఫోన్ నొక్కండి.",
      };
      return messages[lang];
    },
    []
  );

  // ── Execute confirmed action ───────────────────────
  const executeAction = useCallback(
    async (action: string) => {
      const l = languageRef.current || "english";
      const targetRoute = ACTION_ROUTE_MAP[action];

      if (targetRoute && location.pathname === targetRoute) {
        await safeSpeak(ALREADY_HERE[l], l);
        return;
      }

      switch (action) {
        case "HOME":
          await safeSpeak(t("opening_home", l), l);
          navigate("/citizen");
          break;
        case "NOTICE":
          await safeSpeak(t("guide_notice", l), l);
          navigate("/citizen/ai-assistant");
          break;
        case "LAWYER":
          await safeSpeak(t("opening_lawyers", l), l);
          navigate("/citizen/find-lawyer");
          break;
        case "CASE":
          await safeSpeak(t("opening_tracker", l), l);
          navigate("/citizen/track");
          break;
        case "QUESTION":
          await safeSpeak(t("opening_ai", l), l);
          navigate("/citizen/ai-assistant");
          break;
        case "SCAM":
          await safeSpeak(t("opening_ai", l), l);
          navigate("/citizen/ai-assistant");
          break;
        case "DOCUMENTS":
          await safeSpeak(t("opening_documents", l), l);
          navigate("/citizen/documents");
          break;
        case "NOTIFICATIONS":
          await safeSpeak(t("opening_notifications", l), l);
          navigate("/citizen/notifications");
          break;
        case "HELP":
          await safeSpeak(t("opening_help", l), l);
          navigate("/citizen/help");
          break;
        case "ACCOUNT":
          await safeSpeak(t("opening_account", l), l);
          navigate("/citizen/account");
          break;
        case "CASES":
          await safeSpeak(t("opening_cases", l), l);
          navigate("/citizen/cases");
          break;
      }
    },
    [safeSpeak, navigate, location.pathname]
  );

  // ── Process command ────────────────────────────────
  const processAction = useCallback(
    async (action: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const l = languageRef.current || "english";
      stopListening();

      try {
        switch (action) {
          case "SHOW_MENU":
            isProcessingRef.current = false;
            await safeSpeak(t("main_menu", l), l);
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
            return;

          case "REPEAT":
            if (lastSpoken) {
              await safeSpeak(lastSpoken, l);
            } else {
              await safeSpeak(t("repeat_nothing", l), l);
            }
            isProcessingRef.current = false;
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
            return;

          case "EXIT_VOICE":
            await safeSpeak(t("voice_disabled", l), l);
            disableVoice();
            isProcessingRef.current = false;
            return;

          case "LOGOUT":
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
            isProcessingRef.current = false;
            return;

          case "CHANGE_LANGUAGE":
            pendingLanguageChangeRef.current = true;
            await safeSpeak(LANGUAGE_ASK[l], l);
            isProcessingRef.current = false;
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
            return;
        }

        const targetRoute = ACTION_ROUTE_MAP[action];
        if (targetRoute && location.pathname === targetRoute) {
          await safeSpeak(ALREADY_HERE[l], l);
          isProcessingRef.current = false;
          return;
        }

        const confirmMsg = getConfirmationMessage(action, l);
        if (confirmMsg) {
          pendingActionRef.current = action;
          await safeSpeak(confirmMsg, l);
          isProcessingRef.current = false;
          setTimeout(() => {
            if (canListen()) startListeningRef.current();
          }, 1200);
        }
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    },
    [
      safeSpeak, navigate, disableVoice, lastSpoken,
      stopListening, canListen, getConfirmationMessage,
      location.pathname,
    ]
  );

  // ── Start listening ────────────────────────────────
  const startListening = useCallback(() => {
    if (!isBrowserSupported) return;
    if (!canListen()) return;

    const overallTimeout = setTimeout(() => {
      if (isListeningRef.current) {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
          recognitionRef.current = null;
        }
        isListeningRef.current = false;
        setIsListening(false);
        pendingActionRef.current = null;
        pendingLanguageChangeRef.current = false;

        const l = languageRef.current || "english";
        safeSpeak(t("could_not_hear", l), l);
      }
    }, 10000);

    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        console.log("🎤 Listening...");
      };

      recognition.onresult = async (event: any) => {
        clearTimeout(overallTimeout);

        const alternatives = Array.from(event.results[0]).map(
          (r: any) => r.transcript
        );
        console.log("✅ Heard:", alternatives);

        isListeningRef.current = false;
        setIsListening(false);

        const spokenText = (alternatives[0] as string) || "";
        setTranscript(spokenText);

        await new Promise((r) => setTimeout(r, 300));

        const l = languageRef.current || "english";

        // ── Language selection ─────────────────────
        if (pendingLanguageChangeRef.current) {
          pendingLanguageChangeRef.current = false;

          let newLang: Language | null = null;

          for (const alt of alternatives) {
            const altLower = (alt as string).toLowerCase().trim();

            if (
              altLower.includes("english") ||
              altLower.includes("inglish")
            ) {
              newLang = "english";
              break;
            } else if (
              altLower.includes("hindi") ||
              altLower.includes("hind")
            ) {
              newLang = "hindi";
              break;
            } else if (
              altLower.includes("telugu") ||
              altLower.includes("telug") ||
              altLower.includes("telgu") ||
              altLower.includes("talugu")
            ) {
              newLang = "telugu";
              break;
            }
          }

          if (newLang) {
            const currentLang = languageRef.current || "english";

            // 🆕 Step 1: Say "Switching to X" in CURRENT language
            // User always hears this regardless of new language support
            await safeSpeak(
              LANGUAGE_SWITCHING[currentLang][newLang],
              currentLang
            );

            // 🆕 Step 2: Switch language internally
            setLanguage(newLang);
            languageRef.current = newLang;

            // 🆕 Step 3: Save to backend
            try {
              await updateLanguageAPI(newLang);
              console.log("✅ Language saved to backend:", newLang);
            } catch (e) {
              console.error("❌ Failed to save language:", e);
            }

            // 🆕 Step 4: Try confirmation in NEW language
            // If browser supports it user hears it, otherwise silent is ok
            // because step 1 already told them
            await safeSpeak(LANGUAGE_CHANGED[newLang], newLang);

          } else {
            pendingLanguageChangeRef.current = true;
            await safeSpeak(LANGUAGE_NOT_UNDERSTOOD[l], l);
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
          }
          return;
        }

        // ── Yes/No confirmation ────────────────────
        if (pendingActionRef.current) {
          const action = pendingActionRef.current;
          pendingActionRef.current = null;

          if (isYes(spokenText)) {
            await executeAction(action);
          } else if (isNo(spokenText)) {
            await safeSpeak(getCancelledMessage(l), l);
          } else {
            await safeSpeak(t("did_not_understand_yes_no", l), l);
            pendingActionRef.current = action;
            setTimeout(() => {
              if (canListen()) startListeningRef.current();
            }, 1200);
          }
          return;
        }

        // ── Normal command matching ────────────────
        let matchedCommand = null;
        let matchedTranscript = spokenText;

        for (const alt of alternatives) {
          const cmd = matchCommand(alt as string);
          if (cmd) {
            matchedCommand = cmd;
            matchedTranscript = alt as string;
            break;
          }
        }

        setTranscript(matchedTranscript);

        if (matchedCommand) {
          await processAction(matchedCommand.action || "");
        } else {
          const currentPath = location.pathname;
          const pageContext = getPageContext(currentPath, l);
          const navPrompt = getNavPrompt(l);

          await safeSpeak(t("not_understood", l), l);
          await safeSpeak(`${pageContext} ${navPrompt}`, l);
          setTimeout(() => {
            if (canListen()) startListeningRef.current();
          }, 1200);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("⚠️ Error:", event.error);

        if (event.error === "no-speech") {
          isListeningRef.current = false;
          setIsListening(false);
          recognitionRef.current = null;

          setTimeout(() => {
            if (isListeningRef.current) return;
            try {
              const newRecognition = createRecognition();
              recognitionRef.current = newRecognition;
              newRecognition.start();
            } catch (e) {
              clearTimeout(overallTimeout);
            }
          }, 300);
          return;
        }

        clearTimeout(overallTimeout);
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
        pendingActionRef.current = null;
        pendingLanguageChangeRef.current = false;
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
      };

      return recognition;
    };

    const recognition = createRecognition();
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      clearTimeout(overallTimeout);
      console.error("Start error:", e);
      isListeningRef.current = false;
    }
  }, [
    isBrowserSupported,
    canListen,
    safeSpeak,
    setIsListening,
    setTranscript,
    processAction,
    executeAction,
    getCancelledMessage,
    location.pathname,
    setLanguage,
  ]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isVoiceEnabled) {
      stopListening();
      pendingActionRef.current = null;
      pendingLanguageChangeRef.current = false;
    }
  }, [isVoiceEnabled, stopListening]);

  return { startListening, stopListening, isBrowserSupported };
};