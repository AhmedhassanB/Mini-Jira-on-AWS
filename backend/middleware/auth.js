import { verifyAccessToken } from "../config/cognito.js";

function extractClaim(payload, keys) {
  for (const k of keys) {
    if (payload[k]) return payload[k];
  }
  return undefined;
}

export async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = auth.split(" ")[1];
    const payload = await verifyAccessToken(token);

    // Cognito custom attributes are often exposed as `custom:attrName`
    const role = extractClaim(payload, ["custom:role", "role", "roleId"]);
    const teamId = extractClaim(payload, ["custom:teamId", "teamId"]);

    req.user = {
      sub: payload.sub,
      username: payload.username || payload["cognito:username"],
      role: role || null,
      teamId: teamId || null,
      claims: payload,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token", details: err?.message });
  }
}

export function requireManager(req, res, next) {
  if (req.user && req.user.role && String(req.user.role).toLowerCase() === "manager") {
    return next();
  }
  return res.status(403).json({ error: "Requires Manager role" });
}

export default {
  authMiddleware,
  requireManager,
};
