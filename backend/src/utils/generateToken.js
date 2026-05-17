import jwt from "jsonwebtoken";

/*
  This function creates a JWT token after login/register.
  Important:
  - The payload key is userId.
  - authMiddleware.js must read the same key: decoded.userId.
*/
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in backend/.env");
  }

  return jwt.sign(
    { userId: String(userId) },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
};

export default generateToken;