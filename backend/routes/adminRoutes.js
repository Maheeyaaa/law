// backend/routes/adminRoutes.js

import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { scrapeAndSaveLawyers } from "../utils/scrapeLawyers.js";
import { scrapeProBono } from "../utils/scrapeProbono.js";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import {
  getPendingLawyers,
  approveLawyer,
  rejectLawyer,
  createCourtStaff,
} from "../controllers/userController.js";


const router = express.Router();

router.use(protect);
router.use(restrictTo("court_staff"));

router.get("/pending-lawyers", getPendingLawyers);
router.patch("/approve-lawyer/:id", approveLawyer);
router.patch("/reject-lawyer/:id", rejectLawyer);
router.post("/create-court-staff", createCourtStaff);

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/csv";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `lawyers-${Date.now()}.csv`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files allowed"), false);
    }
  },
});

// Import lawyers from CSV
router.post("/import-lawyers", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    console.log("📄 Processing CSV file:", req.file.filename);

    const lawyers = [];
    const errors = [];

    // Parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          if (row.name && row.name.trim()) {
            lawyers.push({
              name: row.name.startsWith("Adv.") ? row.name : `Adv. ${row.name}`,
              email: row.email || generateEmail(row.name, lawyers.length),
              barCouncilNumber: row.barCouncilNumber || row.bar_number || row.enrollment_no || "",
              specialization: row.specialization || row.practice_area || "General Practice",
              district: row.district || row.location || "Hyderabad",
              experience: parseInt(row.experience) || 5,
              phone: row.phone || row.mobile || "",
              languages: row.languages ? row.languages.split(",").map(l => l.trim()) : ["Telugu", "English"],
              address: row.address || "",
            });
          } else {
            errors.push(`Row skipped: Missing name`);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`📊 Parsed ${lawyers.length} lawyers from CSV`);

    if (lawyers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid lawyers found in CSV",
        errors,
      });
    }

    // Prepare for database
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
        phone: lawyer.phone,
        address: lawyer.address,
        bio: `Practicing advocate enrolled with Bar Council of Telangana. Specializes in ${lawyer.specialization}.`,
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
        education: ["LL.B.", "Enrolled with Bar Council of Telangana"],
        importedFrom: "CSV",
        importedAt: new Date(),
      }))
    );

    // Insert to database
    let inserted = 0;
    let duplicates = 0;

    for (const lawyer of lawyersToSave) {
      try {
        await User.findOneAndUpdate(
          { email: lawyer.email },
          lawyer,
          { upsert: true, new: true }
        );
        inserted++;
      } catch (err) {
        duplicates++;
      }
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`✅ Imported ${inserted} lawyers, ${duplicates} duplicates`);

    res.json({
      success: true,
      message: `Successfully imported ${inserted} lawyers`,
      imported: inserted,
      duplicates,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Import error:", error);
    res.status(500).json({
      success: false,
      message: "Import failed",
      error: error.message,
    });
  }
});

// Download sample CSV template
router.get("/csv-template", (req, res) => {
  const template = `name,email,barCouncilNumber,specialization,district,experience,phone,languages,address
K. Ramachandra Rao,ramachandra@advocate.in,TS/1234/2010,Criminal Law,Hyderabad,14,9876543210,"Telugu,English,Hindi",Nampally Court Complex
P. Lakshmi Narayana,lakshmi@lawyer.in,TS/2345/2015,Civil Law,Rangareddy,9,9876543211,"Telugu,English",LB Nagar Court
Syed Mohd Akbar,akbar@legal.in,TS/3456/2012,Family Law,Warangal Urban,12,9876543212,"Telugu,English,Urdu",Hanamkonda Court`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=lawyers-template.csv");
  res.send(template);
});

// Get import status
router.get("/lawyers-stats", async (req, res) => {
  try {
    const total = await User.countDocuments({ role: "lawyer" });
    const imported = await User.countDocuments({ role: "lawyer", importedFrom: "CSV" });
    const proBono = await User.countDocuments({ role: "lawyer", importedFrom: "DoJ Pro Bono" });
    const generated = await User.countDocuments({ role: "lawyer", scrapedFrom: "Generated" });
    const registered = await User.countDocuments({ 
      role: "lawyer", 
      importedFrom: { $exists: false },
      scrapedFrom: { $exists: false }
    });

    const districts = await User.distinct("district", { role: "lawyer" });
    const specializations = await User.distinct("specialization", { role: "lawyer" });

    res.json({
      success: true,
      stats: {
        total,
        imported,
        proBono,
        generated,
        registered,
        districts: districts.length,
        specializations: specializations.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear generated lawyers
router.delete("/clear-generated", async (req, res) => {
  try {
    const result = await User.deleteMany({ 
      role: "lawyer", 
      scrapedFrom: "Generated" 
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} generated lawyers`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual Pro Bono scrape trigger
router.post("/scrape-probono", async (req, res) => {
  try {
    console.log("🕷️ Admin triggered DoJ Pro Bono scraping...");
    
    const result = await scrapeProBono();
    
    res.json({
      success: result.success,
      message: result.success 
        ? `Successfully scraped ${result.count} lawyers from DoJ Pro Bono Portal` 
        : `Scraping failed: ${result.error}`,
      count: result.count || 0,
      source: "Department of Justice - Pro Bono Portal",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Trigger fallback scraper
router.post("/scrape-lawyers", async (req, res) => {
  try {
    const result = await scrapeAndSaveLawyers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete synthetic lawyers
router.delete("/clear-synthetic", async (req, res) => {
  try {
    // Only delete lawyers NOT from real sources
    const result = await User.deleteMany({
      role: "lawyer",
      importedFrom: { $nin: ["DoJ Pro Bono", "CSV"] },
      // Only delete generated/synthetic ones
      scrapedFrom: "Generated",
    });

    const remaining = await User.countDocuments({ role: "lawyer" });
    const proBonoCount = await User.countDocuments({
      role: "lawyer",
      importedFrom: "DoJ Pro Bono",
    });
    const csvCount = await User.countDocuments({
      role: "lawyer",
      importedFrom: "CSV",
    });

    console.log(`🗑️ Deleted ${result.deletedCount} synthetic lawyers`);
    console.log(`✅ Remaining: ${remaining} (ProBono: ${proBonoCount}, CSV: ${csvCount})`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} synthetic lawyers`,
      deleted: result.deletedCount,
      remaining,
      breakdown: {
        proBonoLawyers: proBonoCount,
        csvImported: csvCount,
      },
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/delete-all-lawyers", async (req, res) => {
  try {
    const result = await User.deleteMany({ role: "lawyer" });
    
    console.log(`🗑️ Deleted ${result.deletedCount} lawyers`);
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} lawyers`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function
function generateEmail(name, index) {
  const cleanName = name
    .replace(/^adv\.?\s*/i, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .toLowerCase()
    .split(" ")
    .slice(0, 2)
    .join(".");
  return `${cleanName}${index}@advocate.in`;
}

export default router;