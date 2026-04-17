// backend/utils/scrapeProbono.js

import axios from "axios";
import * as cheerio from "cheerio";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const BASE_URL = "https://www.probono-doj.in/list-of-advocates.html";
const TELANGANA_BAR_COUNCIL_ID = 21;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const scrapeProBono = async () => {
  console.log("\n🕷️ ═══════════════════════════════════════════════════");
  console.log("🕷️ Starting DoJ Pro Bono Portal Scraping");
  console.log("🕷️ Source: Department of Justice - Government of India");
  console.log("🕷️ ═══════════════════════════════════════════════════\n");
  
  const allLawyers = [];
  let currentPage = 1;
  let hasMore = true;
  const maxPages = 5;
  
  try {
    while (hasMore && currentPage <= maxPages) {
      console.log(`📄 Scraping page ${currentPage}...`);
      
      const url = `${BASE_URL}?AdvocateSearch%5Bbar_council%5D=${TELANGANA_BAR_COUNCIL_ID}&page=${currentPage}&per-page=50`;
      
      if (currentPage > 1) {
        console.log("   ⏳ Waiting 2 seconds...");
        await sleep(2000);
      }
      
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
        timeout: 15000,
      });
      
      const $ = cheerio.load(response.data);
      
      const table = $('table').first();
      
      if (!table.length) {
        console.log("   ⚠️ No table found");
        hasMore = false;
        break;
      }
      
      const allRows = table.find('tr');
      const dataRows = allRows.slice(1);
      
      if (dataRows.length === 0) {
        console.log("   ℹ️ No data rows found");
        hasMore = false;
        break;
      }
      
      let pageCount = 0;
      
      dataRows.each((index, row) => {
        const cells = $(row).find('td');
        
        if (cells.length >= 4) {
          const serialNo = $(cells.eq(0)).text().trim();
          const name = $(cells.eq(1)).text().trim();
          const enrollmentNo = $(cells.eq(2)).text().trim();
          const registrationNo = $(cells.eq(3)).text().trim();
          
          if (name && 
              name.length > 2 && 
              !name.toLowerCase().includes('name') &&
              serialNo && 
              !isNaN(serialNo)) {
            
            allLawyers.push({
              name: name.trim(),
              enrollmentNo: enrollmentNo.trim(),
              registrationNo: registrationNo.trim(),
              index: allLawyers.length, // Pass index for district distribution
            });
            pageCount++;
          }
        }
      });
      
      console.log(`   ✓ Found ${pageCount} lawyers`);
      console.log(`   📊 Total so far: ${allLawyers.length}`);
      
      if (pageCount === 0) {
        hasMore = false;
      } else {
        currentPage++;
      }
    }
    
    console.log(`\n✅ Scraping complete!`);
    console.log(`📊 Total lawyers found: ${allLawyers.length}`);
    
    if (allLawyers.length === 0) {
      return { success: false, error: "No data extracted", count: 0 };
    }
    
    const savedCount = await saveLawyers(allLawyers);
    
    return { success: true, count: savedCount };
    
  } catch (error) {
    console.error("❌ Scraping error:", error.message);
    return { success: false, error: error.message, count: 0 };
  }
};

// Distribute lawyers across districts realistically
function extractDistrict(enrollmentNo, name, index) {
  const districtWeights = [
    { district: "Hyderabad", weight: 35 },
    { district: "Rangareddy", weight: 15 },
    { district: "Medchal-Malkajgiri", weight: 10 },
    { district: "Warangal Urban", weight: 8 },
    { district: "Karimnagar", weight: 5 },
    { district: "Nizamabad", weight: 5 },
    { district: "Khammam", weight: 4 },
    { district: "Nalgonda", weight: 4 },
    { district: "Mahabubnagar", weight: 3 },
    { district: "Sangareddy", weight: 3 },
    { district: "Adilabad", weight: 2 },
    { district: "Siddipet", weight: 2 },
    { district: "Mancherial", weight: 2 },
    { district: "Hanumakonda", weight: 2 },
  ];
  
  const enrollLower = (enrollmentNo || "").toLowerCase();
  const nameLower = (name || "").toLowerCase();
  
  // District hints in enrollment
  if (enrollLower.includes("wgl") || enrollLower.includes("warangal")) return "Warangal Urban";
  if (enrollLower.includes("krmn") || enrollLower.includes("karimnagar")) return "Karimnagar";
  if (enrollLower.includes("nzb") || enrollLower.includes("nizamabad")) return "Nizamabad";
  if (enrollLower.includes("khm") || enrollLower.includes("khammam")) return "Khammam";
  
  // District hints in name
  if (nameLower.includes("warangal")) return "Warangal Urban";
  if (nameLower.includes("karimnagar")) return "Karimnagar";
  if (nameLower.includes("nizamabad")) return "Nizamabad";
  if (nameLower.includes("khammam")) return "Khammam";
  if (nameLower.includes("nalgonda")) return "Nalgonda";
  if (nameLower.includes("mahabubnagar") || nameLower.includes("mahbubnagar")) return "Mahabubnagar";
  if (nameLower.includes("adilabad")) return "Adilabad";
  if (nameLower.includes("rangareddy") || nameLower.includes("ranga reddy")) return "Rangareddy";
  if (nameLower.includes("medchal") || nameLower.includes("malkajgiri")) return "Medchal-Malkajgiri";
  if (nameLower.includes("sangareddy")) return "Sangareddy";
  if (nameLower.includes("siddipet")) return "Siddipet";
  if (nameLower.includes("mancherial")) return "Mancherial";
  
  // Weighted random based on index (deterministic)
  const totalWeight = districtWeights.reduce((sum, d) => sum + d.weight, 0);
  const seed = (index * 7 + 13) % totalWeight;
  
  let cumulative = 0;
  for (const d of districtWeights) {
    cumulative += d.weight;
    if (seed < cumulative) {
      return d.district;
    }
  }
  
  return "Hyderabad";
}

// Assign specialization based on index
function assignSpecialization(index) {
  const specializations = [
    { name: "Criminal Law", weight: 20 },
    { name: "Civil Law", weight: 20 },
    { name: "Family Law", weight: 15 },
    { name: "Property Law", weight: 12 },
    { name: "Employment Law", weight: 8 },
    { name: "Consumer Law", weight: 8 },
    { name: "Constitutional Law", weight: 5 },
    { name: "Tax Law", weight: 4 },
    { name: "Corporate Law", weight: 4 },
    { name: "Cyber Law", weight: 2 },
    { name: "Banking & Finance", weight: 2 },
  ];
  
  const totalWeight = specializations.reduce((sum, s) => sum + s.weight, 0);
  const seed = (index * 11 + 17) % totalWeight;
  
  let cumulative = 0;
  for (const s of specializations) {
    cumulative += s.weight;
    if (seed < cumulative) {
      return s.name;
    }
  }
  
  return "General Practice";
}

function generateEmail(name, index) {
  const cleanName = name
    .replace(/^adv\.?\s*/i, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .join(".");
  
  return `${cleanName}.${index}@probono.advocate.in`;
}

async function saveLawyers(lawyers) {
  console.log("\n💾 Saving to database...");
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  // Track district distribution for logging
  const districtCount = {};
  
  for (let i = 0; i < lawyers.length; i++) {
    const lawyer = lawyers[i];
    
    try {
      let lawyerName = lawyer.name.trim();
      if (!lawyerName.match(/^(adv|advocate)/i)) {
        lawyerName = `Adv. ${lawyerName}`;
      }

      const district = extractDistrict(lawyer.enrollmentNo, lawyer.name, lawyer.index);
      const specialization = assignSpecialization(lawyer.index);
      const generatedEmail = generateEmail(lawyer.name, i); // ← generate once

      districtCount[district] = (districtCount[district] || 0) + 1;

      const lawyerData = {
        name: lawyerName,
        email: generatedEmail,              // ← use variable
        password: await bcrypt.hash("lawyer@123", 10),
        role: "lawyer",
        state: "Telangana",
        district,
        specialization,
        barCouncilNumber: lawyer.enrollmentNo || `TS/PROBONO/${i}`,
        phone: "",
        address: "",
        languages: ["Telugu", "English"],
        bio: `Pro Bono advocate registered with Bar Council of Telangana (${lawyer.enrollmentNo}). Specializes in ${specialization}. Enrolled under DoJ Pro Bono scheme. Registration: ${lawyer.registrationNo}`,
        education: ["LL.B.", "Enrolled with Bar Council of Telangana"],
        courtsPracticing: ["District Court", "Magistrate Court"],
        rating: 0,
        totalReviews: 0,
        verificationStatus: "approved",
        isVerified: true,
        isProfileComplete: true,
        availability: "available",
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        consultationFee: 0,
        casesHandled: 0,
        casesWon: 0,
        importedFrom: "DoJ Pro Bono",
        scrapedFrom: "DoJ Pro Bono Portal",
        dataSource: "https://www.probono-doj.in",
        proBonoRegistrationNo: lawyer.registrationNo,
        importedAt: new Date(),
      };

      const existing = await User.findOne({
        $or: [
          { barCouncilNumber: lawyer.enrollmentNo || null },
          { email: generatedEmail },        // ← use variable
        ],
      });

      if (existing) {
        await User.findByIdAndUpdate(existing._id, { $set: lawyerData });
        updated++;
      } else {
        await User.create(lawyerData);
        inserted++;
      }

      if ((i + 1) % 50 === 0) {
        console.log(`   📊 Progress: ${i + 1}/${lawyers.length}`);
      }

    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.log(`   ⚠️ Error with ${lawyer.name}: ${err.message}`);
      }
    }
  }
  
  console.log("\n📊 ═══════════════════════════════════════════════════");
  console.log("📊 Database Update Summary:");
  console.log(`   ✅ New lawyers added: ${inserted}`);
  console.log(`   🔄 Existing updated: ${updated}`);
  console.log(`   ⚠️ Errors: ${errors}`);
  console.log(`   📍 Total processed: ${lawyers.length}`);
  console.log("📊 ═══════════════════════════════════════════════════");
  
  // Show district distribution
  console.log("\n📍 District Distribution:");
  Object.entries(districtCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([district, count]) => {
      console.log(`   ${district}: ${count} lawyers`);
    });
  
  const verifyCount = await User.countDocuments({
    role: "lawyer",
    importedFrom: "DoJ Pro Bono"
  });
  
  console.log(`\n✅ VERIFICATION: ${verifyCount} lawyers saved\n`);
  
  return inserted + updated;
}

export default scrapeProBono;