// backend/seed.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import Case from "./models/Case.js";
import Document from "./models/Document.js";
import Activity from "./models/Activity.js";
import Notification from "./models/Notification.js";
import FAQ from "./models/FAQ.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 50000,
      family: 4,
    });

    console.log("Connected to MongoDB ✅");

    // Clear old data
    await Case.deleteMany({});
    await Document.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    await FAQ.deleteMany({});
    console.log("Cleared old data ✅");

    // ── Create Admin ───────────────────────────────────────
    let admin = await User.findOne({ email: "admin@legalmind.in" });
    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        name: "Platform Admin",
        email: "admin@legalmind.in",
        password: hashed,
        role: "admin",
        state: "Telangana",
        district: "Hyderabad",
        isVerified: true,
        isProfileComplete: true,
      });
      console.log("Created admin ✅");
    } else {
      console.log("Admin already exists ✅");
    }

    // ── Create Citizen ─────────────────────────────────────
    let citizen = await User.findOne({ email: "rahul@example.com" });
    if (!citizen) {
      const hashed = await bcrypt.hash("password123", 10);
      citizen = await User.create({
        name: "Rahul Kumar",
        email: "rahul@example.com",
        password: hashed,
        role: "citizen",
        state: "Telangana",
        district: "Hyderabad",
        isProfileComplete: true,
      });
      console.log("Created citizen ✅");
    } else {
      console.log("Citizen already exists ✅");
    }

    // ── Create Cases ───────────────────────────────────────
    const now = new Date();

    const case1 = await Case.create({
      citizen: citizen._id,
      caseId: "LM-2025-0001",
      title: "Property Dispute",
      description: "Dispute regarding ownership of residential property in Sector 45",
      caseType: "Property",
      status: "Active",
      state: "Telangana",
      district: "Hyderabad",
      priority: "High",
      createdAt: new Date(now.getTime() - 30 * 86400000),
    });

    const case2 = await Case.create({
      citizen: citizen._id,
      caseId: "LM-2025-0002",
      title: "Civil Complaint",
      description: "Civil complaint against municipal corporation",
      caseType: "Civil Dispute",
      status: "Pending",
      state: "Telangana",
      district: "Hyderabad",
      priority: "Medium",
      createdAt: new Date(now.getTime() - 15 * 86400000),
    });

    const case3 = await Case.create({
      citizen: citizen._id,
      caseId: "LM-2025-0003",
      title: "Tenant Agreement",
      description: "Dispute over tenant agreement terms and conditions",
      caseType: "Property",
      status: "Resolved",
      state: "Telangana",
      district: "Rangareddy",
      priority: "Low",
      createdAt: new Date(now.getTime() - 60 * 86400000),
    });

    const case4 = await Case.create({
      citizen: citizen._id,
      caseId: "LM-2025-0004",
      title: "Land Acquisition",
      description: "Government land acquisition compensation dispute",
      caseType: "Property",
      status: "Active",
      state: "Telangana",
      district: "Rangareddy",
      priority: "High",
      createdAt: new Date(now.getTime() - 20 * 86400000),
    });

    const case5 = await Case.create({
      citizen: citizen._id,
      caseId: "LM-2025-0005",
      title: "Contract Breach",
      description: "Breach of service contract by vendor company",
      caseType: "Contract",
      status: "Pending",
      state: "Telangana",
      district: "Hyderabad",
      priority: "Medium",
      createdAt: new Date(now.getTime() - 10 * 86400000),
    });

    console.log("Cases created ✅");

    // ── Create Documents ───────────────────────────────────
    const allCases = [case1, case2, case3, case4, case5];
    const docsInfo = [
      { name: "Hearing Notice.pdf", fileType: "PDF", fileSize: 1258291, status: "Verified", daysAgo: 2 },
      { name: "Property Deed.pdf", fileType: "PDF", fileSize: 3565158, status: "Verified", daysAgo: 12 },
      { name: "Affidavit.docx", fileType: "DOCX", fileSize: 838860, status: "Pending", daysAgo: 20 },
      { name: "Court Order.pdf", fileType: "PDF", fileSize: 2202009, status: "Verified", daysAgo: 30 },
      { name: "ID Proof.jpg", fileType: "JPG", fileSize: 524288, status: "Pending", daysAgo: 45 },
    ];

    for (let i = 0; i < docsInfo.length; i++) {
      const d = docsInfo[i];
      await Document.create({
        citizen: citizen._id,
        case: allCases[i]._id,
        name: d.name,
        originalName: d.name,
        filePath: "seed-" + d.name.replace(/\s/g, "-").toLowerCase(),
        fileType: d.fileType,
        fileSize: d.fileSize,
        status: d.status,
        createdAt: new Date(now.getTime() - d.daysAgo * 86400000),
      });
    }

    console.log("Documents created ✅");

    // ── Create Activities ──────────────────────────────────
    const actData = [
      { text: "Document Uploaded", type: "document_uploaded", hoursAgo: 2 },
      { text: "Case Status Updated", type: "status_changed", hoursAgo: 24 },
      { text: "New Case Registered", type: "case_filed", hoursAgo: 48 },
      { text: "Profile Updated", type: "general", hoursAgo: 72 },
      { text: "AI Assistant Used", type: "general", hoursAgo: 120 },
    ];

    for (const a of actData) {
      await Activity.create({
        citizen: citizen._id,
        case: case1._id,
        text: a.text,
        type: a.type,
        createdAt: new Date(now.getTime() - a.hoursAgo * 3600000),
      });
    }

    console.log("Activities created ✅");

    // ── Create Notifications ───────────────────────────────
    await Notification.create({
      citizen: citizen._id,
      title: "Welcome to LegalMind",
      message: "Your account has been created successfully. Start by exploring the AI Legal Assistant.",
      type: "general",
      read: false,
    });

    await Notification.create({
      citizen: citizen._id,
      title: "Document Verified",
      message: "Your Property Deed has been verified successfully",
      type: "document",
      read: false,
    });

    await Notification.create({
      citizen: citizen._id,
      title: "Case Status Updated",
      message: "Your Property Dispute case status has been updated to Active",
      type: "general",
      read: true,
    });

    console.log("Notifications created ✅");

    // ── Create FAQs ────────────────────────────────────────
    const faqsData = [
      {
        question: "How do I track my case status?",
        answer: "Go to 'Track Case' and enter your Case ID (e.g. LM-2025-0001). You will see a step-by-step progress of your case.",
        category: "Cases",
        order: 1,
      },
      {
        question: "How do I register a case ID?",
        answer: "During signup or from your profile, you can enter your existing court case ID. This lets the system track and display your case progress.",
        category: "Cases",
        order: 2,
      },
      {
        question: "How do I find a lawyer?",
        answer: "Click 'Find Lawyers' to browse verified lawyers. You can filter by specialization, district, language, and experience.",
        category: "Lawyers",
        order: 1,
      },
      {
        question: "Are all lawyers on this platform verified?",
        answer: "Yes, all lawyers in the directory are verified professionals. Pro Bono lawyers are registered under the DoJ Pro Bono scheme.",
        category: "Lawyers",
        order: 2,
      },
      {
        question: "How do I use the AI Legal Assistant?",
        answer: "Click 'AI Assistant' from your dashboard. You can ask any legal question in plain language and get instant guidance based on Indian law.",
        category: "AI Assistant",
        order: 1,
      },
      {
        question: "How do I upload documents?",
        answer: "Go to 'Documents', click 'Upload', select your file, optionally link it to a case, and submit. Supported formats: PDF, DOC, DOCX, JPG, PNG.",
        category: "Documents",
        order: 1,
      },
      {
        question: "How do I detect if a notice is a scam?",
        answer: "Use the 'Scam Detection' tool under Legal Assistance. Upload or paste the notice text and our AI will analyze it for scam indicators.",
        category: "AI Assistant",
        order: 2,
      },
      {
        question: "How do I update my profile?",
        answer: "Go to 'Profile' from the sidebar to update your name, phone number, address, and other details.",
        category: "Account",
        order: 1,
      },
      {
        question: "Is my data secure?",
        answer: "Yes, all data is encrypted and stored securely. Your personal information is only visible to you and authorized platform administrators.",
        category: "General",
        order: 1,
      },
      {
        question: "How do I contact support?",
        answer: "Go to 'Help Center' and fill out the contact form. Our support team will respond within 24-48 hours.",
        category: "General",
        order: 2,
      },
    ];

    for (const faq of faqsData) {
      await FAQ.create(faq);
    }

    console.log("FAQs created ✅");

    console.log("\n🎉 Seed completed successfully!");
    console.log("─────────────────────────────────────");
    console.log("👤 Citizen  : rahul@example.com / password123");
    console.log("🔧 Admin    : admin@legalmind.in / admin123");
    console.log("─────────────────────────────────────");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();