# Vercel Environment Variables Configuration

## Required Environment Variables

Add these in Vercel Project Settings → Environment Variables for **Production**, **Preview**, and **Development** environments:

### Server-Side Variables (Private)

**`SERVER_API_URL`**
- **Description**: API URL for server-side requests (SSR, +page.server.ts files)
- **Example**: `https://your-server.railway.app/api` or `https://your-server.render.com/api`
- **Required**: ✅ Yes

### Client-Side Variables (Public - exposed to browser)

**`PUBLIC_CLIENT_API_URL`**
- **Description**: API URL for client-side requests (browser, .svelte components)
- **Example**: `https://your-server.railway.app/api`
- **Required**: ✅ Yes

**`PUBLIC_WS_URL`**
- **Description**: WebSocket server URL for Socket.IO connections
- **Example**: `https://your-server.railway.app` (no `/api` suffix)
- **Required**: ✅ Yes

**`PUBLIC_ENV`**
- **Description**: Environment indicator
- **Value**: `production`
- **Required**: ✅ Yes

**`NODE_ENV`**
- **Description**: Node environment
- **Value**: `production`
- **Required**: ✅ Yes (usually auto-set by Vercel)

### Optional: Sentry Error Tracking

**`PUBLIC_SENTRY_DSN`**
- **Description**: Sentry DSN for browser error tracking
- **Example**: `https://abc123@o123456.ingest.sentry.io/123456` or `disabled`
- **Required**: ❌ No (set to `disabled` if not using Sentry)

**`SENTRY_AUTH_TOKEN`**
- **Description**: Sentry auth token for source map uploads
- **Example**: `your-sentry-auth-token` or `disabled`
- **Required**: ❌ No (set to `disabled` if not using Sentry)

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable above
4. Select which environments to apply them to:
   - ✅ Production
   - ✅ Preview (for PR deployments)
   - ✅ Development (optional)
5. Click **Save**
6. Redeploy to apply the new variables

## Server CORS Configuration

**Important**: After deploying your client to Vercel, you MUST update your server's CORS configuration to allow requests from your Vercel domain:

```bash
# In your server deployment (Railway/Render)
CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app,http://localhost:5173
```

Replace `your-app.vercel.app` with your actual Vercel domain.

## Temporary Build Fix

For now, you can set placeholder values to get the build working:
- `SERVER_API_URL=https://placeholder.example.com/api`
- `PUBLIC_CLIENT_API_URL=https://placeholder.example.com/api`  
- `PUBLIC_WS_URL=https://placeholder.example.com`
- `PUBLIC_ENV=production`
- `NODE_ENV=production`
- `PUBLIC_SENTRY_DSN=disabled`
- `SENTRY_AUTH_TOKEN=disabled`

The app won't function correctly with placeholders, but the build will complete. Update with real server URLs once available.
