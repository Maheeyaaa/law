// backend/controllers/predictionController.js

import { CasePredictionEngine } from "../utils/casePredictionEngine.js";
import CasePrediction from "../models/CasePrediction.js";
import UserAnalytics from "../models/UserAnalytics.js";
import Groq from "groq-sdk";

const LEGAL_SYSTEM_PROMPT = `You are LegalMind AI, a helpful legal assistant for Indian citizens. Your role is to:

1. Explain legal concepts in simple, easy-to-understand language
2. Help citizens understand their legal rights
3. Explain legal procedures (filing cases, court processes, etc.)
4. Clarify legal notices and documents
5. Provide general legal guidance about Indian law

Important rules:
- Always clarify that you provide general legal information, NOT legal advice
- Recommend consulting a qualified lawyer for specific legal matters
- Be empathetic and patient with users who may be stressed about legal issues
- Use simple language, avoid excessive legal jargon
- When explaining legal terms, provide the meaning in plain English
- Focus on Indian law and legal system
- Keep responses concise but thorough
- If you don't know something, say so honestly

You must NOT:
- Provide specific legal advice for individual cases
- Guarantee outcomes of legal proceedings
- Encourage any illegal activities
- Provide information about how to evade law`;

// ═══════════════════════════════════════════════════
// FEATURE 8: CASE OUTCOME PREDICTION
// ═══════════════════════════════════════════════════

export const predictCaseOutcome = async (req, res) => {
  try {
    const { caseType, caseDetails, additionalInfo } = req.body;

    if (!caseType || !caseType.trim()) {
      return res.status(400).json({ message: "Case type is required." });
    }

    // Track feature usage
    try {
      let analytics = await UserAnalytics.findOne({ user: req.user.id });
      if (!analytics) {
        analytics = await UserAnalytics.create({ user: req.user.id });
      }
      analytics.featureUsage.casePrediction = (analytics.featureUsage.casePrediction || 0) + 1;
      analytics.totalMessages += 1;
      analytics.lastActive = new Date();
      analytics.lastFeatureUsed = "casePrediction";
      await analytics.save();
    } catch (trackError) {
      console.error("Tracking error:", trackError);
    }

    // ═══════════════════════════════════════════════════
    // STEP 1: Rule-based prediction
    // ═══════════════════════════════════════════════════
    
    const engine = new CasePredictionEngine(caseType, caseDetails || {});
    const prediction = engine.predict();

    // ═══════════════════════════════════════════════════
    // STEP 2: Get AI insights
    // ═══════════════════════════════════════════════════

    const aiPrompt = `A citizen wants to file a ${caseType} case in India.

Case Details:
- Has Evidence: ${caseDetails?.hasEvidence ? "Yes" : "No"}
- Evidence Quality: ${caseDetails?.evidenceQuality || "Not specified"}
- Has Witnesses: ${caseDetails?.hasWitnesses ? "Yes" : "No"}
- Witness Count: ${caseDetails?.witnessCount || "Not specified"}
- Opposing Party Strength: ${caseDetails?.opposingPartyStrength || "Not specified"}
- Lawyer Experience: ${caseDetails?.lawyerExperience || "Not specified"} years
${additionalInfo ? `\nAdditional Information: ${additionalInfo}` : ""}

Based on Indian law and legal precedents, please provide:

1. **Key Legal Considerations** - What are the most important legal points for this case type?
2. **Common Pitfalls** - What mistakes do people make in these cases?
3. **Strategic Advice** - What strategy would strengthen this case?
4. **Alternative Options** - Are there better alternatives to court (mediation, settlement, legal notice)?

Keep it practical and specific to Indian law. Focus on actionable insights.`;

    let aiInsights = "";
    try {

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: LEGAL_SYSTEM_PROMPT },
          { role: "user", content: aiPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      aiInsights = completion.choices[0].message.content;
    } catch (aiError) {
      console.error("AI insights error:", aiError);
      aiInsights = "AI analysis unavailable. Using rule-based prediction only.";
    }

    // ═══════════════════════════════════════════════════
    // STEP 3: Format final response
    // ═══════════════════════════════════════════════════

    const strengthsList = prediction.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const weaknessesList = prediction.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n");
    const recommendationsList = prediction.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n");

    let verdictEmoji = "⚖️";
    if (prediction.verdict === "Highly Favorable") verdictEmoji = "🎯";
    else if (prediction.verdict === "Favorable") verdictEmoji = "✅";
    else if (prediction.verdict === "Neutral") verdictEmoji = "⚖️";
    else if (prediction.verdict === "Unfavorable") verdictEmoji = "⚠️";
    else if (prediction.verdict === "Highly Unfavorable") verdictEmoji = "🚨";

    const finalResponse = `
# ${verdictEmoji} CASE OUTCOME PREDICTION

## 📊 **Win Probability: ${prediction.winProbability}%**

## **Verdict: ${prediction.verdict}**

*Confidence Level: ${prediction.confidence}%*

---

## 💪 **STRENGTHS OF YOUR CASE:**

${strengthsList || "No specific strengths identified based on provided information."}

---

## ⚠️ **WEAKNESSES TO ADDRESS:**

${weaknessesList || "No major weaknesses identified."}

---

## 📋 **RECOMMENDATIONS:**

${recommendationsList}

---

## ⏱️ **ESTIMATED TIMELINE:**

${prediction.estimatedTimeline}

---

## 💰 **ESTIMATED COST:**

${prediction.estimatedCost}

*Note: Costs vary based on lawyer fees, court fees, and case complexity*

---

## 🤖 **AI LEGAL INSIGHTS:**

${aiInsights}

---

## ⚖️ **IMPORTANT DISCLAIMERS:**

1. ⚠️ **This is a prediction, not a guarantee** - Actual case outcomes depend on many factors including judge's discretion, evidence presentation, and changing laws.

2. 🎓 **This is general information, not legal advice** - Always consult a qualified lawyer for your specific case.

3. 📊 **Prediction based on provided information** - Accuracy improves with more detailed case information.

4. 🔄 **Consider alternatives** - Sometimes settlement, mediation, or legal notice is faster and cheaper than court.

---

## ✅ **NEXT STEPS:**

1. **If prediction is favorable (>60%):**
   - Gather all recommended documents
   - Consult a qualified lawyer
   - Prepare to file the case

2. **If prediction is neutral (40-60%):**
   - Strengthen your evidence first
   - Consider sending legal notice
   - Explore settlement options

3. **If prediction is unfavorable (<40%):**
   - Seriously consider alternatives to court
   - Consult lawyer about settlement
   - Don't file case unless evidence improves

---

## 📞 **FREE LEGAL AID:**

If you cannot afford a lawyer, you may be eligible for free legal aid:
- **NALSA Helpline:** 15100
- **Visit:** Your nearest District Legal Services Authority
- **Website:** nalsa.gov.in

---

*This prediction was generated on ${new Date().toLocaleDateString("en-IN")}*
    `.trim();

    // ═══════════════════════════════════════════════════
    // STEP 4: Save to database
    // ═══════════════════════════════════════════════════

    try {
      await CasePrediction.create({
        user: req.user.id,
        caseType: caseType.trim(),
        caseDetails: caseDetails || {},
        prediction: {
          winProbability: prediction.winProbability,
          verdict: prediction.verdict,
          confidence: prediction.confidence,
        },
        strengths: prediction.strengths,
        weaknesses: prediction.weaknesses,
        recommendations: prediction.recommendations,
        estimatedTimeline: prediction.estimatedTimeline,
        estimatedCost: prediction.estimatedCost,
        aiInsights: aiInsights.substring(0, 2000),
      });
    } catch (dbError) {
      console.error("Failed to save prediction:", dbError);
      // Don't fail the request if DB save fails
    }

    res.json({
      reply: finalResponse,
      prediction: {
        winProbability: prediction.winProbability,
        verdict: prediction.verdict,
        confidence: prediction.confidence,
        strengths: prediction.strengths,
        weaknesses: prediction.weaknesses,
        recommendations: prediction.recommendations,
        estimatedTimeline: prediction.estimatedTimeline,
        estimatedCost: prediction.estimatedCost,
      },
    });

  } catch (error) {
    console.error("PREDICTION ERROR:", error);
    res.status(500).json({
      error: error.message,
      reply: "Sorry, I could not generate a prediction. Please try again.",
    });
  }
};

// ═══════════════════════════════════════════════════
// GET USER'S PREDICTION HISTORY
// ═══════════════════════════════════════════════════

export const getPredictionHistory = async (req, res) => {
  try {
    const predictions = await CasePrediction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};