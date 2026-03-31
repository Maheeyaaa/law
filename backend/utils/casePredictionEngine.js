// backend/utils/casePredictionEngine.js

export class CasePredictionEngine {
  constructor(caseType, caseDetails) {
    this.caseType = caseType;
    this.details = caseDetails;
    this.score = 50; // Start neutral
    this.strengths = [];
    this.weaknesses = [];
    this.recommendations = [];
  }

  analyzeEvidence() {
    if (this.details.hasEvidence) {
      if (this.details.evidenceQuality === "strong") {
        this.score += 15;
        this.strengths.push("Strong documentary evidence available");
      } else if (this.details.evidenceQuality === "moderate") {
        this.score += 8;
        this.strengths.push("Moderate documentary evidence available");
      } else {
        this.score += 3;
        this.weaknesses.push("Evidence quality is weak - strengthen documentation");
        this.recommendations.push("Gather additional supporting documents");
      }
    } else {
      this.score -= 10;
      this.weaknesses.push("No documentary evidence - critical weakness");
      this.recommendations.push("Urgently collect all relevant documents and evidence");
    }
  }

  analyzeWitnesses() {
    if (this.details.hasWitnesses) {
      const count = this.details.witnessCount || 1;

      if (count >= 3 && this.details.witnessQuality === "strong") {
        this.score += 12;
        this.strengths.push(`${count} credible witnesses available`);
      } else if (count >= 2) {
        this.score += 6;
        this.strengths.push(`${count} witnesses available`);
      } else {
        this.score += 3;
        this.recommendations.push("Try to identify additional witnesses");
      }

      if (this.details.witnessQuality === "weak") {
        this.weaknesses.push("Witness credibility may be challenged");
        this.recommendations.push("Prepare witness statements carefully");
      }
    } else {
      this.score -= 5;
      this.weaknesses.push("No witnesses identified");
      this.recommendations.push("Search for any potential witnesses");
    }
  }

  analyzeLegalPrecedent() {
    if (this.details.hasLegalPrecedent) {
      this.score += 10;
      this.strengths.push("Favorable legal precedents exist");
    } else {
      this.score -= 5;
      this.weaknesses.push("Limited legal precedents in your favor");
      this.recommendations.push("Research similar case judgments thoroughly");
    }
  }

  analyzeOpposingParty() {
    if (this.details.opposingPartyStrength === "weak") {
      this.score += 8;
      this.strengths.push("Opposing party has weak position");
    } else if (this.details.opposingPartyStrength === "strong") {
      this.score -= 8;
      this.weaknesses.push("Opposing party has strong position");
      this.recommendations.push("Build a robust counter-argument strategy");
    }
  }

  analyzeLawyerExperience() {
    const experience = this.details.lawyerExperience || 0;

    if (experience >= 10) {
      this.score += 10;
      this.strengths.push("Experienced lawyer (10+ years)");
    } else if (experience >= 5) {
      this.score += 5;
      this.strengths.push("Moderately experienced lawyer");
    } else if (experience < 2) {
      this.score -= 3;
      this.recommendations.push("Consider consulting an experienced lawyer");
    }
  }

  analyzeCaseDuration() {
    if (this.details.caseDuration === "more_than_3_years") {
      this.score -= 5;
      this.weaknesses.push("Long-pending case - may face procedural delays");
      this.recommendations.push("File for expedited hearing if possible");
    } else if (this.details.caseDuration === "pending_less_than_1_year") {
      this.score += 3;
      this.strengths.push("Recent case - less procedural backlog");
    }
  }

  analyzeCaseTypeSpecifics() {
    const caseTypeLower = this.caseType.toLowerCase();

    if (caseTypeLower.includes("cheque") || caseTypeLower.includes("138")) {
      this.score += 5;
      this.recommendations.push("Ensure cheque bounce notice was sent within 30 days");
      this.recommendations.push("File case within limitation period (1 year from cause of action)");
    }

    if (caseTypeLower.includes("consumer")) {
      this.score += 3;
      this.strengths.push("Consumer courts are generally pro-consumer");
      this.recommendations.push("File in appropriate consumer forum based on claim value");
    }

    if (caseTypeLower.includes("rent") || caseTypeLower.includes("eviction")) {
      this.recommendations.push("Check if rent agreement is registered");
      this.recommendations.push("Maintain rent payment receipts");
    }

    if (caseTypeLower.includes("divorce") || caseTypeLower.includes("matrimonial")) {
      this.score -= 5;
      this.weaknesses.push("Matrimonial cases typically take 2-5 years");
      this.recommendations.push("Consider mediation or mutual consent divorce if possible");
    }
  }

  estimateTimeline() {
    const caseTypeLower = this.caseType.toLowerCase();

    if (caseTypeLower.includes("consumer")) {
      return "3-12 months (consumer courts are faster)";
    } else if (caseTypeLower.includes("cheque") || caseTypeLower.includes("138")) {
      return "6-18 months";
    } else if (caseTypeLower.includes("divorce") || caseTypeLower.includes("matrimonial")) {
      return "1-5 years";
    } else if (caseTypeLower.includes("criminal")) {
      return "1-3 years";
    } else {
      return "1-2 years (approximate)";
    }
  }

  estimateCost() {
    const experience = this.details.lawyerExperience || 0;
    const jurisdiction = this.details.jurisdiction || "";

    let baseCost = 50000;

    if (experience >= 10) {
      baseCost = 100000;
    } else if (experience >= 5) {
      baseCost = 75000;
    }

    const metroCities = ["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "kolkata"];
    if (metroCities.some(city => jurisdiction.toLowerCase().includes(city))) {
      baseCost *= 1.5;
    }

    const minCost = Math.floor(baseCost * 0.7);
    const maxCost = Math.floor(baseCost * 1.5);

    return `₹${minCost.toLocaleString("en-IN")} - ₹${maxCost.toLocaleString("en-IN")}`;
  }

  predict() {
    this.analyzeEvidence();
    this.analyzeWitnesses();
    this.analyzeLegalPrecedent();
    this.analyzeOpposingParty();
    this.analyzeLawyerExperience();
    this.analyzeCaseDuration();
    this.analyzeCaseTypeSpecifics();

    this.score = Math.max(0, Math.min(100, this.score));

    let verdict, confidence;

    if (this.score >= 75) {
      verdict = "Highly Favorable";
      confidence = 85;
    } else if (this.score >= 60) {
      verdict = "Favorable";
      confidence = 75;
    } else if (this.score >= 40) {
      verdict = "Neutral";
      confidence = 60;
    } else if (this.score >= 25) {
      verdict = "Unfavorable";
      confidence = 70;
    } else {
      verdict = "Highly Unfavorable";
      confidence = 80;
    }

    return {
      winProbability: Math.round(this.score),
      verdict,
      confidence,
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      recommendations: this.recommendations,
      estimatedTimeline: this.estimateTimeline(),
      estimatedCost: this.estimateCost(),
    };
  }
}