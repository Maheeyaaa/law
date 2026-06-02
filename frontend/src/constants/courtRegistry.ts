// frontend/src/constants/courtRegistry.ts
// ══════════════════════════════════════════════════════════════════
// MASTER COURT REGISTRY — Frontend mirror of backend registry
// ══════════════════════════════════════════════════════════════════

export const PROVIDERS = {
  TELANGANA_HC:   "TELANGANA_HC",
  ECOURTS:        "ECOURTS",
  CONSUMER_COURT: "CONSUMER_COURT",
  TRIBUNAL:       "TRIBUNAL",
  UNSUPPORTED:    "UNSUPPORTED",
} as const;

export type Provider = typeof PROVIDERS[keyof typeof PROVIDERS];

export const CASE_TYPE_SETS = {
  TELANGANA_HC: "TELANGANA_HC",
  ECOURTS_DC:   "ECOURTS_DC",
  FAMILY_COURT:  "FAMILY_COURT",
  CONSUMER:     "CONSUMER",
  TRIBUNAL:     "TRIBUNAL",
} as const;

export type CaseTypeSet = typeof CASE_TYPE_SETS[keyof typeof CASE_TYPE_SETS];

// ── Court Complex type (eCourts specific) ─────────────────────────
export interface CourtComplex {
  name:      string;
  estCode:   string;   // establishment code for eCourts API
}

export interface CourtConfig {
  displayName:     string;
  provider:        Provider;
  captchaProvider: string;
  caseTypeSet:     CaseTypeSet;
  courtCode:       string | null;
  stateCode:       string;
  districtCode:    string | null;
  supported:       boolean;
  comingSoon?:     boolean;
  // eCourts specific — list of court complexes in this district
  complexes?:      CourtComplex[];
}

// ── eCourts District Court Case Types ────────────────────────────
// These are the ACTUAL case types used in Telangana District Courts
// Different from High Court types (no AS, WP, CRLA etc.)
export const ECOURTS_DC_CASE_TYPES = [
  { label: "CC - Criminal Case",                    value: "CC",    mtype: 1  },
  { label: "CS - Civil Suit",                       value: "CS",    mtype: 2  },
  { label: "CMA - Civil Miscellaneous Appeal",      value: "CMA",   mtype: 3  },
  { label: "CMP - Civil Miscellaneous Petition",    value: "CMP",   mtype: 4  },
  { label: "EP - Execution Petition",               value: "EP",    mtype: 5  },
  { label: "LA - Land Acquisition Case",            value: "LA",    mtype: 6  },
  { label: "MAC - Motor Accident Claim",            value: "MAC",   mtype: 7  },
  { label: "MC - Matrimonial Case",                 value: "MC",    mtype: 8  },
  { label: "OP - Original Petition",                value: "OP",    mtype: 9  },
  { label: "OS - Original Suit",                    value: "OS",    mtype: 10 },
  { label: "RA - Rent Appeal",                      value: "RA",    mtype: 11 },
  { label: "RC - Revision Case",                    value: "RC",    mtype: 12 },
  { label: "RCA - Regular Civil Appeal",            value: "RCA",   mtype: 13 },
  { label: "RCS - Regular Civil Suit",              value: "RCS",   mtype: 14 },
  { label: "RCT - Regular Criminal Trial",          value: "RCT",   mtype: 15 },
  { label: "SA - Second Appeal",                    value: "SA",    mtype: 16 },
  { label: "SC - Sessions Case",                    value: "SC",    mtype: 17 },
  { label: "SCA - Special Court Appeal",            value: "SCA",   mtype: 18 },
  { label: "SLP - Special Leave Petition",          value: "SLP",   mtype: 19 },
  { label: "SP - Special Case",                     value: "SP",    mtype: 20 },
  { label: "TR - Transfer Case",                    value: "TR",    mtype: 21 },
  { label: "WC - Workmen Compensation Case",        value: "WC",    mtype: 22 },
  { label: "Other",                                 value: "OTH",   mtype: 99 },
];

export const FAMILY_COURT_CASE_TYPES = [
  { label: "MC - Matrimonial Case",                 value: "MC",    mtype: 1 },
  { label: "OP - Original Petition",                value: "OP",    mtype: 2 },
  { label: "EP - Execution Petition",               value: "EP",    mtype: 3 },
  { label: "CMA - Civil Misc Appeal",               value: "CMA",   mtype: 4 },
  { label: "FC - Family Court Case",                value: "FC",    mtype: 5 },
  { label: "Other",                                 value: "OTH",   mtype: 99 },
];

export const CONSUMER_CASE_TYPES = [
  { label: "CC - Consumer Complaint",               value: "CC",    mtype: 1 },
  { label: "FA - First Appeal",                     value: "FA",    mtype: 2 },
  { label: "RP - Revision Petition",                value: "RP",    mtype: 3 },
  { label: "EP - Execution Petition",               value: "EP",    mtype: 4 },
];

export const TRIBUNAL_CASE_TYPES = [
  { label: "OA - Original Application",             value: "OA",    mtype: 1 },
  { label: "TA - Transfer Application",             value: "TA",    mtype: 2 },
  { label: "RP - Review Petition",                  value: "RP",    mtype: 3 },
  { label: "CP - Contempt Petition",                value: "CP",    mtype: 4 },
];

// ── Court Registry ────────────────────────────────────────────────
export const COURT_REGISTRY: Record<string, CourtConfig> = {

  // ── Telangana High Court ────────────────────────────────────────
  "Telangana High Court, Hyderabad": {
    displayName:     "Telangana High Court, Hyderabad",
    provider:        PROVIDERS.TELANGANA_HC,
    captchaProvider: "TELANGANA_HC",
    caseTypeSet:     CASE_TYPE_SETS.TELANGANA_HC,
    courtCode:       "TSHC",
    stateCode:       "18",
    districtCode:    null,
    supported:       true,
    complexes:       [],   // HC has no complexes
  },

  // ── District Courts — eCourts ───────────────────────────────────
  "District Court, Hyderabad": {
    displayName:     "District Court, Hyderabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18001",
    stateCode:       "18",
    districtCode:    "01",
    supported:       true,
    complexes: [
      { name: "Hyderabad City Civil Court Complex", estCode: "001" },
      { name: "Nampally Court Complex",             estCode: "002" },
      { name: "L.B. Nagar Court Complex",           estCode: "003" },
      { name: "Kukatpally Court Complex",           estCode: "004" },
      { name: "Secunderabad Court Complex",         estCode: "005" },
    ],
  },

  "City Civil Court, Hyderabad": {
    displayName:     "City Civil Court, Hyderabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18001",
    stateCode:       "18",
    districtCode:    "01",
    supported:       true,
    complexes: [
      { name: "City Civil Court Complex", estCode: "001" },
    ],
  },

  "Family Court, Hyderabad": {
    displayName:     "Family Court, Hyderabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    // Family court has its own case type set
    caseTypeSet:     CASE_TYPE_SETS.FAMILY_COURT,
    courtCode:       "18001",
    stateCode:       "18",
    districtCode:    "01",
    supported:       true,
    complexes: [
      { name: "Family Court Complex", estCode: "006" },
    ],
  },

  "District Court, Rangareddy": {
    displayName:     "District Court, Rangareddy",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18002",
    stateCode:       "18",
    districtCode:    "02",
    supported:       true,
    complexes: [
      { name: "Rangareddy District Court Complex", estCode: "001" },
      { name: "Saroornagar Court Complex",         estCode: "002" },
    ],
  },

  "District Court, Medchal-Malkajgiri": {
    displayName:     "District Court, Medchal-Malkajgiri",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18003",
    stateCode:       "18",
    districtCode:    "03",
    supported:       true,
    complexes: [
      { name: "Medchal Court Complex",    estCode: "001" },
      { name: "Malkajgiri Court Complex", estCode: "002" },
    ],
  },

  "District Court, Sangareddy": {
    displayName:     "District Court, Sangareddy",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18004",
    stateCode:       "18",
    districtCode:    "04",
    supported:       true,
    complexes: [
      { name: "Sangareddy District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Warangal": {
    displayName:     "District Court, Warangal",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18005",
    stateCode:       "18",
    districtCode:    "05",
    supported:       true,
    complexes: [
      { name: "Warangal District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Karimnagar": {
    displayName:     "District Court, Karimnagar",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18006",
    stateCode:       "18",
    districtCode:    "06",
    supported:       true,
    complexes: [
      { name: "Karimnagar District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Nizamabad": {
    displayName:     "District Court, Nizamabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18007",
    stateCode:       "18",
    districtCode:    "07",
    supported:       true,
    complexes: [
      { name: "Nizamabad District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Khammam": {
    displayName:     "District Court, Khammam",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18008",
    stateCode:       "18",
    districtCode:    "08",
    supported:       true,
    complexes: [
      { name: "Khammam District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Nalgonda": {
    displayName:     "District Court, Nalgonda",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18009",
    stateCode:       "18",
    districtCode:    "09",
    supported:       true,
    complexes: [
      { name: "Nalgonda District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Adilabad": {
    displayName:     "District Court, Adilabad",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18010",
    stateCode:       "18",
    districtCode:    "10",
    supported:       true,
    complexes: [
      { name: "Adilabad District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Mahabubnagar": {
    displayName:     "District Court, Mahabubnagar",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18011",
    stateCode:       "18",
    districtCode:    "11",
    supported:       true,
    complexes: [
      { name: "Mahabubnagar District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Mancherial": {
    displayName:     "District Court, Mancherial",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18012",
    stateCode:       "18",
    districtCode:    "12",
    supported:       true,
    complexes: [
      { name: "Mancherial District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Peddapalli": {
    displayName:     "District Court, Peddapalli",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18013",
    stateCode:       "18",
    districtCode:    "13",
    supported:       true,
    complexes: [
      { name: "Peddapalli District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Jagtial": {
    displayName:     "District Court, Jagtial",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18014",
    stateCode:       "18",
    districtCode:    "14",
    supported:       true,
    complexes: [
      { name: "Jagtial District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Medak": {
    displayName:     "District Court, Medak",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18015",
    stateCode:       "18",
    districtCode:    "15",
    supported:       true,
    complexes: [
      { name: "Medak District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Siddipet": {
    displayName:     "District Court, Siddipet",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18016",
    stateCode:       "18",
    districtCode:    "16",
    supported:       true,
    complexes: [
      { name: "Siddipet District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Suryapet": {
    displayName:     "District Court, Suryapet",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18017",
    stateCode:       "18",
    districtCode:    "17",
    supported:       true,
    complexes: [
      { name: "Suryapet District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Yadadri Bhuvanagiri": {
    displayName:     "District Court, Yadadri Bhuvanagiri",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18018",
    stateCode:       "18",
    districtCode:    "18",
    supported:       true,
    complexes: [
      { name: "Yadadri District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Nagarkurnool": {
    displayName:     "District Court, Nagarkurnool",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18019",
    stateCode:       "18",
    districtCode:    "19",
    supported:       true,
    complexes: [
      { name: "Nagarkurnool District Court Complex", estCode: "001" },
    ],
  },

  "District Court, Wanaparthy": {
    displayName:     "District Court, Wanaparthy",
    provider:        PROVIDERS.ECOURTS,
    captchaProvider: "ECOURTS",
    caseTypeSet:     CASE_TYPE_SETS.ECOURTS_DC,
    courtCode:       "18020",
    stateCode:       "18",
    districtCode:    "20",
    supported:       true,
    complexes: [
      { name: "Wanaparthy District Court Complex", estCode: "001" },
    ],
  },

  // ── Coming Soon ─────────────────────────────────────────────────
  "Labour Court, Hyderabad": {
    displayName:     "Labour Court, Hyderabad",
    provider:        PROVIDERS.UNSUPPORTED,
    captchaProvider: "NONE",
    caseTypeSet:     CASE_TYPE_SETS.TRIBUNAL,
    courtCode:       null,
    stateCode:       "18",
    districtCode:    null,
    supported:       false,
    comingSoon:      true,
    complexes:       [],
  },

  "Consumer Court, Hyderabad": {
    displayName:     "Consumer Court, Hyderabad",
    provider:        PROVIDERS.CONSUMER_COURT,
    captchaProvider: "NONE",
    caseTypeSet:     CASE_TYPE_SETS.CONSUMER,
    courtCode:       "TSDRC-01",
    stateCode:       "18",
    districtCode:    "01",
    supported:       false,
    comingSoon:      true,
    complexes:       [],
  },

  "Telangana State Consumer Disputes Redressal Commission": {
    displayName:     "Telangana State Consumer Disputes Redressal Commission",
    provider:        PROVIDERS.CONSUMER_COURT,
    captchaProvider: "NONE",
    caseTypeSet:     CASE_TYPE_SETS.CONSUMER,
    courtCode:       "TSSCDRC",
    stateCode:       "18",
    districtCode:    null,
    supported:       false,
    comingSoon:      true,
    complexes:       [],
  },

  "Telangana Administrative Tribunal": {
    displayName:     "Telangana Administrative Tribunal",
    provider:        PROVIDERS.TRIBUNAL,
    captchaProvider: "NONE",
    caseTypeSet:     CASE_TYPE_SETS.TRIBUNAL,
    courtCode:       "TAT",
    stateCode:       "18",
    districtCode:    null,
    supported:       false,
    comingSoon:      true,
    complexes:       [],
  },
};

// ── Helpers ───────────────────────────────────────────────────────
export const getCourtConfig = (courtName: string): CourtConfig | null =>
  COURT_REGISTRY[courtName] || null;

export const isCourtSupported = (courtName: string): boolean =>
  COURT_REGISTRY[courtName]?.supported === true;

export const getAllCourts = (): CourtConfig[] =>
  Object.values(COURT_REGISTRY);

export const getSupportedCourts = (): CourtConfig[] =>
  Object.values(COURT_REGISTRY).filter((c) => c.supported);

export const getUnsupportedCourts = (): CourtConfig[] =>
  Object.values(COURT_REGISTRY).filter((c) => !c.supported);

/**
 * Get correct case types array for a given court
 */
export const getCaseTypesForCourt = (courtName: string) => {
  const config = getCourtConfig(courtName);
  if (!config) return [];

  switch (config.caseTypeSet) {
    case CASE_TYPE_SETS.FAMILY_COURT:          return FAMILY_COURT_CASE_TYPES;
    case CASE_TYPE_SETS.ECOURTS_DC: return ECOURTS_DC_CASE_TYPES;
    case CASE_TYPE_SETS.CONSUMER:   return CONSUMER_CASE_TYPES;
    case CASE_TYPE_SETS.TRIBUNAL:   return TRIBUNAL_CASE_TYPES;
    default:                        return []; // HC types imported separately
  }
};

/**
 * Does this court need court complex selection?
 */
export const courtNeedsComplex = (courtName: string): boolean => {
  const config = getCourtConfig(courtName);
  return (
    config?.provider === PROVIDERS.ECOURTS &&
    (config?.complexes?.length ?? 0) > 1
  );
};