/**
 * auth.js — Mock authentication middleware
 *
 * Rules (all permissive for demo):
 *   - Any non-empty Authorization or authCode header passes
 *   - Header name is case-insensitive (Express lowercases them)
 *   - Returns 401 with a clear message if missing
 */

function auth(req, res, next) {
  const token = req.headers["authorization"] || req.headers["authcode"] || "";
  if (!token || token.trim() === "") {
    return res.status(401).json({
      error: "Unauthorized",
      hint:  "Provide any value in Authorization header. Example: Bearer demo-token",
    });
  }
  next();
}

module.exports = auth;
