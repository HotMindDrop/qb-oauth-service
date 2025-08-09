import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import qs from "qs";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Render
app.get("/healthz", (_, res) => {
  res.status(200).send("ok");
});

// Launch page - shown after successful OAuth connection
app.get("/launch", (_, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QuickBooks Connected - BillCreator</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          background: #f5f5f5; 
          margin: 0; 
          padding: 50px; 
        }
        .container { 
          background: white; 
          border-radius: 10px; 
          padding: 40px; 
          max-width: 500px; 
          margin: 0 auto; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #2ca01c; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .success-icon { font-size: 48px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1>Successfully Connected to QuickBooks!</h1>
        <p>Your BillCreator app is now connected to QuickBooks Online.</p>
        <p>You can close this window and return to your application.</p>
      </div>
    </body>
    </html>
  `);
});

// Disconnect page - shown when OAuth connection is removed
app.get("/disconnect", (_, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QuickBooks Disconnected - BillCreator</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          background: #f5f5f5; 
          margin: 0; 
          padding: 50px; 
        }
        .container { 
          background: white; 
          border-radius: 10px; 
          padding: 40px; 
          max-width: 500px; 
          margin: 0 auto; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #ff6b35; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .disconnect-icon { font-size: 48px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="disconnect-icon">🔌</div>
        <h1>QuickBooks Disconnected</h1>
        <p>Your BillCreator app has been disconnected from QuickBooks Online.</p>
        <p>Connection has been removed successfully.</p>
      </div>
    </body>
    </html>
  `);
});

// OAuth2 callback endpoint - handles the authorization code from Intuit
app.get("/oauth/callback", async (req, res) => {
  const { code, realmId, state } = req.query;
  
  console.log("OAuth callback received:", { 
    code: code ? "present" : "missing", 
    realmId, 
    state 
  });

  if (!code) {
    console.error("Missing authorization code in callback");
    return res.status(400).send(`
      <h1>Error: Missing Authorization Code</h1>
      <p>The OAuth callback did not receive the required authorization code.</p>
      <p>Please try connecting to QuickBooks again.</p>
    `);
  }

  try {
    // Exchange authorization code for access token
    const tokenUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
    const basic = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64");
    
    const body = qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI
    });

    console.log("Exchanging code for tokens...");
    
    const { data } = await axios.post(tokenUrl, body, {
      headers: { 
        "Authorization": `Basic ${basic}`, 
        "Content-Type": "application/x-www-form-urlencoded" 
      }
    });

    // TODO: Store tokens in your database
    // data.access_token - for API calls
    // data.refresh_token - for refreshing access tokens
    // realmId - QuickBooks company ID
    
    console.log("Token exchange successful for realmId:", realmId);
    console.log("Access token received:", data.access_token ? "✓" : "✗");
    console.log("Refresh token received:", data.refresh_token ? "✓" : "✗");
    
    // In a real app, you would store these tokens in your database here
    // Example:
    // await storeTokens({
    //   realmId,
    //   accessToken: data.access_token,
    //   refreshToken: data.refresh_token,
    //   expiresIn: data.expires_in
    // });

    // Redirect to success page
    res.redirect("/launch");
    
  } catch (error) {
    console.error("OAuth token exchange failed:", error.response?.data || error.message);
    
    res.status(500).send(`
      <h1>OAuth Exchange Failed</h1>
      <p>There was an error connecting to QuickBooks.</p>
      <p>Error: ${error.response?.data?.error_description || error.message}</p>
      <p>Please try again or contact support if the problem persists.</p>
    `);
  }
});

// Simple endpoint to test the service
app.get("/", (_, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BillCreator QuickBooks OAuth Service</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          background: #f5f5f5; 
          margin: 0; 
          padding: 50px; 
        }
        .container { 
          background: white; 
          border-radius: 10px; 
          padding: 40px; 
          max-width: 600px; 
          margin: 0 auto; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #2ca01c; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧾 BillCreator QuickBooks OAuth Service</h1>
        <div class="status">
          <strong>Service Status:</strong> Running ✅
        </div>
        <p>This service handles QuickBooks Online OAuth authentication for the BillCreator application.</p>
        <p><strong>Available endpoints:</strong></p>
        <ul style="text-align: left; max-width: 300px; margin: 0 auto;">
          <li><code>GET /healthz</code> - Health check</li>
          <li><code>GET /oauth/callback</code> - OAuth callback</li>
          <li><code>GET /launch</code> - Success page</li>
          <li><code>GET /disconnect</code> - Disconnect page</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 BillCreator QuickBooks OAuth service listening on port ${PORT}`);
  console.log(`📋 Health check available at: http://localhost:${PORT}/healthz`);
  console.log(`🔗 OAuth callback URL: http://localhost:${PORT}/oauth/callback`);
  console.log(`🌐 Environment: ${process.env.QBO_ENV || "sandbox"}`);
});