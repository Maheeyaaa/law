// backend/utils/scrapeLawyers.js

import axios from "axios";
import * as cheerio from "cheerio";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Telangana districts
const TELANGANA_DISTRICTS = [
  "Hyderabad", "Secunderabad", "Rangareddy", "Medchal-Malkajgiri", 
  "Sangareddy", "Warangal Urban", "Warangal Rural", "Karimnagar", 
  "Nizamabad", "Khammam", "Nalgonda", "Mahabubnagar", "Adilabad", 
  "Siddipet", "Mancherial", "Suryapet", "Jagtial", "Kamareddy", 
  "Medak", "Peddapalli", "Hanumakonda"
];

const SPECIALIZATIONS = [
  "Criminal Law", "Civil Law", "Family Law", "Property Law",
  "Labour Law", "Consumer Law", "Tax Law", "Corporate Law",
  "Constitutional Law", "Cyber Law", "Banking Law", "Insurance Law",
  "Motor Accident Claims", "Service Law", "Writ Petitions",
  "Intellectual Property Law", "Environmental Law", "Real Estate Law"
];

const FIRST_NAMES = [
  "Rajesh", "Suresh", "Mahesh", "Ganesh", "Ramesh", "Naresh",
  "Sunita", "Kavita", "Anita", "Lalita", "Vijaya", "Padma",
  "Kumar", "Prasad", "Venkat", "Srinivas", "Ravi", "Krishna",
  "Lakshmi", "Sarita", "Divya", "Priya", "Swathi", "Anusha",
  "Karthik", "Anil", "Sunil", "Rakesh", "Vikram", "Sandeep",
  "Radhika", "Sowmya", "Manjula", "Jyothi", "Rekha", "Nirmala",
  "Balaji", "Harish", "Chandra", "Mohan", "Ramana", "Nagesh",
  "Sirisha", "Swetha", "Madhavi", "Sailaja", "Usha", "Kiran"
];

const LAST_NAMES = [
  "Reddy", "Rao", "Kumar", "Sharma", "Naidu", "Goud",
  "Singh", "Prasad", "Varma", "Chary", "Murthy", "Yadav",
  "Raju", "Babu", "Naik", "Patel", "Verma", "Gupta",
  "Khan", "Ali", "Ahmed", "Begum", "Siddiqui", "Ansari"
];

// Generate realistic lawyer data
function generateRealisticLawyers(count = 200) {
  console.log(`🤖 Generating ${count} realistic Telangana lawyers...`);
  
  const lawyers = [];
  const usedEmails = new Set();
  
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `Adv. ${firstName} ${lastName}`;
    
    // Weighted district distribution (more in major cities)
    const districtWeights = {
      "Hyderabad": 30,
      "Rangareddy": 15,
      "Medchal-Malkajgiri": 10,
      "Warangal Urban": 8,
      "Karimnagar": 6,
      "Nizamabad": 5,
      "Khammam": 5,
      "Nalgonda": 4,
      "Mahabubnagar": 4,
      "others": 13
    };
    
    let district;
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [dist, weight] of Object.entries(districtWeights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        if (dist === "others") {
          district = TELANGANA_DISTRICTS[Math.floor(Math.random() * TELANGANA_DISTRICTS.length)];
        } else {
          district = dist;
        }
        break;
      }
    }
    
    // Generate unique email
    let email;
    let attempts = 0;
    do {
      const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${attempts > 0 ? attempts : ''}`;
      const domains = ["advocate.in", "lawyer.in", "legal.co.in", "lawfirm.in", "gmail.com"];
      email = `${emailName}@${domains[Math.floor(Math.random() * domains.length)]}`;
      attempts++;
    } while (usedEmails.has(email) && attempts < 10);
    
    usedEmails.add(email);
    
    const experience = Math.floor(Math.random() * 25) + 3; // 3-28 years
    const yearEnrolled = new Date().getFullYear() - experience;
    const barNumber = Math.floor(Math.random() * 9000) + 1000;
    
    // Specialization (weighted by popularity)
    const specWeights = [30, 25, 20, 15, 8, 7, 5, 4, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1];
    const specIndex = weightedRandom(specWeights);
    const specialization = SPECIALIZATIONS[specIndex] || SPECIALIZATIONS[0];
    
    // Languages based on district
    const languages = generateLanguages(district);
    
    // Courts based on district and experience
    const courts = generateCourts(district, experience);
    
    // Rating (weighted towards 4-5)
    const rating = (4 + Math.random() * 1).toFixed(1);
    const totalReviews = Math.floor(Math.random() * 150) + 10;
    
    // Cases (increases with experience)
    const casesHandled = Math.floor((experience * 8) + Math.random() * 50);
    const winRate = 0.6 + Math.random() * 0.25; // 60-85% win rate
    const casesWon = Math.floor(casesHandled * winRate);
    
    // Consultation fee (based on experience and district)
    let baseFee = 2000;
    if (["Hyderabad", "Rangareddy", "Medchal-Malkajgiri"].includes(district)) {
      baseFee = 3000;
    }
    const consultationFee = baseFee + (experience * 150) + (Math.floor(Math.random() * 5) * 500);
    
    // Bio
    const bio = generateBio(name.replace("Adv. ", ""), specialization, experience, district);
    
    // Education
    const education = generateEducation(experience);
    
    // Availability
    const availabilities = ["available", "available", "available", "available", "busy"]; // 80% available
    const availability = availabilities[Math.floor(Math.random() * availabilities.length)];
    
    lawyers.push({
      name,
      email,
      district,
      specialization,
      experience,
      barCouncilNumber: `TS/${barNumber}/${yearEnrolled}`,
      languages,
      bio,
      education,
      courtsPracticing: courts,
      rating: parseFloat(rating),
      totalReviews,
      consultationFee,
      casesHandled,
      casesWon,
      availability,
      phone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
      source: "Generated",
    });
  }
  
  console.log(`✅ Generated ${lawyers.length} realistic lawyers`);
  return lawyers;
}

// Weighted random selection
function weightedRandom(weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  return 0;
}

// Generate languages based on district
function generateLanguages(district) {
  const base = ["Telugu", "English"];
  
  if (["Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Secunderabad"].includes(district)) {
    if (Math.random() > 0.4) base.push("Hindi");
    if (Math.random() > 0.6) base.push("Urdu");
  }
  if (["Adilabad", "Mancherial", "Nirmal"].includes(district)) {
    if (Math.random() > 0.5) base.push("Marathi");
    if (Math.random() > 0.7) base.push("Hindi");
  }
  if (["Mahabubnagar", "Nagarkurnool", "Wanaparthy"].includes(district)) {
    if (Math.random() > 0.6) base.push("Kannada");
  }
  if (Math.random() > 0.8) base.push("Hindi");
  
  return [...new Set(base)]; // Remove duplicates
}

// Generate courts based on district and experience
function generateCourts(district, experience) {
  const courts = [`District Court ${district}`];
  
  // Major cities have more court options
  if (["Hyderabad", "Secunderabad", "Rangareddy", "Medchal-Malkajgiri"].includes(district)) {
    courts.push("City Civil Court Hyderabad");
    if (experience > 10) courts.push("Telangana High Court");
    if (experience > 15 && Math.random() > 0.7) courts.push("Supreme Court of India");
  } else {
    if (experience > 12) courts.push("Telangana High Court");
  }
  
  // Add specialized courts based on random chance
  const specializedCourts = [
    "Family Court", "Sessions Court", "Consumer Court", 
    "Labour Court", "Motor Accident Claims Tribunal"
  ];
  
  if (Math.random() > 0.6) {
    courts.push(specializedCourts[Math.floor(Math.random() * specializedCourts.length)]);
  }
  
  return [...new Set(courts)];
}

// Generate bio
function generateBio(name, specialization, experience, district) {
  const templates = [
    `Practicing advocate with ${experience} years of experience specializing in ${specialization}. Enrolled with Bar Council of Telangana. Regularly appears before courts in ${district} district.`,
    
    `Experienced lawyer in ${specialization} with ${experience}+ years of practice in ${district}. Known for thorough case preparation and client-centric approach. Successfully handled numerous cases with favorable outcomes.`,
    
    `Senior advocate with expertise in ${specialization}. Practicing in ${district} for over ${experience} years. Committed to providing quality legal services and achieving justice for clients.`,
    
    `${experience} years of dedicated legal practice in ${specialization}. Based in ${district}, Telangana. Strong track record in court proceedings and alternative dispute resolution.`,
    
    `Specialist in ${specialization} with ${experience} years of experience. Practicing in various courts across ${district} district. Focus on delivering practical legal solutions and protecting client interests.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate education
function generateEducation(experience) {
  const universities = [
    "Osmania University", "Nalsar University", "Kakatiya University",
    "Mahatma Gandhi University", "Andhra University", "Delhi University",
    "Pune University", "Bangalore University"
  ];
  
  const education = [
    `LL.B. from ${universities[Math.floor(Math.random() * universities.length)]}`,
    "Enrolled with Bar Council of Telangana"
  ];
  
  if (experience > 8 && Math.random() > 0.7) {
    education.splice(1, 0, "LL.M. (Master of Laws)");
  }
  
  if (experience > 12 && Math.random() > 0.8) {
    education.push("Specialized training in Alternate Dispute Resolution");
  }
  
  return education;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Attempt to scrape (simplified)
async function attemptScraping() {
  console.log("🕷️ Attempting to scrape from available sources...");
  
  const lawyers = [];
  
  // Try simple scraping with better error handling
  try {
    // Attempt 1: Try a simpler source
    const response = await axios.get("https://www.indiamart.com/impcat/lawyer-services.html", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 5000,
      validateStatus: false,
    });
    
    if (response.status === 200) {
      console.log("✅ Found accessible source");
      // Parse if successful (basic example)
      const $ = cheerio.load(response.data);
      // Add parsing logic here
    }
  } catch (error) {
    console.log("⚠️ Scraping not possible:", error.message);
  }
  
  return lawyers;
}

// Main scraping function with fallback
export const scrapeAndSaveLawyers = async () => {
  console.log("🚀 Starting lawyer data collection...\n");
  
  try {
    // Try scraping first
    let lawyers = await attemptScraping();
    
    // If scraping failed or got too few lawyers, use generator
    if (lawyers.length < 20) {
      console.log("⚠️ Scraping yielded insufficient data");
      console.log("🤖 Switching to realistic data generator...\n");
      lawyers = generateRealisticLawyers(200);
    }
    
    console.log(`\n📊 Total lawyers to import: ${lawyers.length}`);
    
    // Prepare for database insertion
    const lawyersToSave = await Promise.all(
      lawyers.map(async (lawyer) => ({
        name: lawyer.name,
        email: lawyer.email,
        password: await bcrypt.hash("lawyer@123", 10),
        role: "lawyer",
        state: "Telangana",
        district: lawyer.district,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
        barCouncilNumber: lawyer.barCouncilNumber,
        languages: lawyer.languages,
        bio: lawyer.bio,
        education: lawyer.education,
        rating: lawyer.rating,
        totalReviews: lawyer.totalReviews,
        verificationStatus: "approved",
        isVerified: true,
        isProfileComplete: true,
        availability: lawyer.availability,
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        consultationFee: lawyer.consultationFee,
        casesHandled: lawyer.casesHandled,
        casesWon: lawyer.casesWon,
        phone: lawyer.phone,
        courtsPracticing: lawyer.courtsPracticing,
        scrapedFrom: lawyer.source || "Generated",
      }))
    );
    
    console.log("💾 Saving to database...");
    
    // Clear existing generated/scraped lawyers
    await User.deleteMany({ 
      role: "lawyer", 
      scrapedFrom: { $exists: true } 
    });
    
    // Insert in batches
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < lawyersToSave.length; i += batchSize) {
      const batch = lawyersToSave.slice(i, i + batchSize);
      try {
        const result = await User.insertMany(batch, { ordered: false });
        inserted += result.length;
        console.log(`  ✓ Batch ${Math.floor(i/batchSize) + 1}: ${result.length} lawyers saved`);
      } catch (err) {
        if (err.writeErrors) {
          inserted += batch.length - err.writeErrors.length;
          console.log(`  ⚠️ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length - err.writeErrors.length} saved, ${err.writeErrors.length} duplicates skipped`);
        }
      }
    }
    
    console.log(`\n✅ Successfully saved ${inserted} lawyers to database!`);
    
    // Summary
    const districts = [...new Set(lawyersToSave.map(l => l.district))];
    const specs = [...new Set(lawyersToSave.map(l => l.specialization))];
    
    console.log(`\n📊 Summary:`);
    console.log(`   📍 Districts covered: ${districts.length}`);
    console.log(`   ⚖️  Specializations: ${specs.length}`);
    console.log(`   👥 Total lawyers: ${inserted}`);
    
    return { success: true, count: inserted };
    
  } catch (error) {
    console.error("❌ Process failed:", error.message);
    return { success: false, error: error.message };
  }
};

export default scrapeAndSaveLawyers;