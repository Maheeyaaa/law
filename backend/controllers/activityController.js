import Activity from "../models/Activity.js";

// ======================
// Get User Activity
// ======================

export const getMyActivity =
async (req, res) => {
  try {
    const limit =
      parseInt(
        req.query.limit
      ) || 10;

    const activities =
      await Activity.find({
        citizen:
          req.user.id,
      })
        .sort({
          createdAt:
            -1,
        })
        .limit(
          limit
        );

    const now =
      new Date();

    const formatted =
      activities.map(
        (
          activity
        ) => {
          const diff =
            now -
            activity.createdAt;

          const minutes =
            Math.floor(
              diff /
                60000
            );

          const hours =
            Math.floor(
              diff /
                3600000
            );

          const days =
            Math.floor(
              diff /
                86400000
            );

          let time =
            "Just now";

          if (
            minutes >=
              1 &&
            minutes <
              60
          ) {
            time =
              `${minutes}m ago`;
          }

          if (
            hours >=
              1 &&
            hours <
              24
          ) {
            time =
              `${hours}h ago`;
          }

          if (
            days >=
            1
          ) {
            time =
              `${days}d ago`;
          }

          return {
            ...activity.toObject(),

            time,
          };
        }
      );

    res.json({
      count:
        formatted.length,

      activities:
        formatted,
    });
  } catch (
    error
  ) {
    console.error(
      error
    );

    res
      .status(500)
      .json({
        message:
          "Failed to load activities",
      });
  }
};