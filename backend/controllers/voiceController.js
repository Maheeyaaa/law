import Groq from "groq-sdk";
import UserAnalytics from "../models/UserAnalytics.js";
import ChatMessage from "../models/ChatMessage.js";

const SYSTEM_PROMPT = `
You are LegalAssist AI.

Purpose:
Help Indian citizens understand legal information using simple spoken language.

Capabilities:
- Explain legal notices
- Explain uploaded documents
- Help identify possible scams
- Explain legal terms
- Guide users through legal procedures
- Support voice-based interaction

Rules:
- Provide general legal information only
- Never claim to provide legal advice
- Recommend consulting professionals when needed
- Use short, conversational responses
- Avoid complex legal language
- Keep responses under 150 words
- If uncertain, say so clearly

Voice Rules:
- Speak naturally
- Use short sentences
- Avoid lists unless necessary
`;

// ======================
// Voice Chat
// ======================

export const voiceChat =
async (req, res) => {
  try {
    const {
      message,
      sessionId,
    } =
      req.body;

    if (
      !message?.trim()
    ) {
      return res
        .status(400)
        .json({
          reply:
            "I didn't hear anything.",

          audioResponse:
            "I didn't hear anything. Please try again.",
        });
    }

    // Analytics

    try {
      let analytics =
        await UserAnalytics.findOne(
          {
            user:
              req.user.id,
          }
        );

      if (
        !analytics
      ) {
        analytics =
          await UserAnalytics.create(
            {
              user:
                req.user.id,
            }
          );
      }

      analytics.featureUsage.voiceInput =
        (
          analytics.featureUsage
            .voiceInput ||
          0
        ) +
        1;

      analytics.totalMessages +=
        1;

      analytics.lastActive =
        new Date();

      analytics.lastFeatureUsed =
        "voice";

      await analytics.save();
    } catch (
      e
    ) {
      console.error(
        e
      );
    }

    const session =
      sessionId ||
      `voice_${req.user.id}_${Date.now()}`;

    // Save user message

    await ChatMessage.create(
      {
        user:
          req.user.id,

        role:
          "user",

        message:
          message.trim(),

        sessionId:
          session,
      }
    );

    // History

    const history =
      await ChatMessage.find(
        {
          user:
            req.user.id,

          sessionId:
            session,
        }
      )
        .sort({
          createdAt:
            -1,
        })
        .limit(
          6
        );

    const messages =
      [
        {
          role:
            "system",

          content:
            SYSTEM_PROMPT,
        },

        ...history
          .reverse()
          .map(
            (
              msg
            ) => ({
              role:
                msg.role ===
                "user"
                  ? "user"
                  : "assistant",

              content:
                msg.message,
            })
          ),
      ];

    const groq =
      new Groq(
        {
          apiKey:
            process.env
              .GROQ_API_KEY,
        }
      );

    const completion =
      await groq.chat.completions.create(
        {
          model:
            "llama-3.3-70b-versatile",

          messages,

          max_tokens:
            250,

          temperature:
            0.5,
        }
      );

    const reply =
      completion
        .choices?.[0]
        ?.message
        ?.content ||
      "Sorry, I couldn't generate a response.";

    await ChatMessage.create(
      {
        user:
          req.user.id,

        role:
          "assistant",

        message:
          reply,

        sessionId:
          session,
      }
    );

    res.json({
      reply,

      audioResponse:
        reply,

      sessionId:
        session,
    });
  } catch (
    error
  ) {
    console.error(
      error
    );

    res
      .status(
        500
      )
      .json({
        reply:
          "Something went wrong.",

        audioResponse:
          "Something went wrong. Please try again.",
      });
  }
};

// ======================
// Get Voice History
// ======================

export const getVoiceHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const history = await ChatMessage.find({
      user: req.user.id,
      sessionId: sessionId,
    })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({
      success: true,
      history,
      sessionId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get history",
    });
  }
};

// ======================
// Clear Voice Session
// ======================

export const clearVoiceSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await ChatMessage.deleteMany({
      user: req.user.id,
      sessionId: sessionId,
    });

    res.json({
      success: true,
      message: "Session cleared",
      newSessionId: `voice_${req.user.id}_${Date.now()}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to clear session",
    });
  }
};