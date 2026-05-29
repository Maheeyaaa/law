// src/utils/voiceCommands.ts

export interface VoiceCommand {
  keywords: string[];
  related: string[];
  action: string;
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  // ── Utility Commands ───────────────────────────────
  {
    keywords: ["menu", "option", "options"],
    related: ["show", "list", "what", "kya", "batao", "bolo", "help me"],
    action: "SHOW_MENU",
  },
  {
    keywords: ["repeat", "again", "dobara", "phir"],
    related: ["once more", "ek baar", "sunao", "bolo", "malli"],
    action: "REPEAT",
  },
  {
    keywords: ["stop voice", "voice off", "exit voice", "disable voice"],
    related: ["band karo", "chup", "silent", "mute", "awaaz band"],
    action: "EXIT_VOICE",
  },
  {
    keywords: ["logout", "log out", "sign out"],
    related: ["bahar", "nikalo", "exit app", "close"],
    action: "LOGOUT",
  },

  // ── HOME ───────────────────────────────────────────
  {
    keywords: ["home", "dashboard", "main"],
    related: [
      "ghar", "wapas", "back", "shuru", "start",
      "beginning", "first page", "main page",
      "intiki", "go back",
    ],
    action: "HOME",
  },

  // ── NOTICE ─────────────────────────────────────────
  {
    keywords: ["notice", "notiece", "notis"],
    related: [
      "legal notice", "court notice", "summon", "summons",
      "letter", "warning", "legal paper", "legal letter",
      "notice aaya", "notice mila", "notice vachindi",
      "nokis", "noties", "court paper", "court letter",
      "received notice", "got notice", "legal document received",
      "khat", "chithi", "kagaz aaya",
    ],
    action: "NOTICE",
  },

  // ── LAWYER ─────────────────────────────────────────
  {
    keywords: ["lawyer", "vakeel", "vakil", "wakeel", "advocate"],
    related: [
      "attorney", "legal advisor", "counsel", "counselor",
      "lawyer chahiye", "vakeel chahiye", "find lawyer",
      "need lawyer", "want lawyer", "lawyer dhundo",
      "nyayavadi", "legal representative",
      "lawyer help", "get lawyer", "hire lawyer",
      "lawyer batao", "vakeel batao", "advocate chahiye",
      "lawer", "laywer", "lowyer",
    ],
    action: "LAWYER",
  },

  // ─────────────────────────────────────────────────
  // 🆕 CASES must come BEFORE CASE
  // because "cases" contains "case" and includes() would
  // match CASE first if it was above
  // ─────────────────────────────────────────────────

  // ── CASES (My Cases / All Cases page) ──────────────
  {
    keywords: ["cases", "my cases", "all cases"],
    related: [
      "mere cases", "meri cases", "na cases",
      "case list", "registered cases", "filed cases",
      "how many cases", "kitne case", "saare case",
      "sare case", "sabhi case", "all case",
      "case history", "past cases", "show cases",
      "cases dikhao", "cases batao", "total cases",
      "mere saare", "meri sari", "sab cases",
    ],
    action: "CASES",
  },

  // ── CASE TRACKING (single case) ────────────────────
  {
    keywords: ["track", "tracking", "status"],
    related: [
      "case track", "case status", "case progress",
      "case update", "case kahan", "case dekhna",
      "court date", "hearing", "next date",
      "case number", "case id", "check case",
      "where is my case", "mera case kahan",
      "case ki sthiti", "track my case",
      "case check", "case track karo",
    ],
    action: "CASE",
  },

  // ── QUESTION / AI ──────────────────────────────────
  {
    keywords: ["question", "sawal", "sawaal", "ask", "doubt"],
    related: [
      "legal help", "legal question", "help me",
      "explain", "samjhao", "batao", "kya hai",
      "poochna", "puchna", "query", "enquiry",
      "prasna", "help chahiye", "confusion",
      "kaise", "kyun", "why", "how",
      "what is", "tell me", "guide me",
      "mujhe batao", "samajh nahi", "problem hai",
      "i want to know", "can you explain",
      "ek sawal", "sawal hai", "question hai",
    ],
    action: "QUESTION",
  },

  // ── SCAM ───────────────────────────────────────────
  {
    keywords: ["scam", "fraud", "fake", "dhoka", "dhokha"],
    related: [
      "cheating", "cheat", "thagi", "loot",
      "mosam", "nakli", "farzi", "illegal",
      "is this real", "suspicious", "danger",
      "trap", "con", "stolen", "money gone",
      "paisa dooba", "paisa gaya",
    ],
    action: "SCAM",
  },

  // ── DOCUMENTS ──────────────────────────────────────
  {
    keywords: ["document", "documents", "file", "files"],
    related: [
      "papers", "dastavez", "kagaz", "kagaj",
      "patralu", "upload", "download", "my files",
      "my documents", "legal papers", "proof",
      "id proof", "evidence", "attachment",
    ],
    action: "DOCUMENTS",
  },

  // ── NOTIFICATIONS ──────────────────────────────────
  {
    keywords: ["notification", "notifications", "alert", "alerts"],
    related: [
      "soochna", "updates", "messages", "inbox",
      "new updates", "kya naya", "koi update",
      "notify", "bell", "reminder",
    ],
    action: "NOTIFICATIONS",
  },

  // ── HELP ───────────────────────────────────────────
  {
    keywords: ["help", "support", "madad"],
    related: [
      "sahayam", "help center", "contact",
      "problem", "issue", "complaint",
      "customer care", "assistance",
      "kaise kare", "kya karu", "guide",
      "how to use", "i am stuck", "confused",
    ],
    action: "HELP",
  },

  // ── ACCOUNT ────────────────────────────────────────
  {
    keywords: ["account", "profile", "settings", "setting"],
    related: [
      "my account", "mera account", "khata",
      "personal details", "name change",
      "phone number", "email", "password",
      "edit profile", "update profile",
      "my details", "my info",
    ],
    action: "ACCOUNT",
  },
];

// ── Similarity check (handles typos) ───────────────
const similarity = (a: string, b: string): number => {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();

  if (al === bl) return 1;
  if (al.includes(bl) || bl.includes(al)) return 0.9;

  const longer = al.length > bl.length ? al : bl;
  const shorter = al.length > bl.length ? bl : al;

  if (longer.length === 0) return 1;

  let matches = 0;
  const longerArr = longer.split("");
  const shorterArr = shorter.split("");

  for (const ch of shorterArr) {
    const idx = longerArr.indexOf(ch);
    if (idx !== -1) {
      matches++;
      longerArr[idx] = "";
    }
  }

  return matches / longer.length;
};

// ── Smart matcher ──────────────────────────────────
export const matchCommand = (transcript: string): VoiceCommand | null => {
  const lower = transcript
    .toLowerCase()
    .trim()
    .replace(/[।,.?!]/g, "");

  console.log("🔍 Matching:", lower);

  const words = lower.split(/\s+/);

  // ── Pass 0: Check for plural "cases" FIRST ───────
  // This prevents "cases" from matching "case" (tracking)
  const hasCasesPlural =
    words.includes("cases") ||
    lower.includes("all case") ||
    lower.includes("saare case") ||
    lower.includes("sare case") ||
    lower.includes("sabhi case") ||
    lower.includes("mere case") ||
    lower.includes("show case") ||
    lower.includes("cases batao") ||
    lower.includes("cases dikhao") ||
    lower.includes("kitne case");

  if (hasCasesPlural) {
    const casesCmd = VOICE_COMMANDS.find((c) => c.action === "CASES");
    if (casesCmd) {
      console.log("✅ Plural cases detected → CASES");
      return casesCmd;
    }
  }

  // ── Pass 1: Direct keyword/related match ─────────
  for (const command of VOICE_COMMANDS) {
    for (const keyword of command.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        console.log(`✅ Keyword match: "${keyword}" → ${command.action}`);
        return command;
      }
    }

    for (const rel of command.related) {
      if (lower.includes(rel.toLowerCase())) {
        console.log(`✅ Related match: "${rel}" → ${command.action}`);
        return command;
      }
    }
  }

  // ── Pass 2: Fuzzy match individual words ─────────
  let bestMatch: VoiceCommand | null = null;
  let bestScore = 0;

  for (const command of VOICE_COMMANDS) {
    for (const word of words) {
      if (word.length < 3) continue;

      for (const keyword of command.keywords) {
        const score = similarity(word, keyword);
        if (score > 0.7 && score > bestScore) {
          bestScore = score;
          bestMatch = command;
        }
      }

      for (const rel of command.related) {
        if (rel.includes(" ")) continue;
        const score = similarity(word, rel);
        if (score > 0.7 && score > bestScore) {
          bestScore = score;
          bestMatch = command;
        }
      }
    }
  }

  if (bestMatch) {
    console.log(`✅ Fuzzy → ${bestMatch.action} (${(bestScore * 100).toFixed(0)}%)`);
    return bestMatch;
  }

  console.log("❌ No match for:", lower);
  return null;
};