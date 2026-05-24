// backend/utils/scamDetector.js

import ScamPattern from "../models/ScamPattern.js";

export class ScamDetector {
  constructor() {
    this.reset();
  }

  reset() {
    this.redFlags = [];
    this.score = 10;
  }

  addFlag(type, message, severity = "medium", extra = {}) {
    this.redFlags.push({
      type,
      message,
      severity,
      ...extra,
    });

    const deductions = {
      low: 0.5,
      medium: 1,
      high: 2,
      critical: 3,
    };

    this.score -= deductions[severity] || 1;
  }

  checkPhoneNumbers(text) {
    const matches =
      text.match(
        /\b(?:\+91[- ]?)?[6-9]\d{9}\b/g
      ) || [];

    if (matches.length > 2) {
      this.addFlag(
        "phone_numbers",
        "Multiple personal phone numbers detected. Verify using official contact channels.",
        "high",
        { phones: matches }
      );
    }
  }

  checkPaymentRequests(text) {
    const patterns = [
      /UPI|GPay|PhonePe|Paytm/i,
      /transfer.*money/i,
      /pay.*immediately/i,
      /account\s*number/i,
      /IFSC/i,
    ];

    const found =
      patterns.some((p) =>
        p.test(text)
      );

    if (found) {
      this.addFlag(
        "payment_request",
        "Direct payment requests should be verified through official sources.",
        "critical"
      );
    }
  }

  checkThreats(text) {
    const patterns = [
      /arrest.*immediately/i,
      /within.*24.*hours/i,
      /freeze.*account/i,
      /legal.*action/i,
      /urgent.*response/i,
    ];

    const count =
      patterns.filter((p) =>
        p.test(text)
      ).length;

    if (count >= 3) {
      this.addFlag(
        "pressure_language",
        "Urgent or threatening language detected.",
        "high"
      );
    }
  }

  checkGrammar(text) {
    const patterns = [
      /revert\s+back/i,
      /kindly\s+do\s+the\s+needful/i,
      /[A-Z]{10,}/,
    ];

    const count =
      patterns.filter((p) =>
        p.test(text)
      ).length;

    if (count) {
      this.addFlag(
        "language_quality",
        "Unusual wording or formatting detected.",
        "medium"
      );
    }
  }

  checkOfficialFormat(text) {
    const checks = {
      header:
        /government|court|ministry|advocate|legal notice|law office/i.test(text),

      reference:
        /ref|notice|case/i.test(text),

      date:
        /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(
          text
        ),
    };

    const missing =
      Object.values(
        checks
      ).filter(
        (v) => !v
      ).length;

    if (missing >= 2) {
      this.addFlag(
        "missing_structure",
        "Expected official formatting elements are missing.",
        "medium"
      );
    }
  }

  checkURLs(text) {
    const urls =
      text.match(
        /(https?:\/\/[^\s]+)/g
      ) || [];

    const suspicious =
      urls.filter(
        (u)=>
          /bit\.ly|tinyurl|shorturl/i.test(u)
      );

    if (suspicious.length) {
      this.addFlag(
        "urls",
        "External links detected. Verify before opening.",
        "critical",
        { urls: suspicious }
      );
    }
  }

  checkEmails(text) {
    const emails =
      text.match(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
      ) || [];

    const suspiciousDomains = [
      "tempmail",
      "10minutemail",
      "mailinator",
      "guerrillamail",
    ];

    const suspicious =
      emails.filter((e) =>
        suspiciousDomains.some((d) =>
          e.toLowerCase().includes(d)
        )
      );

    if (suspicious.length) {
      this.addFlag(
        "emails",
        "Temporary or suspicious email domains detected.",
        "high",
        { emails: suspicious }
      );
    }
  }

  async checkDatabasePatterns(text) {
    try {
      const patterns =
        await ScamPattern.find({
          isActive: true,
        });

      for (const item of patterns) {
        let matched = false;

        if (item.isRegex) {
          try {
            matched =
              new RegExp(
                item.pattern,
                "i"
              ).test(text);
          } catch {
            continue;
          }
        } else {
          matched =
            text
              .toLowerCase()
              .includes(
                item.pattern.toLowerCase()
              );
        }

        if (matched) {
          item.reportCount += 1;
          item.lastReported =
            new Date();

          await item.save();

          this.addFlag(
            "known_pattern",
            item.description,
            item.severity
          );
        }
      }
    } catch (err) {
      console.error(
        err
      );
    }
  }

  async analyze(text) {
    this.reset();

    this.checkPhoneNumbers(text);
    this.checkPaymentRequests(text);
    this.checkThreats(text);
    this.checkGrammar(text);
    this.checkOfficialFormat(text);
    this.checkURLs(text);
    this.checkEmails(text);

    await this.checkDatabasePatterns(
      text
    );

    if (
      this.redFlags.length === 0
    ) {
      this.score = Math.min(
        10,
        this.score + 1
      );
    }

    this.score =
      Math.max(
        1,
        Math.min(
          10,
          this.score
        )
      );

    let verdict =
      "Likely Genuine";

    if (this.score <= 3) {
      verdict =
        "Likely Scam";
    } else if (
      this.score <= 6
    ) {
      verdict =
        "Needs Verification";
    }

    return {
      score: this.score,
      verdict,
      redFlags:
        this.redFlags,
      totalRedFlags:
        this.redFlags.length,
    };
  }
}

export async function seedScamPatterns() {
  if (
    await ScamPattern.countDocuments()
  ) {
    return;
  }

  await ScamPattern.insertMany([
    {
      type: "keyword",
      pattern:
        "verify your KYC immediately",
      description:
        "Suspicious KYC pressure",
      severity:
        "critical",
    },
    {
      type: "keyword",
      pattern:
        "pay immediately",
      description:
        "Immediate payment pressure",
      severity:
        "critical",
    },
  ]);
}