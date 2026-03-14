// backend/middleware/roleMiddleware.js

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

export const requireCitizen = requireRole("citizen");
export const requireLawyer = requireRole("lawyer");
export const requireCourtStaff = requireRole("Court Staff");