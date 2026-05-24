import express from "express";

import {
  DISTRICTS,
  SPECIALIZATIONS,
  LANGUAGES,
  STATE,
} from "../constants/telangana.js";

const router =
  express.Router();

// ======================
// All
// ======================

router.get(
  "/",

  (
    req,
    res
  ) => {
    res.json({
      state:
        STATE,

      districts:
        DISTRICTS,

      specializations:
        SPECIALIZATIONS,

      languages:
        LANGUAGES,
    });
  }
);

// ======================
// Districts
// ======================

router.get(
  "/districts",

  (
    req,
    res
  ) => {
    res.json({
      state:
        STATE,

      districts:
        DISTRICTS,
    });
  }
);

// ======================
// Languages
// ======================

router.get(
  "/languages",

  (
    req,
    res
  ) => {
    res.json({
      languages:
        LANGUAGES,
    });
  }
);

// ======================
// Lawyer Categories
// ======================

router.get(
  "/specializations",

  (
    req,
    res
  ) => {
    res.json({
      specializations:
        SPECIALIZATIONS,
    });
  }
);

export default router;