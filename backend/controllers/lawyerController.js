import ScrapedLawyer from "../models/ScrapedLawyer.js";
import { rankLawyersForCase } from "../utils/recommendationScore.js";
import { generateEmailTemplate } from "../utils/emailTemplate.js";

// ══════════════════════════════════════════════════════════════════
// Browse All Lawyers
// ══════════════════════════════════════════════════════════════════
export const browseLawyers = async (req, res) => {
  try {
    const {
      search,
      district,
      specialization,
      sortBy = "name",
      page   = 1,
      limit  = 12,
    } = req.query;

    // ── Build filter ──────────────────────────────────────────
    const filter = { isActive: true };

    if (district) filter.district = district;

    if (specialization) {
      filter.$or = [
        { specialization:  { $regex: specialization, $options: "i" } },
        { specializations: { $elemMatch: { $regex: specialization, $options: "i" } } },
      ];
    }

    if (search) {
      const phoneSearch   = search.replace(/\D/g, "");
      const isPhoneSearch = phoneSearch.length >= 4;
      filter.$or = [
        { name:           { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { email:          { $regex: search, $options: "i" } },
        ...(isPhoneSearch ? [{ phone: { $regex: phoneSearch } }] : []),
      ];
    }

    // ── Sort ──────────────────────────────────────────────────
    const sortMap = {
      name:       { name:  1 },
      "name-z":   { name: -1 },
      experience: { experience: -1 },
      newest:     { createdAt: -1 },
      verified:   { isVerified: -1, name: 1 },
    };
    const sort = sortMap[sortBy] || { name: 1 };
    const skip = (Number(page) - 1) * Number(limit);

    // ── Query ─────────────────────────────────────────────────
    const [lawyers, total, allDistricts] = await Promise.all([
      ScrapedLawyer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ScrapedLawyer.countDocuments(filter),
      ScrapedLawyer.distinct("district", {
        isActive: true,
        district: { $nin: ["", null] },
      }),
    ]);

    // ── All specializations (for filter dropdown) ─────────────
    const allLawyersForFilters = await ScrapedLawyer.find(
    { isActive: true },
    { specializations: 1, specialization: 1, district: 1, city: 1 }
  ).lean();

  const allSpecs = [
    ...new Set([
      ...allLawyersForFilters.flatMap((l) => l.specializations || []),
      ...allLawyersForFilters.map((l) => l.specialization).filter(Boolean),
    ]),
  ].sort();

  // ── Cities grouped by district ──
  const citiesByDistrict = {};
  allLawyersForFilters.forEach((l) => {
    if (!l.district || !l.city) return;
    if (!citiesByDistrict[l.district]) {
      citiesByDistrict[l.district] = new Set();
    }
    citiesByDistrict[l.district].add(l.city);
  });

  // Convert Sets to sorted arrays
  const cityMap = {};
  Object.entries(citiesByDistrict).forEach(([dist, citySet]) => {
    cityMap[dist] = [...citySet].sort();
  });

    return res.json({
      success:    true,
      lawyers,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      filters: {
        districts:       allDistricts.filter(Boolean).sort(),
        specializations: allSpecs,
        citiesByDistrict: cityMap,
      },
    });

  } catch (error) {
    console.error("[browseLawyers]", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// Recommend Lawyers for a Case Type
// ══════════════════════════════════════════════════════════════════
export const recommendLawyers = async (req, res) => {
  try {
    const { caseType, district, city, limit = 10 } = req.query;

    if (!caseType) {
      return res.status(400).json({
        success: false,
        message: "caseType is required",
      });
    }

    // ── Fetch ALL active lawyers (small dataset, OK to rank in memory) ──
    const allLawyers = await ScrapedLawyer.find({ isActive: true }).lean();

    // ── Rank using our scoring engine ────────────────────────
    const ranked = rankLawyersForCase(allLawyers, {
      caseType,
      district,
      city,
    });

    // ── Only return lawyers with at least specialization match ──
    const filtered = ranked.filter((l) => l.specializationMatch);

    // ── If no specialization matches, return top by location ──
    const results = filtered.length > 0
      ? filtered
      : ranked.filter((l) => l.matchScore > 0);

    res.json({
      success:     true,
      caseType,
      district:    district || "All Telangana",
      city:        city     || null,
      total:       results.length,
      recommended: results.slice(0, Number(limit)),
    });

  } catch (error) {
    console.error("[recommendLawyers]", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// Generate Contact Email
// ══════════════════════════════════════════════════════════════════
export const generateContactEmail = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const {
      caseType,
      caseLocation,
      aiSummary,
      documentAttached = false,
    } = req.body;

    const lawyer = await ScrapedLawyer.findById(lawyerId).lean();

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    if (!lawyer.email) {
      return res.status(400).json({
        success: false,
        message: "This lawyer has no email on record",
      });
    }

    const user      = req.user;
    const emailData = generateEmailTemplate({
      userName:         user.name,
      userEmail:        user.email,
      userPhone:        user.phone || "Not provided",
      caseType:         caseType || "Legal Matter",
      caseLocation:     caseLocation || lawyer.district || "Telangana",
      aiSummary:        aiSummary || "",
      lawyerName:       lawyer.name,
      lawyerEmail:      lawyer.email,
      documentAttached,
    });

    res.json({
      success: true,
      lawyer:  { name: lawyer.name, email: lawyer.email },
      email:   emailData,
    });

  } catch (error) {
    console.error("[generateContactEmail]", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// Get Single Lawyer Profile
// ══════════════════════════════════════════════════════════════════
export const getLawyerProfile = async (req, res) => {
  try {
    const lawyer = await ScrapedLawyer.findById(req.params.id).lean();

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    res.json({ success: true, lawyer });

  } catch (error) {
    console.error("[getLawyerProfile]", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};