const jwt = require("jsonwebtoken");

const allowToCreateTheProductOnlyIfSellerIdIsThere = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user role is valid
    if (!decoded.role || (decoded.role !== "user" && decoded.role !== "admin")) {
      return res.status(403).json({ message: "You must be a user or admin to create a product" });
    }

    // Set req.user for next middleware/route
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = allowToCreateTheProductOnlyIfSellerIdIsThere;