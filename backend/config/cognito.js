import "dotenv/config";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const userPoolId = process.env.COGNITO_USER_POOL_ID || "";
const clientId = process.env.COGNITO_CLIENT_ID || undefined;
const region = process.env.AWS_REGION || "us-east-1";

if (!userPoolId) {
  console.warn("COGNITO_USER_POOL_ID is not set. Cognito verification will fail until configured.");
}

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const client = jwksClient({
  jwksUri: `${issuer}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const pub = key.getPublicKey();
    callback(null, pub);
  });
}

export function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    const options = {
      algorithms: ["RS256"],
      issuer,
    };
    if (clientId) options.audience = clientId;

    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

export default {
  verifyAccessToken,
};
