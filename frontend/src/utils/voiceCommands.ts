// src/utils/voiceCommands.ts

export interface VoiceCommand {
  keywords: string[];
  route?: string;
  action?: string;
  response: string;
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    keywords: [
      "go home", "home", "dashboard", "main page",
      "go to home", "back to home", "main menu",
    ],
    route: "/citizen",
    response: "Taking you to your home page.",
  },
  {
    keywords: [
      "ask ai", "ai assistant", "legal assistant",
      "open ai", "legal chatbot", "ai help",
    ],
    route: "/citizen/ai-assistant",
    response: "Opening the AI Legal Assistant for you.",
  },
  {
    keywords: [
      "find lawyer", "find lawyers", "search lawyer",
      "show lawyers", "browse lawyers", "lawyer directory",
    ],
    route: "/citizen/find-lawyer",
    response: "Opening the lawyer directory.",
  },
  {
    keywords: [
      "track case", "track status", "track progress",
      "case tracking", "check progress",
    ],
    route: "/citizen/track",
    response: "Opening case tracker.",
  },
  {
    keywords: [
      "my cases", "view cases", "show cases",
      "all cases", "case list",
    ],
    route: "/citizen/cases",
    response: "Opening your cases.",
  },
  {
    keywords: [
      "documents", "my documents", "view documents",
      "upload document", "my files",
    ],
    route: "/citizen/documents",
    response: "Opening your documents.",
  },
  {
    keywords: [
      "notifications", "alerts", "my alerts",
      "show notifications",
    ],
    route: "/citizen/notifications",
    response: "Opening your notifications.",
  },
  {
    keywords: [
      "help", "support", "help center",
      "contact support", "get help",
    ],
    route: "/citizen/help",
    response: "Opening the help center.",
  },
  {
    keywords: [
      "settings", "account", "my account",
      "profile", "my profile",
    ],
    route: "/citizen/account",
    response: "Opening your account settings.",
  },
  {
    keywords: [
      "exit voice", "stop voice", "disable voice",
      "voice off", "turn off voice",
    ],
    action: "EXIT_VOICE",
    response: "Voice assistance turned off.",
  },
  {
    keywords: ["stop listening", "pause", "stop"],
    action: "STOP_LISTENING",
    response: "Stopped listening.",
  },
  {
    keywords: [
      "what can i say", "options", "commands",
      "what can you do", "help me", "what are options",
    ],
    action: "HELP",
    response:
      "You can say: Find me a lawyer, Track my case, I got a notice, I have a question, Check a scam, Go home, Documents, Notifications, Settings, or Exit voice. You can also ask me any legal question.",
  },
  {
    keywords: ["logout", "log out", "sign out", "exit"],
    action: "LOGOUT",
    response: "Logging you out. Goodbye!",
  },
];

export const matchCommand = (transcript: string): VoiceCommand | null => {
  const lower = transcript.toLowerCase().trim();
  for (const command of VOICE_COMMANDS) {
    for (const keyword of command.keywords) {
      if (lower.includes(keyword)) {
        return command;
      }
    }
  }
  return null;
};