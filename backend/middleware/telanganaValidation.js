// backend/middleware/telanganaValidation.js

import { STATE, DISTRICTS, COURTS } from "../constants/telangana.js";

// Validate that district belongs to Telangana
export const validateDistrict = (req, res, next) => {
  const { district } = req.body;

  if (!district) {
    return res.status(400).json({
      message: "District is required",
    });
  }

  if (!DISTRICTS.includes(district)) {
    return res.status(400).json({
      message: `Invalid district. Must be a district in ${STATE}`,
      validDistricts: DISTRICTS,
    });
  }

  next();
};

// Validate that court exists and belongs to selected district
export const validateCourt = (req, res, next) => {
  const { district, courtName } = req.body;

  if (!courtName) {
    return res.status(400).json({
      message: "Court name is required",
    });
  }

  // Find the court
  const court = COURTS.find((c) => c.name === courtName);

  if (!court) {
    return res.status(400).json({
      message: "Invalid court name",
      validCourts: COURTS.map((c) => c.name),
    });
  }

  // If district is provided, verify court belongs to that district
  if (district && court.district !== district) {
    return res.status(400).json({
      message: `Court "${courtName}" does not belong to ${district} district`,
      suggestion: `Please select a court from ${district}`,
    });
  }

  next();
};

// Validate state is Telangana (for future multi-state support)
export const validateState = (req, res, next) => {
  const { state } = req.body;

  // If state is provided, it must be Telangana
  if (state && state !== STATE) {
    return res.status(400).json({
      message: `This application currently supports only ${STATE} state`,
    });
  }

  // If not provided, set it to Telangana
  if (!state) {
    req.body.state = STATE;
  }

  next();
};

// Combined validation for user registration
export const validateUserLocation = [validateState, validateDistrict];

// Combined validation for case filing
export const validateCaseLocation = [validateState, validateDistrict, validateCourt];