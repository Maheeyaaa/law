// backend/constants/telangana.js
// Centralized Telangana data — easy to add more states later

export const STATE = "Telangana";

export const DISTRICTS = [
  "Hyderabad",
  "Rangareddy",
  "Medchal-Malkajgiri",
  "Sangareddy",
  "Vikarabad",
  "Warangal Urban",
  "Warangal Rural",
  "Hanumakonda",
  "Khammam",
  "Nalgonda",
  "Karimnagar",
  "Nizamabad",
  "Adilabad",
  "Komaram Bheem Asifabad",
  "Mancherial",
  "Peddapalli",
  "Jagtial",
  "Rajanna Sircilla",
  "Kamareddy",
  "Medak",
  "Siddipet",
  "Jangaon",
  "Mahabubabad",
  "Warangal",
  "Suryapet",
  "Yadadri Bhuvanagiri",
  "Mahabubnagar",
  "Nagarkurnool",
  "Wanaparthy",
  "Jogulamba Gadwal",
  "Narayanpet",
  "Mulugu",
  "Jayashankar Bhupalpally",
  "Bhadradri Kothagudem",
];

export const COURTS = [
  // High Court
  { name: "Telangana High Court, Hyderabad", type: "High Court", district: "Hyderabad" },

  // District Courts
  { name: "District Court, Hyderabad", type: "District Court", district: "Hyderabad" },
  { name: "City Civil Court, Hyderabad", type: "District Court", district: "Hyderabad" },
  { name: "City Criminal Court, Hyderabad", type: "District Court", district: "Hyderabad" },
  { name: "District Court, Rangareddy", type: "District Court", district: "Rangareddy" },
  { name: "District Court, Medchal-Malkajgiri", type: "District Court", district: "Medchal-Malkajgiri" },
  { name: "District Court, Sangareddy", type: "District Court", district: "Sangareddy" },
  { name: "District Court, Vikarabad", type: "District Court", district: "Vikarabad" },
  { name: "District Court, Warangal", type: "District Court", district: "Warangal Urban" },
  { name: "District Court, Hanumakonda", type: "District Court", district: "Hanumakonda" },
  { name: "District Court, Khammam", type: "District Court", district: "Khammam" },
  { name: "District Court, Nalgonda", type: "District Court", district: "Nalgonda" },
  { name: "District Court, Karimnagar", type: "District Court", district: "Karimnagar" },
  { name: "District Court, Nizamabad", type: "District Court", district: "Nizamabad" },
  { name: "District Court, Adilabad", type: "District Court", district: "Adilabad" },
  { name: "District Court, Mancherial", type: "District Court", district: "Mancherial" },
  { name: "District Court, Peddapalli", type: "District Court", district: "Peddapalli" },
  { name: "District Court, Jagtial", type: "District Court", district: "Jagtial" },
  { name: "District Court, Rajanna Sircilla", type: "District Court", district: "Rajanna Sircilla" },
  { name: "District Court, Kamareddy", type: "District Court", district: "Kamareddy" },
  { name: "District Court, Medak", type: "District Court", district: "Medak" },
  { name: "District Court, Siddipet", type: "District Court", district: "Siddipet" },
  { name: "District Court, Jangaon", type: "District Court", district: "Jangaon" },
  { name: "District Court, Mahabubabad", type: "District Court", district: "Mahabubabad" },
  { name: "District Court, Suryapet", type: "District Court", district: "Suryapet" },
  { name: "District Court, Yadadri Bhuvanagiri", type: "District Court", district: "Yadadri Bhuvanagiri" },
  { name: "District Court, Mahabubnagar", type: "District Court", district: "Mahabubnagar" },
  { name: "District Court, Nagarkurnool", type: "District Court", district: "Nagarkurnool" },
  { name: "District Court, Wanaparthy", type: "District Court", district: "Wanaparthy" },
  { name: "District Court, Jogulamba Gadwal", type: "District Court", district: "Jogulamba Gadwal" },
  { name: "District Court, Narayanpet", type: "District Court", district: "Narayanpet" },
  { name: "District Court, Mulugu", type: "District Court", district: "Mulugu" },
  { name: "District Court, Jayashankar Bhupalpally", type: "District Court", district: "Jayashankar Bhupalpally" },
  { name: "District Court, Bhadradri Kothagudem", type: "District Court", district: "Bhadradri Kothagudem" },

  // Special Courts
  { name: "Family Court, Hyderabad", type: "Special Court", district: "Hyderabad" },
  { name: "Consumer Court, Hyderabad", type: "Special Court", district: "Hyderabad" },
  { name: "Labour Court, Hyderabad", type: "Special Court", district: "Hyderabad" },
  { name: "Small Causes Court, Hyderabad", type: "Special Court", district: "Hyderabad" },
  { name: "Metropolitan Magistrate Court, Hyderabad", type: "Special Court", district: "Hyderabad" },

  // Tribunals
  { name: "Telangana State Consumer Disputes Redressal Commission", type: "Tribunal", district: "Hyderabad" },
  { name: "Telangana Administrative Tribunal", type: "Tribunal", district: "Hyderabad" },
];

// Lawyer specializations relevant to Telangana
export const SPECIALIZATIONS = [
  "Criminal Law",
  "Civil Law",
  "Property Law",
  "Family Law",
  "Corporate Law",
  "Consumer Law",
  "Employment Law",
  "Tax Law",
  "Constitutional Law",
  "Intellectual Property",
  "Revenue Law",
  "Land & Real Estate",
  "Banking & Finance",
  "Environmental Law",
  "Cyber Law",
  "Human Rights",
  "Immigration Law",
  "Insurance Law",
  "Motor Accident Claims",
  "Other",
];

// Languages spoken in Telangana
export const LANGUAGES = [
  "Telugu",
  "Hindi",
  "English",
  "Urdu",
  "Marathi",
  "Kannada",
  "Tamil",
];

// For frontend dropdown — get courts by district
export const getCourtsByDistrict = (district) => {
  if (!district) return COURTS.map(c => c.name);
  return COURTS.filter(c => c.district === district).map(c => c.name);
};


