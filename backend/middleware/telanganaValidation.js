import {
  STATE,
  DISTRICTS,
} from "../constants/telangana.js";

// ======================
// Validate State
// ======================

export const validateState =
(
  req,
  res,
  next
) => {
  const {
    state,
  } =
    req.body;

  if (
    state &&
    state !==
      STATE
  ) {
    return res
      .status(
        400
      )
      .json({
        message:
          `Currently only ${STATE} is supported`,
      });
  }

  // Default state

  if (
    !state
  ) {
    req.body.state =
      STATE;
  }

  next();
};

// ======================
// Validate District
// ======================

export const validateDistrict =
(
  req,
  res,
  next
) => {
  const {
    district,
  } =
    req.body;

  if (
    !district
  ) {
    return res
      .status(
        400
      )
      .json({
        message:
          "District is required",
      });
  }

  if (
    !DISTRICTS.includes(
      district
    )
  ) {
    return res
      .status(
        400
      )
      .json({
        message:
          "Invalid Telangana district",

        validDistricts:
          DISTRICTS,
      });
  }

  next();
};

// ======================
// Combined Validation
// ======================

export const validateUserLocation =
[
  validateState,
  validateDistrict,
];