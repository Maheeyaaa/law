// backend/routes/locationRoutes.js

import express from "express";
import { DISTRICTS, COURTS, SPECIALIZATIONS, LANGUAGES, STATE, getCourtsByDistrict } from "../constants/telangana.js";

const router = express.Router();

// Get all location data (no auth needed — used in registration & case filing)
router.get("/", (req, res) => {
  res.json({
    state: STATE,
    districts: DISTRICTS,
    courts: COURTS.map(c => c.name),
    specializations: SPECIALIZATIONS,
    languages: LANGUAGES,
  });
});

// Get districts only
router.get("/districts", (req, res) => {
  res.json({ state: STATE, districts: DISTRICTS });
});

// Get courts, optionally filtered by district
router.get("/courts", (req, res) => {
  const { district } = req.query;
  
  if (district) {
    const filtered = COURTS.filter(c => c.district === district);
    res.json({ district, courts: filtered });
  } else {
    res.json({ courts: COURTS });
  }
});

// Get specializations
router.get("/specializations", (req, res) => {
  res.json({ specializations: SPECIALIZATIONS });
});

router.get("/languages", (req, res) => {
  res.json({ languages: LANGUAGES });
});

export default router;