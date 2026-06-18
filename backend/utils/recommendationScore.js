/**
 * LegalMind Recommendation Engine
 * 
 * Simple, transparent, defensible scoring:
 *   70% Specialization match
 *   20% District match
 *   10% City match
 *   +5  Verified bonus
 */

// ─── Helpers ───────────────────────────────────────────────────────
const normalize = (str) => (str || "").toLowerCase().trim();

const lawyerHasSpecialization = (lawyer, caseType) => {
  if (!caseType) return false;

  const target = normalize(caseType);

  // Check primary specialization
  if (normalize(lawyer.specialization).includes(target)) {
    return { match: true, matchedOn: lawyer.specialization };
  }

  // Check specializations array
  if (Array.isArray(lawyer.specializations)) {
    const found = lawyer.specializations.find((s) =>
      normalize(s).includes(target) || target.includes(normalize(s))
    );
    if (found) return { match: true, matchedOn: found };
  }

  return { match: false, matchedOn: null };
};

// ─── Main Scorer ───────────────────────────────────────────────────
export const scoreLawyer = (lawyer, { caseType, district, city }) => {
  let score = 0;
  const reasons = [];

  // 1️⃣ Specialization match — 70%
  const specCheck = lawyerHasSpecialization(lawyer, caseType);
  if (specCheck.match) {
    score += 70;
    reasons.push(`Specializes in ${specCheck.matchedOn}`);
  }

  // 2️⃣ District match — 20%
  if (district && normalize(lawyer.district) === normalize(district)) {
    score += 20;
    reasons.push(`Located in ${lawyer.district}`);
  }

  // 3️⃣ City match — 10%
  if (city && normalize(lawyer.city) === normalize(city)) {
    score += 10;
    reasons.push(`Available in ${lawyer.city}`);
  }

  // 4️⃣ Verified bonus — +5
  if (lawyer.isVerified) {
    score += 5;
    reasons.push("Verified Advocate");
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Fallback reason
  if (reasons.length === 0) {
    reasons.push("Available for consultation");
  }

  return {
    matchScore:          score,
    specializationMatch: specCheck.match,
    matchedSpec:         specCheck.matchedOn,
    matchReasons:        reasons,
  };
};

// ─── Ranker ────────────────────────────────────────────────────────
export const rankLawyersForCase = (lawyers, filters) => {
  const scored = lawyers.map((lawyer) => {
    const result = scoreLawyer(lawyer, filters);
    return {
      ...lawyer,
      ...result,
    };
  });

  // Sort: specialization match first, then by score, then verified
  return scored.sort((a, b) => {
    // Specialization match wins
    if (a.specializationMatch && !b.specializationMatch) return -1;
    if (!a.specializationMatch && b.specializationMatch) return 1;

    // Then by score
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;

    // Then verified
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;

    return 0;
  });
};