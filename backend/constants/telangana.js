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

// For frontend dropdown — get courts by district (kept for lawyer directory filtering)
export const getDistrictLabel = (district) => {
  if (!district) return "";
  return `${district}, Telangana`;
};