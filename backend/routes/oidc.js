import express from "express";
import { Issuer, generators } from "openid-client";

const router = express.Router();

const region = process.env.AWS_REGION || "us-east-1";
const userPoolId = (process.env.COGNITO_USER_POOL_ID || "").trim();
const clientId = (process.env.COGNITO_CLIENT_ID || "").trim();
const clientSecret = (process.env.COGNITO_CLIENT_SECRET || "").trim();
const redirectUri = process.env.OIDC_REDIRECT_URI || "http://localhost:3000/oidc/callback";
const logoutUri = process.env.OIDC_LOGOUT_URI || "http://localhost:3000/";
const oidcScopes = (process.env.OIDC_SCOPES || "openid email").trim();
const tokenAuthMethod = (process.env.OIDC_TOKEN_AUTH_METHOD || "client_secret_post").trim();

const issuerUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

let clientPromise = null;

async function getClient() {
  if (!userPoolId || !clientId) {
    throw new Error("Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID");
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const issuer = await Issuer.discover(issuerUrl);
      const useClientSecret = Boolean(clientSecret);
      return new issuer.Client({
        client_id: clientId,
        ...(useClientSecret ? { client_secret: clientSecret } : {}),
        redirect_uris: [redirectUri],
        response_types: ["code"],
        token_endpoint_auth_method: useClientSecret ? tokenAuthMethod : "none",
      });
    })();
  }

  return clientPromise;
}

router.get("/login", async (req, res) => {
  try {
    const client = await getClient();
    const nonce = generators.nonce();
    const state = generators.state();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    req.session.nonce = nonce;
    req.session.state = state;
    req.session.codeVerifier = codeVerifier;

    const authUrl = client.authorizationUrl({
      scope: oidcScopes,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return req.session.save(() => res.redirect(authUrl));
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.get("/callback", async (req, res) => {
  try {
    const client = await getClient();
    const params = client.callbackParams(req);

    if (!req.session?.state || !req.session?.nonce || !req.session?.codeVerifier) {
      return res.status(400).send("Missing login session. Start at /oidc/login in the same browser tab.");
    }

    const tokenSet = await client.callback(redirectUri, params, {
      nonce: req.session.nonce,
      state: req.session.state,
      code_verifier: req.session.codeVerifier,
    });

    const userInfo = await client.userinfo(tokenSet.access_token);
    req.session.userInfo = userInfo;
    req.session.idToken = tokenSet.id_token;
    req.session.accessToken = tokenSet.access_token;

    return res.redirect("/");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.get("/logout", async (req, res) => {
  try {
    const client = await getClient();
    const idTokenHint = req.session?.idToken;

    req.session.destroy(() => {
      const logoutUrl = client.endSessionUrl({
        id_token_hint: idTokenHint,
        post_logout_redirect_uri: logoutUri,
      });
      return res.redirect(logoutUrl);
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

export default router;