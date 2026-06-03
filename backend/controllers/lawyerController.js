import User from "../models/User.js";

// ══════════════════════════════════════════════════════════════════
// Browse Lawyers (Citizen View)
// ══════════════════════════════════════════════════════════════════

export const browseLawyers = async (req, res) => {
  try {
    const {
      search,
      district,
      specialization,
      sortBy = "name",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { role: "lawyer" };

    if (district) {
      filter.district = district;
    }

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name:                  { $regex: search, $options: "i" } },
        { barCouncilNumber:      { $regex: search, $options: "i" } },
        { proBonoRegistrationNo: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options
    const sortMap = {
      name:     { name: 1 },
      "name-z": { name: -1 },
      newest:   { createdAt: -1 },
    };
    const sort = sortMap[sortBy] || { name: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [lawyers, total, allDistricts, allSpecializations] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),

      User.countDocuments(filter),

      // Get unique districts that have lawyers
      User.distinct("district", { role: "lawyer", district: { $nin: ["", null] } }),

      // Get unique specializations that have lawyers
      User.distinct("specialization", { role: "lawyer", specialization: { $nin: ["", null] } }),
    ]);

    res.json({
      success: true,
      lawyers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      filters: {
        districts:       allDistricts.filter(Boolean).sort(),
        specializations: allSpecializations.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("[browseLawyers] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
// Get Single Lawyer Profile
// ══════════════════════════════════════════════════════════════════

export const getLawyerProfile = async (req, res) => {
  try {
    const lawyer = await User.findOne({
      _id: req.params.id,
      role: "lawyer",
    }).select("-password");

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    const isProBono = lawyer.importedFrom === "DoJ Pro Bono";

    res.json({
      success: true,
      lawyer: {
        ...lawyer.toObject(),
        isContactOnly: isProBono,
      },
      contact: isProBono
        ? {
            portal:   "https://www.probono-doj.in",
            helpline: "15100",
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};