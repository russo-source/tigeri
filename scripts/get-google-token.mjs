// One-time OAuth helper: get a Google refresh token for read-write Sheets access
// WITHOUT a service-account key (works under the iam.disableServiceAccountKeyCreation org policy).
//
// Prereqs (Cloud Console):
//   1. OAuth consent screen -> User type: Internal
//   2. Credentials -> Create credentials -> OAuth client ID -> Application type: Desktop app
//   3. Put the client id/secret in .env.local:
//        GOOGLE_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
//        GOOGLE_OAUTH_CLIENT_SECRET=xxxx
//
// Run:
//   node --env-file=.env.local scripts/get-google-token.mjs
//
// It starts a localhost listener, prints a URL to open, you approve in the browser,
// and it prints the refresh token + a ready-to-paste .env.local block.

import http from "node:http";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET.\n" +
      "Add them to .env.local and run: node --env-file=.env.local scripts/get-google-token.mjs"
  );
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (!code && !error) {
    res.writeHead(404).end();
    return;
  }
  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" }).end(`<h2>Failed: ${error}</h2>`);
    console.error("OAuth error:", error);
    server.close();
    process.exit(1);
  }

  const port = server.address().port;
  try {
    const body = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: `http://localhost:${port}`,
      grant_type: "authorization_code",
    });
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const tok = await r.json();
    if (!r.ok || !tok.refresh_token) {
      res.writeHead(200, { "Content-Type": "text/html" }).end("<h2>No refresh token returned. Check the console.</h2>");
      console.error("Token response:", tok);
      console.error("\nIf refresh_token is missing, revoke prior access at https://myaccount.google.com/permissions and re-run (the script forces prompt=consent).");
      server.close();
      process.exit(1);
    }
    res.writeHead(200, { "Content-Type": "text/html" }).end("<h2>✓ Got the refresh token. You can close this tab and return to the terminal.</h2>");
    console.log("\n✓ SUCCESS — paste this into .env.local:\n");
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tok.refresh_token}`);
    console.log(`GOOGLE_SHEET_ID=1uSwNbQN-KFV6AOujmaDu5L-Yo_Z6pwSRlK3-MJvMWMU`);
    server.close();
    process.exit(0);
  } catch (e) {
    console.error("Token exchange failed:", e.message);
    server.close();
    process.exit(1);
  }
});

server.listen(0, () => {
  const port = server.address().port;
  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: `http://localhost:${port}`,
      response_type: "code",
      scope: SCOPE,
      access_type: "offline",
      prompt: "consent",
    }).toString();
  console.log("\n1. Open this URL in your browser (signed in as russo@tigeri.ai):\n");
  console.log("   " + authUrl + "\n");
  console.log("2. Approve access. The browser will redirect back to localhost and the token prints here.\n");
  console.log(`(Listening on http://localhost:${port} …)`);
});
