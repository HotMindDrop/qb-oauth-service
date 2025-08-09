# BillCreator QuickBooks OAuth Service

A minimal Node.js/Express service that handles QuickBooks Online OAuth authentication for the BillCreator application. This service is designed to be deployed on Render and provides the required endpoints for Intuit's OAuth flow.

## 🚨 **PRODUCTION CONFIGURATION**

⚠️ **This service is configured for PRODUCTION QuickBooks Online**, which means:
- ✅ **Real Data**: Connects to live QuickBooks companies
- ✅ **Live Transactions**: Works with actual financial records
- ⚠️ **App Review Required**: Must pass Intuit's production app review
- ⚠️ **Legal Requirements**: Need privacy policy & terms of service

## 🚀 Features

- **Health Check**: `/healthz` endpoint for Render monitoring
- **OAuth Callback**: Handles QuickBooks authorization code exchange
- **Success Pages**: User-friendly pages for connection success/failure
- **Token Management**: Framework for storing and managing QB tokens
- **Security**: Proper error handling and secure token exchange

## 📋 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | Health check for Render |
| `GET` | `/oauth/callback` | QuickBooks OAuth callback |
| `GET` | `/launch` | Success page after OAuth |
| `GET` | `/disconnect` | Disconnection confirmation page |
| `GET` | `/` | Service status page |

## 🛠️ Setup Instructions

### 1. Create GitHub Repository

1. Create a new public repository called `qb-oauth-service`
2. Clone this repository and push the code:

```bash
git clone https://github.com/yourusername/qb-oauth-service.git
cd qb-oauth-service
# Copy all files from this project
git add .
git commit -m "Initial commit: QuickBooks OAuth service"
git push origin main
```

### 2. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository `qb-oauth-service`
4. Configure the service:
   - **Name**: `billcreator-qb-oauth`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/healthz`

### 3. Environment Variables

Add these environment variables in Render:

| Variable | Value | Description |
|----------|-------|-------------|
| `CLIENT_ID` | `your_intuit_client_id` | From Intuit Developer Dashboard |
| `CLIENT_SECRET` | `your_intuit_client_secret` | From Intuit Developer Dashboard |
| `REDIRECT_URI` | `https://YOUR-RENDER-URL.onrender.com/oauth/callback` | Your Render app URL |
| `QBO_ENV` | `production` | Environment (sandbox/production) |
| `STATE_SECRET` | `random-long-string` | Security token |
| `MINOR_VERSION` | `70` | QuickBooks API version |

### 4. Configure Intuit Developer App

#### A. Set Redirect URIs
1. Go to [Intuit Developer Dashboard](https://developer.intuit.com)
2. Navigate to your app → **Keys & OAuth**
3. Add to **Redirect URIs**:
   ```
   https://YOUR-RENDER-SUBDOMAIN.onrender.com/oauth/callback
   ```

#### B. Set App URLs
1. Go to **App details**
2. Configure:
   - **Host domain**: `YOUR-RENDER-SUBDOMAIN.onrender.com` (no https://)
   - **Launch URL**: `https://YOUR-RENDER-SUBDOMAIN.onrender.com/launch`
   - **Disconnect URL**: `https://YOUR-RENDER-SUBDOMAIN.onrender.com/disconnect`

### 5. Get IP Address for Intuit

After Render deploys, get your service IP:

```bash
# Windows PowerShell or Command Prompt
nslookup YOUR-RENDER-SUBDOMAIN.onrender.com

# macOS/Linux Terminal
dig YOUR-RENDER-SUBDOMAIN.onrender.com
```

Add the returned IP address(es) to Intuit's **Single IP address** field (United States).

## 🔐 Security Considerations

- **Environment Variables**: Never commit actual credentials
- **HTTPS Only**: All OAuth flows use HTTPS in production
- **State Parameter**: Implement CSRF protection (TODO)
- **Token Storage**: Implement secure token storage (TODO)

## 🏗️ Development

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example .env
# Edit .env with your actual values
```

3. Start development server:
```bash
npm run dev
```

4. Test endpoints:
- Health check: http://localhost:10000/healthz
- Service info: http://localhost:10000/

### Testing OAuth Flow

1. Set up ngrok for local testing:
```bash
ngrok http 10000
```

2. Update Intuit redirect URI to your ngrok URL:
```
https://your-ngrok-url.ngrok.io/oauth/callback
```

3. Update your `.env`:
```env
REDIRECT_URI=https://your-ngrok-url.ngrok.io/oauth/callback
```

## 📖 OAuth Flow

1. **Initiate**: User clicks "Connect to QuickBooks" in your main app
2. **Redirect**: User redirected to Intuit OAuth URL
3. **Authorize**: User authorizes your app in QuickBooks
4. **Callback**: Intuit redirects to `/oauth/callback` with auth code
5. **Exchange**: Service exchanges auth code for access/refresh tokens
6. **Store**: Tokens stored in your database (TODO: implement)
7. **Success**: User redirected to `/launch` page

## 🔄 Token Management (TODO)

This service provides the foundation for token management. You'll need to implement:

- **Database**: Store tokens with realmId (company ID)
- **Refresh Logic**: Automatically refresh expired tokens
- **API Integration**: Use tokens for QuickBooks API calls

Example token storage structure:
```javascript
{
  realmId: "1234567890",
  accessToken: "eyJ...",
  refreshToken: "L01...",
  expiresAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z"
}
```

## 🚨 Troubleshooting

### Common Issues

1. **OAuth callback fails**
   - Verify redirect URI matches exactly in Intuit dashboard
   - Check CLIENT_ID and CLIENT_SECRET are correct
   - Ensure HTTPS is used in production

2. **Health check fails**
   - Verify `/healthz` endpoint returns 200 status
   - Check Render logs for startup errors

3. **Token exchange fails**
   - Verify CLIENT_SECRET is correct
   - Check authorization code hasn't expired
   - Review Render logs for detailed error messages

### Debug Logs

Check Render logs for detailed information:
- OAuth callback parameters
- Token exchange requests/responses
- Error details with stack traces

## 📚 Resources

- [QuickBooks Online API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [Intuit OAuth 2.0 Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [Render Documentation](https://render.com/docs)

## 📄 License

ISC License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is a foundational OAuth service. You'll need to implement token storage and API integration based on your specific BillCreator requirements.