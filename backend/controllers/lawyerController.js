import User from "../models/User.js";

// ======================
// Browse Lawyers
// ======================

export const browseLawyers =
async (req, res) => {
  try {
    const {
      specialization,
      search,
      district,
      language,
      minRating,
      page = 1,
      limit = 12,
    } =
      req.query;

    const filter = {
      role:
        "lawyer",
    };

    if (
      specialization
    ) {
      filter.specialization =
        {
          $regex:
            specialization,

          $options:
            "i",
        };
    }

    if (
      district
    ) {
      filter.district =
        district;
    }

    if (
      language
    ) {
      filter.languages =
        {
          $in: [
            language,
          ],
        };
    }

    if (
      search
    ) {
      filter.$or =
        [
          {
            name:
              {
                $regex:
                  search,

                $options:
                  "i",
              },
          },

          {
            specialization:
              {
                $regex:
                  search,

                $options:
                  "i",
              },
          },
        ];
    }

    if (
      minRating
    ) {
      filter.rating =
        {
          $gte:
            Number(
              minRating
            ),
        };
    }

    const skip =
      (
        Number(
          page
        ) -
        1
      ) *
      Number(
        limit
      );

    const [
      lawyers,
      total,
    ] =
      await Promise.all(
        [
          User.find(
            filter
          )
            .select(
              "-password"
            )
            .sort(
              {
                rating:
                  -1,
              }
            )
            .skip(
              skip
            )
            .limit(
              Number(
                limit
              )
            ),

          User.countDocuments(
            filter
          ),
        ]
      );

    res.json({
      success:
        true,

      lawyers,

      total,

      page:
        Number(
          page
        ),

      totalPages:
        Math.ceil(
          total /
            limit
        ),
    });
  } catch (
    error
  ) {
    console.error(
      error
    );

    res
      .status(
        500
      )
      .json({
        success:
          false,

        error:
          error.message,
      });
  }
};

// ======================
// Single Lawyer
// ======================

export const getLawyerProfile =
async (
  req,
  res
) => {
  try {
    const lawyer =
      await User.findOne(
        {
          _id:
            req.params
              .id,

          role:
            "lawyer",
        }
      ).select(
        "-password"
      );

    if (
      !lawyer
    ) {
      return res
        .status(
          404
        )
        .json({
          success:
            false,

          message:
            "Lawyer not found",
        });
    }

    const contactOnly =
      lawyer.importedFrom ===
      "DoJ Pro Bono";

    const contact =
      contactOnly
        ? {
            portal:
              "https://www.probono-doj.in",

            helpline:
              "15100",
          }
        : null;

    res.json(
      {
        success:
          true,

        lawyer:
          {
            ...lawyer.toObject(),

            isContactOnly:
              contactOnly,
          },

        contact,
      }
    );
  } catch (
    error
  ) {
    res
      .status(
        500
      )
      .json({
        success:
          false,

        error:
          error.message,
      });
  }
};