import "dotenv/config";

import crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
  UpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDB from "../config/dynamodb.js";

const region = process.env.AWS_REGION || "us-east-1";
const userPoolId = (process.env.COGNITO_USER_POOL_ID || "").trim();
const clientId = (process.env.COGNITO_CLIENT_ID || "").trim();
const clientSecret = (process.env.COGNITO_CLIENT_SECRET || "").trim();

const cognito = new CognitoIdentityProviderClient({ region });
const usersTableName = process.env.USERS_TABLE_NAME || "Users";

async function upsertUserProfile({ userSub, username, email, role, teamId }) {
  const createdAt = new Date().toISOString();
  const item = {
    userId: userSub,
    username,
    email,
    role,
    cognitoSub: userSub,
    createdAt,
  };

  if (teamId) {
    item.teamId = teamId;
  }

  await dynamoDB.send(
    new PutCommand({
      TableName: usersTableName,
      Item: item,
    })
  );
}

function secretHash(username) {
  if (!clientSecret) return undefined;
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(`${username}${clientId}`)
    .digest("base64");
}

function pickEmail(body) {
  return body.email || "";
}

function requireConfig(res) {
  if (!userPoolId || !clientId) {
    res.status(500).json({
      error: "Cognito is not configured",
      details: "Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in backend/.env",
    });
    return false;
  }
  return true;
}

export async function signup(req, res) {
  try {
    if (!requireConfig(res)) return;

    const appUsername = (req.body.username || "").trim();
    const email = pickEmail(req.body).trim();
    const { password, role = "Employee", teamId = "" } = req.body;
    if (!appUsername || !email || !password) {
      return res.status(400).json({ error: "username, email and password are required" });
    }

    const userAttributes = [
      { Name: "email", Value: email },
      { Name: "name", Value: appUsername },
    ];

    const cmd = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      SecretHash: secretHash(email),
      UserAttributes: userAttributes,
    });

    let out;
    try {
      out = await cognito.send(cmd);
    } catch (error) {
      if (error?.name !== "UsernameExistsException") {
        throw error;
      }

      // Cognito user already exists; fetch the sub and ensure DynamoDB has the app profile.
      const existing = await cognito.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }));
      const attrs = Object.fromEntries((existing.UserAttributes || []).map((a) => [a.Name, a.Value]));
      const userSub = attrs.sub || existing.Username || email;
      await upsertUserProfile({ userSub, username: appUsername, email, role, teamId });

      return res.status(200).json({
        message: "User already existed in Cognito; DynamoDB profile saved",
        userSub,
        userConfirmed: true,
        codeDeliveryDetails: null,
      });
    }

    await upsertUserProfile({ userSub: out.UserSub, username: appUsername, email, role, teamId });

    return res.status(201).json({
      message: "Signup successful",
      userSub: out.UserSub,
      userConfirmed: out.UserConfirmed,
      codeDeliveryDetails: out.CodeDeliveryDetails || null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.name || "Signup failed", details: error.message });
  }
}

export async function confirmSignup(req, res) {
  try {
    if (!requireConfig(res)) return;

    const email = pickEmail(req.body).trim();
    const confirmationCode = req.body.confirmationCode || req.body.code || "";
    if (!email || !confirmationCode) {
      return res.status(400).json({ error: "email and confirmationCode/code are required" });
    }

    const cmd = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash(email),
    });

    await cognito.send(cmd);
    return res.json({ message: "Signup confirmed" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.name || "Confirm signup failed", details: error.message });
  }
}

export async function login(req, res) {
  try {
    if (!requireConfig(res)) return;

    const email = pickEmail(req.body).trim();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const cmd = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        ...(clientSecret ? { SECRET_HASH: secretHash(email) } : {}),
      },
    });

    const out = await cognito.send(cmd);
    return res.json({
      message: "Login successful",
      accessToken: out.AuthenticationResult?.AccessToken || null,
      idToken: out.AuthenticationResult?.IdToken || null,
      refreshToken: out.AuthenticationResult?.RefreshToken || null,
      expiresIn: out.AuthenticationResult?.ExpiresIn || null,
      tokenType: out.AuthenticationResult?.TokenType || null,
    });
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: error.name || "Login failed", details: error.message });
  }
}

export async function me(req, res) {
  try {
    // req.user is already populated by authMiddleware (JWT-verified + DynamoDB-enriched)
    const { sub, role, teamId, dbProfile, claims } = req.user;

    return res.json({
      username: sub,           // Cognito internal id — clients must not display this
      userAttributes: {
        sub,
        email: dbProfile?.email || claims?.email || "",
        name: dbProfile?.username || dbProfile?.name || "",
      },
      // profile is the definitive user record from DynamoDB
      profile: {
        name: dbProfile?.username || dbProfile?.name || null,
        email: dbProfile?.email || null,
        role: role || null,
        teamId: teamId || null,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: error.name || "Failed to get user", details: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    if (!requireConfig(res)) return;

    const auth = req.headers.authorization || req.headers.Authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const token = auth.split(" ")[1];
    const name = (req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    await cognito.send(
      new UpdateUserAttributesCommand({
        AccessToken: token,
        UserAttributes: [{ Name: "name", Value: name }],
      })
    );

    return res.json({ message: "Profile updated", name });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.name || "Update failed", details: error.message });
  }
}

export async function testProtected(req, res) {
  return res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
}

export default {
  signup,
  confirmSignup,
  login,
  me,
  testProtected,
};
