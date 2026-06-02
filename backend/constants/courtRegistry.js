// backend/constants/courtRegistry.js
// ══════════════════════════════════════════════════════════════════
// MASTER COURT REGISTRY
// Every court in Telangana is registered here with:
//   - provider: which service handles tracking
//   - courtCode: identifier used by that provider's API
//   - stateCode: for eCourts API
//   - districtCode: for eCourts API
//   - captchaProvider: which captcha endpoint to use
//   - caseTypeSet: which set of case types apply
//   - supported: false = show in UI but display "coming soon"
// ══════════════════════════════════════════════════════════════════

export const PROVIDERS = {
  TELANGANA_HC:    "TELANGANA_HC",    // csis.tshc.gov.in
  ECOURTS:         "ECOURTS",         // services.ecourts.gov.in
  CONSUMER_COURT:  "CONSUMER_COURT",  // confonet.nic.in (future)
  TRIBUNAL:        "TRIBUNAL",        // various (future)
  UNSUPPORTED:     "UNSUPPORTED",     // show coming soon
};

export const CAPTCHA_PROVIDERS = {
  TELANGANA_HC: "TELANGANA_HC",   // https://csis.tshc.gov.in/generateCaptcha
  ECOURTS:      "ECOURTS",        // https://services.ecourts.gov.in captcha
  NONE:         "NONE",           // no captcha needed
};

export const CASE_TYPE_SETS = {
  TELANGANA_HC: "TELANGANA_HC",   // your existing CASE_TYPES array
  ECOURTS_DC:   "ECOURTS_DC",     // district court types
  CONSUMER:     "CONSUMER",       // consumer court types
  TRIBUNAL:     "TRIBUNAL",       // tribunal types
};

// ── The Registry ───────────────────────────────────────────────────
// Key = exact string shown in the frontend dropdown
// This is the SINGLE SOURCE OF TRUTH for all court routing

export const COURT_REGISTRY = {

  // ── Telangana High Court ──────────────────────────────────────────
  "Telangana High Court, Hyderabad": {
    displayName:     "Telangana High Court, Hyderabad",
    provider:        PROVIDERS.TELANGANA_HC,
    captchaProvider: CAPTCHA_PROVIDERS.TELANGANA_HC,
    caseTypeSet:     CASE_TYPE_SETS.TELANGANA_HC,
    courtCode:       "TSHC",
    stateCode:       "18",        // Telangana state code in eCourts
    districtCode:    null,        // HC is not district-specific
    supported:       true,
    notes:           "Uses csis.tshc.gov.in API",
  },

  // ── District Courts — eCourts ─────────────────────────────────────
  "District Court, Hyderabad": {
    displayName:     "District Court, Hyderabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18001",     // eCourts state+district code
    stateCode:       "18",
    districtCode:    "01",
    estCode:         "001",       // establishment code
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "City Civil Court, Hyderabad": {
    displayName:     "City Civil Court, Hyderabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18001",
    stateCode:       "18",
    districtCode:    "01",
    estCode:         "002",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "Family Court, Hyderabad": {
    displayName:     "Family Court, Hyderabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18001",
    stateCode:       "18",
    districtCode:    "01",
    estCode:         "003",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Rangareddy": {
    displayName:     "District Court, Rangareddy",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18002",
    stateCode:       "18",
    districtCode:    "02",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Medchal-Malkajgiri": {
    displayName:     "District Court, Medchal-Malkajgiri",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18003",
    stateCode:       "18",
    districtCode:    "03",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Sangareddy": {
    displayName:     "District Court, Sangareddy",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18004",
    stateCode:       "18",
    districtCode:    "04",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Warangal": {
    displayName:     "District Court, Warangal",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18005",
    stateCode:       "18",
    districtCode:    "05",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Karimnagar": {
    displayName:     "District Court, Karimnagar",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18006",
    stateCode:       "18",
    districtCode:    "06",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Nizamabad": {
    displayName:     "District Court, Nizamabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18007",
    stateCode:       "18",
    districtCode:    "07",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Khammam": {
    displayName:     "District Court, Khammam",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18008",
    stateCode:       "18",
    districtCode:    "08",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Nalgonda": {
    displayName:     "District Court, Nalgonda",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18009",
    stateCode:       "18",
    districtCode:    "09",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Adilabad": {
    displayName:     "District Court, Adilabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18010",
    stateCode:       "18",
    districtCode:    "10",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Mahabubnagar": {
    displayName:     "District Court, Mahabubnagar",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18011",
    stateCode:       "18",
    districtCode:    "11",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Mancherial": {
    displayName:     "District Court, Mancherial",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18012",
    stateCode:       "18",
    districtCode:    "12",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Peddapalli": {
    displayName:     "District Court, Peddapalli",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18013",
    stateCode:       "18",
    districtCode:    "13",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Jagtial": {
    displayName:     "District Court, Jagtial",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18014",
    stateCode:       "18",
    districtCode:    "14",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Medak": {
    displayName:     "District Court, Medak",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18015",
    stateCode:       "18",
    districtCode:    "15",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Siddipet": {
    displayName:     "District Court, Siddipet",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18016",
    stateCode:       "18",
    districtCode:    "16",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Suryapet": {
    displayName:     "District Court, Suryapet",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18017",
    stateCode:       "18",
    districtCode:    "17",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Yadadri Bhuvanagiri": {
    displayName:     "District Court, Yadadri Bhuvanagiri",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18018",
    stateCode:       "18",
    districtCode:    "18",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Nagarkurnool": {
    displayName:     "District Court, Nagarkurnool",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18019",
    stateCode:       "18",
    districtCode:    "19",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  "District Court, Wanaparthy": {
    displayName:     "District Court, Wanaparthy",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: CAPTCHA_PROVIDERS.ECOURTS,
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18020",
    stateCode:       "18",
    districtCode:    "20",
    estCode:         "001",
    supported:       true,
    notes:           "Uses services.ecourts.gov.in",
  },

  // ── Consumer Courts ───────────────────────────────────────────────
  "Labour Court, Hyderabad": {
    displayName:     "Labour Court, Hyderabad",
    provider:        PROVIDERS.UNSUPPORTED,
    captchaProvider: CAPTCHA_PROVIDERS.NONE,
    caseTypeSet:     CASE_TYPE_SETS.TRIBUNAL,
    courtCode:       null,
    stateCode:       "18",
    districtCode:    null,
    supported:       false,
    comingSoon:      true,
    notes:           "No public API available yet",
  },

  "Consumer Court, Hyderabad": {
    displayName:     "Consumer Court, Hyderabad",
    provider:        PROVIDERS.CONSUMER_COURT,
    captchaProvider: CAPTCHA_PROVIDERS.NONE,
    caseTypeSet:     CASE_TYPE_SETS.CONSUMER,
    courtCode:       "TSDRC-01",
    stateCode:       "18",
    districtCode:    "01",
    supported:       false,   // flip to true when implemented
    comingSoon:      true,
    notes:           "Will use confonet.nic.in",
  },

  "Telangana State Consumer Disputes Redressal Commission": {
    displayName:     "Telangana State Consumer Disputes Redressal Commission",
    provider:        PROVIDERS.CONSUMER_COURT,
    captchaProvider: CAPTCHA_PROVIDERS.NONE,
    caseTypeSet:     CASE_TYPE_SETS.CONSUMER,
    courtCode:       "TSSCDRC",
    stateCode:       "18",
    districtCode:    null,
    supported:       false,
    comingSoon:      true,
    notes:           "Will use confonet.nic.in",
  },

  "Telangana Administrative Tribunal": {
    displayName:     "Telangana Administrative Tribunal",
    provider:        PROVIDERS.TRIBUNAL,
    captchaProvider: CAPTCHA_PROVIDERS.NONE,
    caseTypeSet:     CASE_TYPE_SETS.TRIBUNAL,
    courtCode:       "TAT",
    stateCode:       "18",
    districtCode:    null,
    supported:       false,
    comingSoon:      true,
    notes:           "Separate portal - future integration",
  },
};

// ── Helper Functions ───────────────────────────────────────────────

/**
 * Get court config by court name string
 * Returns null if court not registered
 */
export const getCourtConfig = (courtName) => {
  return COURT_REGISTRY[courtName] || null;
};

/**
 * Get provider for a given court name
 */
export const getProviderForCourt = (courtName) => {
  const config = getCourtConfig(courtName);
  return config?.provider || PROVIDERS.UNSUPPORTED;
};

/**
 * Get captcha provider for a given court
 */
export const getCaptchaProviderForCourt = (courtName) => {
  const config = getCourtConfig(courtName);
  return config?.captchaProvider || CAPTCHA_PROVIDERS.NONE;
};

/**
 * Is this court currently supported for tracking?
 */
export const isCourtSupported = (courtName) => {
  const config = getCourtConfig(courtName);
  return config?.supported === true;
};

/**
 * Get all courts as array for dropdowns
 */
export const getAllCourts = () => {
  return Object.values(COURT_REGISTRY);
};

/**
 * Get only supported courts
 */
export const getSupportedCourts = () => {
  return Object.values(COURT_REGISTRY).filter((c) => c.supported);
};