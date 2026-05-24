// backend/utils/seedLawyers.js

import bcrypt from "bcryptjs";
import User from "../models/User.js";

const SAMPLE_LAWYERS = [
  {
    name: "Adv. Rajesh Kumar",
    district: "Hyderabad",
    specialization: "Criminal Law",
  },

  {
    name: "Adv. Priya Sharma",
    district: "Hyderabad",
    specialization: "Family Law",
  },

  {
    name: "Adv. Mohammed Ali",
    district: "Warangal Urban",
    specialization: "Civil Law",
  },
];

const DEFAULT_PASSWORD =
  "lawyer@123";

function buildLawyer(
  lawyer,
  index,
  password
) {
  return {
    name:
      lawyer.name,

    email:
      `seed.${index}@advocate.in`,

    password,

    role:
      "lawyer",

    state:
      "Telangana",

    district:
      lawyer.district,

    specialization:
      lawyer.specialization,

    verificationStatus:
      "approved",

    isVerified:
      true,

    importedFrom:
      "Seed",

    availability:
      "available",

    languages: [
      "English",
      "Telugu",
    ],

    rating: 0,

    totalReviews: 0,

    casesHandled: 0,

    casesWon: 0,
  };
}

export async function seedLawyers() {
  try {
    const existing =
      await User.countDocuments({
        importedFrom:
          "Seed",
      });

    if (
      existing > 0
    ) {
      console.log(
        "Seed already exists"
      );

      return;
    }

    const password =
      await bcrypt.hash(
        DEFAULT_PASSWORD,
        10
      );

    const lawyers =
      SAMPLE_LAWYERS.map(
        (
          lawyer,
          index
        ) =>
          buildLawyer(
            lawyer,
            index,
            password
          )
      );

    await User.insertMany(
      lawyers
    );

    console.log(
      `Seeded ${lawyers.length} lawyers`
    );
  } catch (
    error
  ) {
    console.error(
      "Seed failed:",
      error.message
    );
  }
}

export default
  seedLawyers;