// backend/seed.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import Case from "./models/Case.js";
import Hearing from "./models/Hearing.js";
import Document from "./models/Document.js";
import Activity from "./models/Activity.js";
import Notification from "./models/Notification.js";

// Fix DNS issue
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
    await Hearing.deleteMany({});
    await Document.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    console.log("Cleared old data ✅");

    // Find or create citizen
    let citizen = await User.findOne({ email: "rahul@example.com" });

    if (!citizen) {
      const hashed = await bcrypt.hash("password123", 10);
      citizen = await User.create({
        name: "Rahul Kumar",
        email: "rahul@example.com",
        password: hashed,
        role: "citizen",
        verificationStatus: "approved",
      });
      console.log("Created citizen ✅");
    } else {
      console.log("Citizen already exists ✅");
    }

    // Create lawyers
    const lawyerInfos = [
      {
        name: "Adv. Ananya Priya",
        email: "ananya@example.com",
        specialization: "Property Law",
        experience: 8,
      },
      {
        name: "Adv. Suresh K.",
        email: "suresh@example.com",
        specialization: "Employment Law",
        experience: 12,
      },
      {
        name: "Adv. Ritu Mehra",
        email: "ritu@example.com",
        specialization: "Consumer Law",
        experience: 6,
      },
      {
        name: "Adv. N. Verma",
        email: "nverma@example.com",
        specialization: "Family Law",
        experience: 15,
      },
    ];

    const lawyers = [];

    for (const info of lawyerInfos) {
      let lawyer = await User.findOne({ email: info.email });
      if (!lawyer) {
        const hashed = await bcrypt.hash("password123", 10);
        lawyer = await User.create({
          ...info,
          password: hashed,
          role: "lawyer",
          barCouncilNumber: "BC-" + Math.floor(10000 + Math.random() * 90000),
          verificationStatus: "approved",
        });
      }
      lawyers.push(lawyer);
    }
    console.log("Lawyers ready ✅");

    // Create cases
    const now = new Date();

    const case1 = await Case.create({
      citizen: citizen._id,
      title: "Property Dispute",
      description:
        "Dispute regarding ownership of residential property in Sector 45",
      caseType: "Property",
      status: "Active",
      assignedLawyer: lawyers[0]._id,
      priority: "High",
      nextHearingDate: new Date(now.getTime() + 5 * 86400000),
    });

    const case2 = await Case.create({
      citizen: citizen._id,
      title: "Civil Complaint",
      description: "Civil complaint against municipal corporation",
      caseType: "Civil Dispute",
      status: "Pending",
      priority: "Medium",
    });

    const case3 = await Case.create({
      citizen: citizen._id,
      title: "Tenant Agreement",
      description: "Dispute over tenant agreement terms and conditions",
      caseType: "Property",
      status: "Resolved",
      assignedLawyer: lawyers[0]._id,
      priority: "Low",
    });

    const case4 = await Case.create({
      citizen: citizen._id,
      title: "Land Acquisition",
      description: "Government land acquisition compensation dispute",
      caseType: "Property",
      status: "Active",
      assignedLawyer: lawyers[1]._id,
      priority: "High",
      nextHearingDate: new Date(now.getTime() + 12 * 86400000),
    });

    const case5 = await Case.create({
      citizen: citizen._id,
      title: "Contract Breach",
      description: "Breach of service contract by vendor company",
      caseType: "Contract",
      status: "Pending",
      priority: "Medium",
    });

    const case6 = await Case.create({
      citizen: citizen._id,
      title: "Divorce Filing",
      description: "Mutual consent divorce proceeding",
      caseType: "Family",
      status: "Resolved",
      assignedLawyer: lawyers[3]._id,
      priority: "Medium",
    });

    const case7 = await Case.create({
      citizen: citizen._id,
      title: "Consumer Complaint",
      description: "Defective product complaint against electronics company",
      caseType: "Consumer",
      status: "Active",
      assignedLawyer: lawyers[2]._id,
      priority: "Low",
    });

    console.log("Cases created ✅");

    // Create hearings
    await Hearing.create({
      case: case1._id,
      citizen: citizen._id,
      hearingDate: new Date(now.getTime() + 5 * 86400000),
      hearingTime: "10:30 AM",
      courtRoom: "Court Room 3A",
      judgeName: "Hon. Justice Sharma",
      purpose: "Property ownership evidence review",
      status: "Scheduled",
    });

    await Hearing.create({
      case: case4._id,
      citizen: citizen._id,
      hearingDate: new Date(now.getTime() + 12 * 86400000),
      hearingTime: "2:00 PM",
      courtRoom: "Court Room 7B",
      judgeName: "Hon. Justice Mehta",
      purpose: "Land compensation assessment",
      status: "Scheduled",
    });

    await Hearing.create({
      case: case3._id,
      citizen: citizen._id,
      hearingDate: new Date(now.getTime() - 10 * 86400000),
      hearingTime: "11:00 AM",
      courtRoom: "Court Room 2A",
      judgeName: "Hon. Justice Patel",
      purpose: "Final settlement hearing",
      status: "Completed",
    });

    console.log("Hearings created ✅");

    // Create documents
    const allCases = [case1, case2, case3, case4, case5];
    const docsInfo = [
      { name: "Hearing Notice.pdf", fileType: "PDF", fileSize: "1.2 MB", status: "Verified", daysAgo: 2 },
      { name: "Property Deed.pdf", fileType: "PDF", fileSize: "3.4 MB", status: "Verified", daysAgo: 12 },
      { name: "Affidavit.docx", fileType: "DOCX", fileSize: "0.8 MB", status: "Pending", daysAgo: 20 },
      { name: "Court Order.pdf", fileType: "PDF", fileSize: "2.1 MB", status: "Verified", daysAgo: 30 },
      { name: "ID Proof.jpg", fileType: "JPG", fileSize: "0.5 MB", status: "Pending", daysAgo: 45 },
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

    // Create activities
    const actData = [
      { text: "Hearing Notice Issued", type: "hearing_notice", hoursAgo: 2 },
      { text: "Document Uploaded", type: "document_uploaded", hoursAgo: 24 },
      { text: "Case Status Updated", type: "status_changed", hoursAgo: 48 },
      { text: "Lawyer Assigned", type: "lawyer_assigned", hoursAgo: 72 },
      { text: "New Case Filed", type: "case_filed", hoursAgo: 120 },
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

    // Create notifications
    await Notification.create({
      citizen: citizen._id,
      title: "Upcoming Hearing",
      message: "You have a hearing scheduled for your Property Dispute case",
      type: "hearing",
      read: false,
    });

    await Notification.create({
      citizen: citizen._id,
      title: "Document Verified",
      message: "Your Property Deed has been verified by the court",
      type: "document",
      read: false,
    });

    await Notification.create({
      citizen: citizen._id,
      title: "Lawyer Assigned",
      message: "Adv. Ananya Priya has been assigned to your Property Dispute case",
      type: "lawyer",
      read: true,
    });

    console.log("Notifications created ✅");

        // Create timeline events for existing cases
    const CaseTimeline = (await import("./models/CaseTimeline.js")).default;
    await CaseTimeline.deleteMany({});

    // Case 1 (Property Dispute - Active, has lawyer + hearing)
    await CaseTimeline.create({
      case: case1._id,
      citizen: citizen._id,
      event: "Case Filed",
      description: 'Case "Property Dispute" has been filed successfully',
      type: "case_filed",
      completedAt: new Date(now.getTime() - 30 * 86400000),
    });
    await CaseTimeline.create({
      case: case1._id,
      citizen: citizen._id,
      event: "Under Review",
      description: "Your case is being reviewed by the court",
      type: "under_review",
      completedAt: new Date(now.getTime() - 28 * 86400000),
    });
    await CaseTimeline.create({
      case: case1._id,
      citizen: citizen._id,
      event: "Lawyer Assigned",
      description: "Adv. Ananya Priya has been assigned to your case",
      type: "lawyer_assigned",
      completedAt: new Date(now.getTime() - 20 * 86400000),
    });
    await CaseTimeline.create({
      case: case1._id,
      citizen: citizen._id,
      event: "Hearing Scheduled",
      description: "Hearing scheduled for property ownership evidence review",
      type: "hearing_scheduled",
      completedAt: new Date(now.getTime() - 10 * 86400000),
    });

    // Case 2 (Civil Complaint - Pending, no lawyer)
    await CaseTimeline.create({
      case: case2._id,
      citizen: citizen._id,
      event: "Case Filed",
      description: 'Case "Civil Complaint" has been filed successfully',
      type: "case_filed",
      completedAt: new Date(now.getTime() - 15 * 86400000),
    });
    await CaseTimeline.create({
      case: case2._id,
      citizen: citizen._id,
      event: "Under Review",
      description: "Your case is being reviewed by the court",
      type: "under_review",
      completedAt: new Date(now.getTime() - 14 * 86400000),
    });

    // Case 3 (Tenant Agreement - Resolved)
    await CaseTimeline.create({
      case: case3._id,
      citizen: citizen._id,
      event: "Case Filed",
      description: 'Case "Tenant Agreement" has been filed',
      type: "case_filed",
      completedAt: new Date(now.getTime() - 60 * 86400000),
    });
    await CaseTimeline.create({
      case: case3._id,
      citizen: citizen._id,
      event: "Under Review",
      description: "Case reviewed",
      type: "under_review",
      completedAt: new Date(now.getTime() - 55 * 86400000),
    });
    await CaseTimeline.create({
      case: case3._id,
      citizen: citizen._id,
      event: "Lawyer Assigned",
      description: "Adv. Ananya Priya assigned",
      type: "lawyer_assigned",
      completedAt: new Date(now.getTime() - 50 * 86400000),
    });
    await CaseTimeline.create({
      case: case3._id,
      citizen: citizen._id,
      event: "Hearing Scheduled",
      description: "Final settlement hearing scheduled",
      type: "hearing_scheduled",
      completedAt: new Date(now.getTime() - 30 * 86400000),
    });
    await CaseTimeline.create({
      case: case3._id,
      citizen: citizen._id,
      event: "Hearing Completed",
      description: "Settlement hearing completed",
      type: "hearing_completed",
      completedAt: new Date(now.getTime() - 15 * 86400000),
    });
    await CaseTimeline.create({
      case: case3._id,
      citizen: citizen._id,
      event: "Case Resolved",
      description: "Case resolved with mutual agreement",
      type: "resolved",
      completedAt: new Date(now.getTime() - 10 * 86400000),
    });

    console.log("Timeline events created ✅");

    console.log("\n🎉 Seed completed!");
    console.log("Login: rahul@example.com / password123");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();