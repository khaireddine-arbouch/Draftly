# Environment Variables Setup Guide

This guide provides detailed, step-by-step instructions for obtaining each environment variable required to run Draftly. Follow each section to set up your services and collect the necessary credentials.

## Table of Contents

1. [Application URLs](#application-urls)
2. [Convex Configuration](#convex-configuration)
3. [Google OAuth](#google-oauth)
4. [NextAuth Configuration](#nextauth-configuration)
5. [Polar Billing](#polar-billing)
6. [Inngest Workflows](#inngest-workflows)
7. [AI Providers](#ai-providers)
   - [Anthropic Claude](#anthropic-claude)

---

## Application URLs

### NEXT_PUBLIC_APP_URL

**What it is:** The public URL where your Draftly application will be accessible.

**How to get it:**

1. **If deploying to Vercel:**
   - After deploying, Vercel provides a URL like `https://your-project.vercel.app`
   - Or use your custom domain if configured (e.g., `https://draftly.example.com`)

2. **If self-hosting with Docker:**
   - Use your server's public IP or domain
   - Example: `https://draftly.yourdomain.com` or `http://your-server-ip:3000` (for testing)

3. **For local development:**
   - Use `http://localhost:3000`

**Example value:**
```
NEXT_PUBLIC_APP_URL=https://draftly-huawei.vercel.app
```

---

## Convex Configuration

Convex is the real-time database and backend for Draftly. You'll need to create a Convex project and get three values.

### Step 1: Create a Convex Account and Project

1. Go to [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. Sign up or log in with your GitHub account
3. Click **"New Project"**
4. Enter a project name (e.g., "draftly-production")
5. Choose a region closest to your users
6. Click **"Create Project"**

### Step 2: Get NEXT_PUBLIC_CONVEX_URL

1. In your Convex dashboard, go to **Settings** → **Deployments**
2. Find your production deployment (or create one if needed)
3. Copy the **Deployment URL** - it looks like: `https://your-project-name.convex.cloud`
4. This is your `NEXT_PUBLIC_CONVEX_URL`

**Example value:**
```
NEXT_PUBLIC_CONVEX_URL=https://stoic-niricci-983.convex.cloud
```

### Step 3: Get CONVEX_DEPLOYMENT

1. In the same **Settings** → **Deployments** page
2. Find the deployment identifier - it looks like: `dev:stoic-niricci-983`
3. Copy this entire string including the `dev:` prefix
4. This is your `CONVEX_DEPLOYMENT`

**Example value:**
```
CONVEX_DEPLOYMENT=dev:stoic-niricci-983
```

### Step 4: Get CONVEX_SITE_URL

1. This should match your `NEXT_PUBLIC_APP_URL`
2. It's used for OAuth callbacks and CORS configuration
3. For production, use the same value as `NEXT_PUBLIC_APP_URL`

**Example value:**
```
CONVEX_SITE_URL=https://draftly-huawei.vercel.app
```

### Step 5: Configure Convex Auth Origins

1. In Convex dashboard, go to **Settings** → **Auth**
2. Add your application URL to the **Allowed Origins** list
3. This allows OAuth callbacks to work properly

---

## Google OAuth

Google OAuth enables users to sign in with their Google accounts.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Draftly Auth")
5. Click **"Create"**
6. Wait for the project to be created, then select it

### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on **"Google+ API"** or **"Google Identity Services API"**
4. Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: "Draftly"
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"** through the scopes and test users screens
   - Click **"Back to Dashboard"**

4. Now create the OAuth client:
   - Application type: **"Web application"**
   - Name: "Draftly Web Client"
   - **Authorized JavaScript origins:**
     - Add: `https://your-domain.com` (your `NEXT_PUBLIC_APP_URL`)
     - Add: `http://localhost:3000` (for local development)
   - **Authorized redirect URIs:**
     - Add: `https://your-domain.com/api/auth/callback/google`
     - Add: `http://localhost:3000/api/auth/callback/google` (for local dev)
     - Add: `https://stoic-niricci-983.convex.cloud/api/auth/callback/google` (for convex)
   - Click **"Create"**

### Step 4: Get Your Credentials

1. After creating, you'll see a popup with your credentials
2. **Client ID** - This is your `GOOGLE_CLOUD_ID`
   - Format: `xxxxx-xxxxx.apps.googleusercontent.com`
3. **Client Secret** - This is your `GOOGLE_CLIENT_SECRET`
   - Click **"OK"** to close the popup
   - You can view it again by clicking the edit icon (pencil) next to your OAuth client

**Example values:**
```
GOOGLE_CLOUD_ID=********-********.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=******-******-********
```
> Go back to Convex, open your project / Settings/ Environment Variables, and Add `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `SITE_URL` to your public URL

---

## NextAuth Configuration

NextAuth is used for session management. You need two values.

### NEXTAUTH_URL

1. This should match your `NEXT_PUBLIC_APP_URL`
2. It's the base URL for authentication callbacks

**Example value:**
```
NEXTAUTH_URL=https://draftly-huawei.vercel.app
```

### NEXTAUTH_SECRET

This is a random secret used to encrypt session tokens. Generate it locally:

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Or use an online generator:**
- Visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
- Copy the generated secret

**Example value:**
```
NEXTAUTH_SECRET=your-generated-32-character-secret-here
```

---

## Polar Billing

Polar handles subscription management and billing for Draftly.

### Step 1: Create a Polar Account

1. Go to [https://polar.sh](https://polar.sh)
2. Click **"Sign Up"** or **"Log In"**
3. Complete the account setup

### Step 2: Create a Product and Plan

1. In the Polar dashboard, go to **Products**
2. Click **"Create Product"**
3. Fill in:
   - Name: "Draftly Standard"
   - Description: "Draftly subscription plan"
4. Click **"Create Product"**
5. Now create a plan:
   - Click **"Add Plan"** or **"Create Plan"**
   - Name: "Standard Plan"
   - Price: Set your monthly price (e.g., $20/month)
   - Billing period: Monthly
   - Click **"Create Plan"**

### Step 3: Get POLAR_STANDARD_PLAN

1. In your product page, find the plan you just created
2. Click on the plan to view details
3. Copy the **Plan ID** - it's a UUID like: `4ead8015-c9df-44b9-90e0-2400f7f78550`
4. This is your `POLAR_STANDARD_PLAN`

**Example value:**
```
POLAR_STANDARD_PLAN=********
```

### Step 4: Get POLAR_ACCESS_TOKEN

1. In Polar dashboard, go to **Settings** → **API Keys**
2. Click **"Create Access Token"**
3. Give it a name (e.g., "Draftly Production")
4. Copy the token immediately - it starts with `polar_oat_`
5. This is your `POLAR_ACCESS_TOKEN`
6. **Important:** Store this securely - you won't be able to see it again

**Example value:**
```
POLAR_ACCESS_TOKEN=********
```

### Step 5: Get POLAR_WEBHOOK_SECRET

1. In Polar dashboard, go to **Settings** → **Webhooks**
2. Click **"Create Webhook"**
3. Webhook URL: `https://your-domain.com/api/billing/webhook`
4. Select the events you want to listen to (at minimum: `subscription.created`, `subscription.updated`)
5. Click **"Create Webhook"**
6. Copy the **Webhook Secret** - it starts with `polar_whs_`
7. This is your `POLAR_WEBHOOK_SECRET`

**Example value:**
```
POLAR_WEBHOOK_SECRET=**********
```

### Step 6: Set POLAR_ENV

1. For testing: Use `sandbox`
2. For production: Use `production`

**Example values:**
```
POLAR_ENV=sandbox    # For testing
POLAR_ENV=production # For live deployment
```

---

## Inngest Workflows

Inngest handles background jobs and workflows (like autosave and billing sync).

### Step 1: Create an Inngest Account

1. Go to [https://app.inngest.com](https://app.inngest.com)
2. Sign up or log in with your email or GitHub

### Step 2: Create an App

1. In the Inngest dashboard, click **"Create App"** or **"New App"**
2. Enter an app name (e.g., "Draftly")
3. Choose a region
4. Click **"Create"**

### Step 3: Get INNGEST_SIGNING_KEY

1. In your app dashboard, go to **Settings** → **API Keys**
2. Find the **Signing Key** - it starts with `signkey-prod-` or `signkey-dev-`
3. Copy the entire key
4. This is your `INNGEST_SIGNING_KEY`

**Example value:**
```
INNGEST_SIGNING_KEY=********-******-**********
```

### Step 4: Get INNGEST_EVENT_KEY

1. In the same **Settings** → **API Keys** page
2. Find the **Event Key** - it's a long alphanumeric string
3. Copy the entire key
4. This is your `INNGEST_EVENT_KEY`

**Example value:**
```
INNGEST_EVENT_KEY=********-********
```

### Step 5: Configure App Origin

1. In Inngest dashboard, go to **Settings** → **App Settings**
2. Set **App Origin** to: `https://your-domain.com/api/inngest`
3. Click **"Save"**
4. This allows Inngest to communicate with your app

### Step 6: Set INNGEST_DEV

1. For production: Set to `0`
2. For development: Set to `1`

**Example values:**
```
INNGEST_DEV=0  # Production mode
INNGEST_DEV=1  # Development mode
```

---

## AI Providers

Draftly supports multiple AI providers. You can use one or all of them.

---

### Anthropic Claude

Anthropic provides the Claude AI models.

#### Step 1: Create an Anthropic Account

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Complete the account verification

#### Step 2: Get API Key

1. In the Anthropic console, go to **Settings** → **API Keys**
2. Click **"Create Key"**
3. Give it a name (e.g., "Draftly Production")
4. Copy the key immediately - it starts with `sk-ant-api03-`
5. This is your `ANTHROPIC_API_KEY`
6. **Important:** Store this securely - you won't be able to see it again

**Example value:**
```
ANTHROPIC_API_KEY=**********
```

## Verification Checklist

After collecting all your environment variables, verify you have:

- [ ] `NEXT_PUBLIC_APP_URL` - Your application URL
- [ ] `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- [ ] `CONVEX_DEPLOYMENT` - Convex deployment ID
- [ ] `CONVEX_SITE_URL` - Same as `NEXT_PUBLIC_APP_URL`
- [ ] `GOOGLE_CLOUD_ID` - Google OAuth Client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- [ ] `NEXTAUTH_URL` - Same as `NEXT_PUBLIC_APP_URL`
- [ ] `NEXTAUTH_SECRET` - Generated secret (32+ characters)
- [ ] `POLAR_ACCESS_TOKEN` - Polar API access token
- [ ] `POLAR_WEBHOOK_SECRET` - Polar webhook secret
- [ ] `POLAR_STANDARD_PLAN` - Polar plan ID
- [ ] `POLAR_ENV` - `sandbox` or `production`
- [ ] `INNGEST_SIGNING_KEY` - Inngest signing key
- [ ] `INNGEST_EVENT_KEY` - Inngest event key
- [ ] `INNGEST_DEV` - `0` or `1`
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key (optional but recommended)

---

## Next Steps

Once you have all your environment variables:

1. Create your `.env.docker` file using the template in [`SELF_HOSTING.md`](./SELF_HOSTING.md)
2. Fill in all the values you collected
3. Test your setup by running the Docker container
4. Verify each service is working correctly

For Docker deployment instructions, see [`SELF_HOSTING.md`](./SELF_HOSTING.md).

---

## Troubleshooting

### Common Issues

**"Invalid API key" errors:**
- Double-check you copied the entire key (no extra spaces)
- Verify the key hasn't expired or been revoked
- Make sure you're using the correct environment (sandbox vs production)

**OAuth redirect errors:**
- Ensure your redirect URIs match exactly in Google Cloud Console
- Verify `CONVEX_SITE_URL` matches your `NEXT_PUBLIC_APP_URL`
- Check that Convex allowed origins includes your domain

**Webhook not receiving events:**
- Verify the webhook URL is publicly accessible
- Check that `POLAR_WEBHOOK_SECRET` matches what's configured in Polar
- Ensure your server can receive POST requests at the webhook endpoint

**AI generation not working:**
- Verify at least one AI provider is configured correctly
- Check API key permissions and quotas
- Review error logs for specific provider errors

---

## Security Best Practices

1. **Never commit environment variables to version control**
   - Add `.env.docker` to `.gitignore`
   - Use environment variable management tools for production

2. **Rotate keys regularly**
   - Set reminders to rotate API keys every 90 days
   - Revoke old keys after creating new ones

3. **Use different keys for development and production**
   - Never use production keys in development
   - Use `POLAR_ENV=sandbox` for testing

4. **Limit API key permissions**
   - Only grant necessary permissions
   - Use read-only keys where possible

5. **Monitor usage**
   - Set up alerts for unusual API usage
   - Review logs regularly for suspicious activity

---

For more help, refer to the main [Self-Hosting Guide](./SELF_HOSTING.md) or open an issue in the repository.

