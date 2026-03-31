import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  console.log("🔍 Auth middleware triggered");
  console.log("📥 Headers:", req.headers);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token received:", token.substring(0, 30) + "...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    console.log("✅ Token decoded successfully:", decoded);

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

};

export default protect;