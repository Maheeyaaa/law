// backend/utils/scamDetector.js

import ScamPattern from "../models/ScamPattern.js";

// ══════════════════════════════════════════
// RULE-BASED SCAM DETECTION ENGINE
// ══════════════════════════════════════════

export class ScamDetector {
  constructor() {
    this.redFlags = [];
    this.score = 10; // Start with 10 (genuine), reduce for each red flag
  }

  // ══════════════════════════════════════════
  // 1. Check for suspicious phone numbers
  // ══════════════════════════════════════════
  checkPhoneNumbers(text) {
    // Indian phone number patterns
    const phonePatterns = [
      /\b[6-9]\d{9}\b/g, // 10-digit mobile
      /\b0\d{10}\b/g, // 11-digit with 0
      /\+91[-\s]?\d{10}\b/g, // +91 format
    ];

    const phones = [];
    phonePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) phones.push(...matches);
    });

    if (phones.length > 0) {
      // Government notices rarely include direct phone numbers
      // They use landlines or helpline numbers
      const hasLandline = /\b0\d{2,4}[-\s]?\d{6,8}\b/.test(text);

      if (!hasLandline && phones.length > 2) {
        this.redFlags.push({
          type: "suspicious_phone",
          message: `Found ${phones.length} mobile numbers: ${phones.join(", ")}. Genuine notices use official landlines.`,
          severity: "high",
          phones,
        });
        this.score -= 2;
      }
    }

    return phones;
  }

  // ══════════════════════════════════════════
  // 2. Check for bank account / UPI requests
  // ══════════════════════════════════════════
  checkPaymentRequests(text) {
    const paymentPatterns = [
      { pattern: /bank\s*account|a\/c\s*no|account\s*number/i, type: "bank_account" },
      { pattern: /\b\d{9,18}\b.*IFSC|IFSC.*\b\d{9,18}\b/i, type: "bank_details" },
      { pattern: /UPI|GPay|PhonePe|Paytm|@\w+/i, type: "upi" },
      { pattern: /transfer.*amount|send.*money|pay.*immediately/i, type: "payment_demand" },
      { pattern: /western\s*union|moneygram|bitcoin|cryptocurrency/i, type: "suspicious_payment" },
    ];

    paymentPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(text)) {
        this.redFlags.push({
          type: "payment_request",
          message: `Found ${type.replace("_", " ")}. Government notices NEVER ask for direct payments to personal accounts.`,
          severity: "critical",
        });
        this.score -= 3;
      }
    });
  }

  // ══════════════════════════════════════════
  // 3. Check for threatening language
  // ══════════════════════════════════════════
  checkThreats(text) {
    const threatPatterns = [
      { pattern: /arrest.*immediately|immediate\s*arrest/i, msg: "Immediate arrest threat" },
      { pattern: /warrant.*issued|arrest\s*warrant/i, msg: "Arrest warrant claim" },
      { pattern: /legal\s*action.*24\s*hours?|action.*within.*hours?/i, msg: "Unrealistic deadline" },
      { pattern: /seize.*property|freeze.*account|block.*account/i, msg: "Asset seizure threat" },
      { pattern: /criminal\s*case.*filed|FIR.*registered/i, msg: "Criminal case threat" },
      { pattern: /respond.*immediately|urgent.*response/i, msg: "Urgency pressure" },
      { pattern: /failure.*comply.*result/i, msg: "Compliance threat" },
    ];

    let threatCount = 0;

    threatPatterns.forEach(({ pattern, msg }) => {
      if (pattern.test(text)) {
        threatCount++;
        this.redFlags.push({
          type: "threatening_language",
          message: msg + ". Genuine notices use formal language without panic tactics.",
          severity: "high",
        });
      }
    });

    if (threatCount >= 3) {
      this.score -= 3;
    } else if (threatCount > 0) {
      this.score -= 1;
    }
  }

  // ══════════════════════════════════════════
  // 4. Check for grammatical errors
  // ══════════════════════════════════════════
  checkGrammar(text) {
    const errors = [];

    // Common scam grammar mistakes
    const grammarIssues = [
      { pattern: /\b(your|you're)\s+(account|case)\s+has\s+been\s+(suspend|block|freeze)/i, msg: "Incorrect verb form" },
      { pattern: /dear\s+(sir|customer|user)\s*,?\s*$/im, msg: "Generic greeting" },
      { pattern: /kindly\s+do\s+the\s+needful/i, msg: "Non-official phrasing" },
      { pattern: /revert\s+back/i, msg: "Redundant phrasing" },
      { pattern: /[a-z][A-Z]|[A-Z]{5,}/, msg: "Inconsistent capitalization" },
    ];

    grammarIssues.forEach(({ pattern, msg }) => {
      if (pattern.test(text)) {
        errors.push(msg);
      }
    });

    // Check for excessive punctuation
    if (/[!]{2,}|\?{2,}/.test(text)) {
      errors.push("Excessive punctuation (!!!)");
    }

    if (errors.length > 0) {
      this.redFlags.push({
        type: "grammar_errors",
        message: `Found ${errors.length} language issues: ${errors.join(", ")}`,
        severity: "medium",
      });
      this.score -= 1;
    }
  }

  // ══════════════════════════════════════════
  // 5. Check for official headers
  // ══════════════════════════════════════════
  checkOfficialFormat(text) {
    const hasOfficialElements = {
      header: /government\s+of\s+india|high\s+court|district\s+court|supreme\s+court/i.test(text),
      referenceNumber: /ref\.?\s*no\.?|file\s*no\.?|case\s*no\.?|notice\s*no\.?/i.test(text),
      date: /dated?:?\s*\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(text),
      signature: /signature|signed\s*by|registrar|judge/i.test(text),
      seal: /seal|stamp|court\s*seal/i.test(text),
    };

    const missingElements = [];

    if (!hasOfficialElements.header) missingElements.push("Official header");
    if (!hasOfficialElements.referenceNumber) missingElements.push("Reference number");
    if (!hasOfficialElements.date) missingElements.push("Proper date format");

    if (missingElements.length >= 2) {
      this.redFlags.push({
        type: "missing_official_elements",
        message: `Missing: ${missingElements.join(", ")}. Genuine notices have proper formatting.`,
        severity: "high",
      });
      this.score -= 2;
    }
  }

  // ══════════════════════════════════════════
  // 6. Check for suspicious URLs/links
  // ══════════════════════════════════════════
  checkURLs(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlPattern) || [];

    if (urls.length > 0) {
      const suspiciousUrls = urls.filter((url) => {
        // Check if it's NOT a government domain
        return !/\.(gov\.in|nic\.in|gov|court\.gov\.in)$/i.test(url);
      });

      if (suspiciousUrls.length > 0) {
        this.redFlags.push({
          type: "suspicious_urls",
          message: `Found non-government URLs: ${suspiciousUrls.join(", ")}. Genuine notices use .gov.in domains.`,
          severity: "critical",
          urls: suspiciousUrls,
        });
        this.score -= 2;
      }
    }
  }

  // ══════════════════════════════════════════
  // 7. Check for email addresses
  // ══════════════════════════════════════════
  checkEmails(text) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern) || [];

    if (emails.length > 0) {
      const suspiciousEmails = emails.filter((email) => {
        // Check if it's NOT a government email
        return !/(@gov\.in|@nic\.in|@court\.gov\.in)$/i.test(email);
      });

      if (suspiciousEmails.length > 0) {
        this.redFlags.push({
          type: "suspicious_email",
          message: `Found non-government emails: ${suspiciousEmails.join(", ")}. Official emails end with @gov.in`,
          severity: "high",
          emails: suspiciousEmails,
        });
        this.score -= 2;
      }
    }
  }

  // ══════════════════════════════════════════
  // 8. Check case number format
  // ══════════════════════════════════════════
  checkCaseNumber(text) {
    // Indian case number patterns: Civil Suit No. 123/2024
    const casePatterns = [
      /(?:case|suit|petition|writ|appeal)\s*no\.?\s*\d+\/\d{4}/i,
      /\b[A-Z]{2,5}\/\d+\/\d{4}\b/,
    ];

    let hasCaseNumber = false;
    casePatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        hasCaseNumber = true;
      }
    });

    // If it claims to be a court notice but has no case number
    if (/court|legal\s*notice|summons/i.test(text) && !hasCaseNumber) {
      this.redFlags.push({
        type: "missing_case_number",
        message: "Claims to be court notice but missing case number format",
        severity: "high",
      });
      this.score -= 2;
    }
  }

  // ══════════════════════════════════════════
  // 9. Check against database patterns
  // ══════════════════════════════════════════
  async checkDatabasePatterns(text) {
    try {
      const patterns = await ScamPattern.find({ isActive: true });

      for (const pattern of patterns) {
        let isMatch = false;

        if (pattern.isRegex) {
          const regex = new RegExp(pattern.pattern, "i");
          isMatch = regex.test(text);
        } else {
          isMatch = text.toLowerCase().includes(pattern.pattern.toLowerCase());
        }

        if (isMatch) {
          this.redFlags.push({
            type: "known_scam_pattern",
            message: pattern.description,
            severity: pattern.severity,
            pattern: pattern.pattern,
          });

          // Update report count
          pattern.reportCount += 1;
          pattern.lastReported = new Date();
          await pattern.save();

          // Deduct score based on severity
          const scoreDeduction = {
            low: 0.5,
            medium: 1,
            high: 2,
            critical: 3,
          };
          this.score -= scoreDeduction[pattern.severity];
        }
      }
    } catch (error) {
      console.error("Database pattern check error:", error);
    }
  }

  // ══════════════════════════════════════════
  // MASTER ANALYSIS FUNCTION
  // ══════════════════════════════════════════
  async analyze(text) {
    // Reset
    this.redFlags = [];
    this.score = 10;

    // Run all checks
    this.checkPhoneNumbers(text);
    this.checkPaymentRequests(text);
    this.checkThreats(text);
    this.checkGrammar(text);
    this.checkOfficialFormat(text);
    this.checkURLs(text);
    this.checkEmails(text);
    this.checkCaseNumber(text);
    await this.checkDatabasePatterns(text);

    // Ensure score stays in 1-10 range
    this.score = Math.max(1, Math.min(10, this.score));

    // Determine verdict
    let verdict = "✅ Likely Genuine";
    let verdictColor = "green";

    if (this.score <= 3) {
      verdict = "🚩 Likely Fake/Scam";
      verdictColor = "red";
    } else if (this.score <= 6) {
      verdict = "⚠️ Suspicious - Verify Carefully";
      verdictColor = "orange";
    }

    return {
      score: this.score,
      verdict,
      verdictColor,
      redFlags: this.redFlags,
      totalRedFlags: this.redFlags.length,
      criticalFlags: this.redFlags.filter((f) => f.severity === "critical").length,
      highFlags: this.redFlags.filter((f) => f.severity === "high").length,
    };
  }
}

// ══════════════════════════════════════════
// Helper: Seed initial scam patterns
// ══════════════════════════════════════════
export async function seedScamPatterns() {
  try {
    const count = await ScamPattern.countDocuments();
    if (count > 0) return; // Already seeded

    const initialPatterns = [
      {
        type: "keyword",
        pattern: "your account will be suspended",
        description: "Common phishing threat",
        severity: "high",
      },
      {
        type: "keyword",
        pattern: "verify your KYC immediately",
        description: "Fake KYC scam",
        severity: "critical",
      },
      {
        type: "threat_pattern",
        pattern: "arrest within 24 hours",
        description: "Unrealistic arrest threat",
        severity: "critical",
      },
      {
        type: "payment_pattern",
        pattern: "pay fine immediately to avoid",
        description: "Immediate payment scam",
        severity: "critical",
      },
      {
        type: "url",
        pattern: "bit.ly",
        description: "Shortened URL - often used in scams",
        severity: "medium",
      },
      {
        type: "keyword",
        pattern: "courier company",
        description: "Fake courier scam",
        severity: "high",
      },
      {
        type: "keyword",
        pattern: "income tax refund",
        description: "Fake tax refund scam",
        severity: "high",
      },
    ];

    await ScamPattern.insertMany(initialPatterns);
    console.log("✅ Scam patterns seeded");
  } catch (error) {
    console.error("Seed error:", error);
  }
}