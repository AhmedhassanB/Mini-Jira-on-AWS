import { verifyAccessToken } from "../config/cognito.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDB from "../config/dynamodb.js";

const usersTableName = process.env.USERS_TABLE_NAME || "Users";

async function fetchDbProfile(sub) {
  try {
    const result = await dynamoDB.send(
      new GetCommand({ TableName: usersTableName, Key: { userId: sub } })
    );
    return result.Item || null;
  } catch {
    return null;
  }
}

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

    // Enrich with DynamoDB profile so downstream controllers get real name/role/teamId
    const db = await fetchDbProfile(payload.sub);

    const role = db?.role || extractClaim(payload, ["custom:role", "role", "roleId"]) || null;
    const teamId = db?.teamId || extractClaim(payload, ["custom:teamId", "teamId"]) || null;

    req.user = {
      sub: payload.sub,
      // db.username is the display name stored at signup; never expose Cognito internal UUID
      username: db?.username || db?.name || null,
      email: db?.email || null,
      role,
      teamId,
      dbProfile: db || null,   // forwarded to me() so it doesn't do a second DynamoDB call
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

// Admin is the only role that can create/update/delete teams and add users to teams
export function requireAdmin(req, res, next) {
  if (req.user && req.user.role && String(req.user.role).toLowerCase() === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Requires Admin role" });
}

// Read-only operations visible to both managers and admins (e.g. listing users to display team members)
export function requireManagerOrAdmin(req, res, next) {
  const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
  if (role === "manager" || role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Requires Manager or Admin role" });
}

export default {
  authMiddleware,
  requireManager,
  requireAdmin,
  requireManagerOrAdmin,
};
