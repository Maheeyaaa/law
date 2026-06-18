import axios from "axios";
import * as cheerio from "cheerio";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns"
import ScrapedLawyer from "../../models/ScrapedLawyer.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
};

const cleanText = (t) =>
  t?.replace(/\s+/g, " ").trim() || "";

async function enrichLawyer(lawyer) {
  if (!lawyer.profileUrl) return false;

  try {
    const res = await axios.get(
      lawyer.profileUrl,
      {
        headers: HEADERS,
        timeout: 20000,
      }
    );

    const $ = cheerio.load(res.data);

    const specializations = [];

    $("h6.text-muted").each((_, el) => {
      const text = cleanText(
        $(el).text()
      );

      const ignore =
        text.includes("@") ||
        /^\d+$/.test(text) ||
        text.length < 3;

      if (!ignore) {
        specializations.push(text);
      }
    });

    const uniqueSpecializations =
      [...new Set(specializations)];

    await ScrapedLawyer.updateOne(
      { _id: lawyer._id },
      {
        $set: {
          specializations:
            uniqueSpecializations,
          specialization:
            uniqueSpecializations[0] ||
            lawyer.specialization,
        },
      }
    );

    console.log(
      `✅ ${lawyer.name} -> ${uniqueSpecializations.length} specializations`
    );

    return true;
  } catch (err) {
    console.log(
      `❌ ${lawyer.name}: ${err.message}`
    );
    return false;
  }
}

async function main() {
  await mongoose.connect(
    process.env.MONGO_URI
  );

  const lawyers =
    await ScrapedLawyer.find({
      profileUrl: {
        $exists: true,
        $ne: null,
      },
    });

  console.log(
    `Found ${lawyers.length} lawyers`
  );

  let updated = 0;

  for (const lawyer of lawyers) {
    const ok =
      await enrichLawyer(lawyer);

    if (ok) updated++;
  }

  console.log(
    `\nDone. Updated ${updated} lawyers`
  );

  process.exit(0);
}

main().catch(console.error);