// backend/controllers/hearingController.js
import Hearing from "../models/Hearing.js";
import Case from "../models/Case.js";

// Get all hearings for logged-in citizen
export const getMyHearings = async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    const filter = { citizen: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (upcoming === "true") {
      filter.hearingDate = { $gte: new Date() };
      filter.status = "Scheduled";
    }

    const hearings = await Hearing.find(filter)
      .populate("case", "caseId title caseType status")
      .sort({ hearingDate: 1 });

    res.json({ hearings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get next upcoming hearing
export const getNextHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      citizen: req.user.id,
      hearingDate: { $gte: new Date() },
      status: "Scheduled",
    })
      .populate("case", "caseId title caseType")
      .sort({ hearingDate: 1 });

    res.json({ hearing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get hearing by ID
export const getHearingById = async (req, res) => {
  try {
    const hearing = await Hearing.findOne({
      _id: req.params.id,
      citizen: req.user.id,
    }).populate("case", "caseId title caseType status");

    if (!hearing) {
      return res.status(404).json({ message: "Hearing not found" });
    }

    res.json({ hearing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};