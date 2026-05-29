// src/utils/voiceTranslations.ts

import { Language } from "../context/VoiceContext";

export type TranslationKey =
  | "welcome_choose_language"
  | "language_not_understood"
  | "language_selected"
  | "welcome_voice_prompt"
  | "returning_voice_prompt"
  | "no_response"
  | "no_response_detected"
  | "did_not_understand_yes_no"
  | "could_not_hear"
  | "voice_disabled"
  | "main_menu"
  | "opening_lawyers"
  | "opening_tracker"
  | "opening_ai"
  | "opening_documents"
  | "opening_notifications"
  | "opening_help"
  | "opening_account"
  | "opening_home"
  | "opening_cases"
  | "guide_notice"
  | "not_understood"
  | "repeat_nothing"
  | "say_menu"
  | "yes_response";

const translations: Record<Language, Record<TranslationKey, string>> = {
  english: {
    welcome_choose_language:
      "Welcome to LegalMind! Please choose your language. For English, say English. తెలుగు కోసం తెలుగు అనండి. हिंदी के लिए हिंदी बोलें.",

    language_not_understood:
      "Sorry, I did not understand. Please say English, Telugu, or Hindi.",

    language_selected:
      "English selected. Great!",

    welcome_voice_prompt:
      "I am your legal guide. Would you like me to help you navigate this app? Say yes or no.",

    returning_voice_prompt:
      "Welcome back! Would you like voice guidance today? Say yes or no.",

    yes_response:
      "Great! I will guide you. Here is what you can do.",

    main_menu:
      "Where would you like to go? Say: Find lawyer. Say: Track my case. Say: I got a notice. Say: I have a question. Say: This is a scam. Say: My documents. Say: My notifications. Say: Open help. Say: My account. Say: My cases. Say: Go home. Or say: Repeat, to hear this again.",

    no_response:
      "No problem. You can tap the blue microphone button at the bottom right anytime you need help.",

    no_response_detected:
      "No response detected. Tap the blue microphone button anytime you need help.",

    did_not_understand_yes_no:
      "Sorry, I did not understand. Please say yes or no.",

    could_not_hear:
      "Sorry, I could not hear you. Please tap the microphone and try again.",

    voice_disabled:
      "Voice guidance turned off. Tap the microphone anytime to get help.",

    opening_lawyers:
      "Taking you to the lawyer directory.",

    opening_tracker:
      "Taking you to case tracking.",

    opening_ai:
      "Taking you to the AI Legal Assistant.",

    opening_documents:
      "Opening your documents.",

    opening_notifications:
      "Opening your notifications.",

    opening_help:
      "Opening the help center.",

    opening_account:
      "Opening your account settings.",

    opening_home:
      "Taking you to your dashboard.",

    opening_cases:
      "Opening your cases.",

    guide_notice:
      "I understand you received a legal notice. Do not worry. Let me take you to the AI Assistant. It will explain what it means in simple language.",

    not_understood:
      "Sorry, I did not understand that.",

    repeat_nothing:
      "I have not said anything yet. How can I help you?",

    say_menu:
      "Tap the microphone to hear navigation options.",
  },

  telugu: {
    welcome_choose_language:
      "LegalMind కి స్వాగతం! దయచేసి మీ భాషను ఎంచుకోండి. For English, say English. తెలుగు కోసం తెలుగు అనండి. हिंदी के लिए हिंदी बोलें.",

    language_not_understood:
      "క్షమించండి, అర్థం కాలేదు. దయచేసి English, తెలుగు, లేదా Hindi అనండి.",

    language_selected:
      "తెలుగు ఎంపిక చేయబడింది. చాలా బాగుంది!",

    welcome_voice_prompt:
      "నేను మీ న్యాయ సహాయకుడిని. ఈ యాప్ ఉపయోగించడంలో మీకు సహాయం చేయనా? అవును లేదా కాదు అని చెప్పండి.",

    returning_voice_prompt:
      "తిరిగి స్వాగతం! ఈ రోజు వాయిస్ సహాయం కావాలా? అవును లేదా కాదు అని చెప్పండి.",

    yes_response:
      "చాలా బాగుంది! నేను మీకు మార్గదర్శకత్వం చేస్తాను.",

    main_menu:
      "ఎక్కడికి వెళ్ళాలి? న్యాయవాది కావాలి అని చెప్పండి. నా కేసు అని చెప్పండి. నోటీసు వచ్చింది అని చెప్పండి. ప్రశ్న అడగాలి అని చెప్పండి. మోసం జరిగింది అని చెప్పండి. నా పత్రాలు, నోటిఫికేషన్లు, సహాయం, నా ఖాతా, నా కేసులు, హోమ్ కి వెళ్ళు అని చెప్పవచ్చు. మళ్ళీ వినాలంటే మళ్ళీ చెప్పు అనండి.",

    no_response:
      "పర్వాలేదు. స్క్రీన్ కింద కుడివైపు నీలి మైక్రోఫోన్ బటన్ నొక్కి సహాయం పొందవచ్చు.",

    no_response_detected:
      "స్పందన కనుగొనబడలేదు. ఎప్పుడైనా నీలి మైక్రోఫోన్ బటన్ నొక్కండి.",

    did_not_understand_yes_no:
      "క్షమించండి, అర్థం కాలేదు. అవును లేదా కాదు అని చెప్పండి.",

    could_not_hear:
      "క్షమించండి, వినలేకపోయాను. మైక్రోఫోన్ నొక్కి మళ్ళీ ప్రయత్నించండి.",

    voice_disabled:
      "వాయిస్ సహాయం ఆపివేయబడింది. ఎప్పుడైనా మైక్రోఫోన్ బటన్ నొక్కండి.",

    opening_lawyers:
      "న్యాయవాదుల పేజీకి తీసుకువెళ్తున్నాను.",

    opening_tracker:
      "కేసు ట్రాకింగ్ పేజీకి తీసుకువెళ్తున్నాను.",

    opening_ai:
      "AI న్యాయ సహాయకుడి దగ్గరికి తీసుకువెళ్తున్నాను.",

    opening_documents:
      "మీ పత్రాలు తెరుస్తున్నాను.",

    opening_notifications:
      "మీ నోటిఫికేషన్లు తెరుస్తున్నాను.",

    opening_help:
      "సహాయ కేంద్రం తెరుస్తున్నాను.",

    opening_account:
      "మీ ఖాతా సెట్టింగ్స్ తెరుస్తున్నాను.",

    opening_home:
      "మీ డాష్‌బోర్డ్‌కి తీసుకువెళ్తున్నాను.",

    opening_cases:
      "మీ కేసులు తెరుస్తున్నాను.",

    guide_notice:
      "మీకు న్యాయ నోటీసు వచ్చిందని అర్థమైంది. ఆందోళన చెందకండి. AI సహాయకుడి దగ్గరికి తీసుకువెళ్తున్నాను. అది సులభంగా అర్థం చేయిస్తుంది.",

    not_understood:
      "క్షమించండి, అర్థం కాలేదు.",

    repeat_nothing:
      "నేను ఇంకా ఏమీ చెప్పలేదు. నేను ఎలా సహాయం చేయగలను?",

    say_menu:
      "నావిగేషన్ ఎంపికలు వినాలంటే మైక్రోఫోన్ నొక్కండి.",
  },

  hindi: {
    welcome_choose_language:
      "LegalMind में आपका स्वागत है! कृपया अपनी भाषा चुनें. For English, say English. తెలుగు కోసం తెలుగు అనండి. हिंदी के लिए हिंदी बोलें.",

    language_not_understood:
      "माफ करें, समझ नहीं आया। कृपया English, Telugu, या Hindi बोलें।",

    language_selected:
      "हिंदी चुनी गई। बहुत अच्छा!",

    welcome_voice_prompt:
      "मैं आपका कानूनी सहायक हूं। क्या मैं इस ऐप को नेविगेट करने में आपकी मदद करूं? हां या ना बोलें।",

    returning_voice_prompt:
      "वापस आने पर स्वागत है! क्या आज वॉइस सहायता चाहिए? हां या ना बोलें।",

    yes_response:
      "बहुत अच्छा! मैं आपको गाइड करूंगा।",

    main_menu:
      "कहां जाना चाहते हैं? वकील चाहिए बोलें। मेरा केस बोलें। नोटिस मिला बोलें। एक सवाल है बोलें। धोखा हुआ बोलें। दस्तावेज़, सूचनाएं, मदद, मेरा खाता, मेरे केस, या होम जाओ बोल सकते हैं। दोबारा सुनने के लिए फिर से बोलो बोलें।",

    no_response:
      "कोई बात नहीं। स्क्रीन के नीचे दाईं ओर नीले माइक्रोफोन बटन को दबाकर मदद ले सकते हैं।",

    no_response_detected:
      "कोई जवाब नहीं मिला। कभी भी नीले माइक्रोफोन बटन को दबाएं।",

    did_not_understand_yes_no:
      "माफ करें, समझ नहीं आया। हां या ना बोलें।",

    could_not_hear:
      "माफ करें, सुन नहीं पाया। माइक्रोफोन दबाकर फिर से बोलें।",

    voice_disabled:
      "वॉइस सहायता बंद। कभी भी माइक्रोफोन बटन दबाएं।",

    opening_lawyers:
      "वकीलों के पेज पर ले जा रहा हूं।",

    opening_tracker:
      "केस ट्रैकिंग पेज पर ले जा रहा हूं।",

    opening_ai:
      "AI कानूनी सहायक पर ले जा रहा हूं।",

    opening_documents:
      "आपके दस्तावेज़ खोल रहा हूं।",

    opening_notifications:
      "आपकी सूचनाएं खोल रहा हूं।",

    opening_help:
      "सहायता केंद्र खोल रहा हूं।",

    opening_account:
      "आपकी खाता सेटिंग्स खोल रहा हूं।",

    opening_home:
      "आपके डैशबोर्ड पर ले जा रहा हूं।",

    opening_cases:
      "आपके केस खोल रहा हूं।",

    guide_notice:
      "समझ गया कि आपको कानूनी नोटिस मिला है। चिंता न करें। AI सहायक पर ले जा रहा हूं। वो आसान भाषा में समझाएगा।",

    not_understood:
      "माफ करें, समझ नहीं आया।",

    repeat_nothing:
      "मैंने अभी कुछ नहीं कहा। मैं कैसे मदद करूं?",

    say_menu:
      "नेविगेशन विकल्प सुनने के लिए माइक्रोफोन दबाएं।",
  },
};

export const t = (
  key: TranslationKey,
  lang: Language | null
): string => {
  const l = lang || "english";
  return translations[l]?.[key] || translations.english[key];
};

export const getRecognitionLang = (lang: Language | null): string => {
  const map: Record<Language, string> = {
    english: "en-IN",
    telugu: "te-IN",
    hindi: "hi-IN",
  };
  return map[lang || "english"];
};