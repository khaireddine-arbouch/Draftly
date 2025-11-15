# Self-Hosting Draftly with Docker

This guide explains how to run Draftly using the pre-built Docker image. The Docker image contains the application code, but **you must provide your own environment variables** when running the container.

## Understanding Docker Environment Variables

**Important:** The Docker image does NOT contain any environment variables or secrets. When you pull and run the image, you need to provide your own configuration. This is by design—each user has their own Convex project, API keys, and OAuth credentials.

### Quick Reference

**The simplest way to run Draftly:**

```bash
# 1. Pull the image
docker pull khaireddinearb/draftly:latest

# 2. Create .env.docker file (see template below)

# 3. Run with your environment variables
docker run -p 3000:3000 --env-file .env.docker khaireddinearb/draftly:latest
```

That's it! The `--env-file` flag tells Docker to read all environment variables from your `.env.docker` file and pass them to the container at runtime.

## Quick Start

1. **Pull the Docker image:**
   ```bash
   docker pull khaireddinearb/draftly:latest
   ```

2. **Create your environment file** (see section below for all required variables):
   ```bash
   # Create a file called .env.docker in your current directory
   nano .env.docker
   # or
   notepad .env.docker
   ```

3. **Run the container with your environment variables:**
   ```bash
   docker run -p 3000:3000 --env-file .env.docker khaireddinearb/draftly:latest
   ```

4. **Access the app:**
   Open `http://localhost:3000` in your browser.

## How to Pass Environment Variables to Docker

There are three main ways to provide environment variables to a Docker container:

### Method 1: Using `--env-file` (Recommended)

Create a `.env.docker` file with all your variables, then pass it to Docker:

```bash
docker run -p 3000:3000 --env-file .env.docker khaireddinearb/draftly:latest
```

**Advantages:** Clean, easy to manage, and you can version control a template (without secrets).

### Method 2: Using `-e` flags (For individual variables)

Pass variables one by one:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -e NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud \
  -e GOOGLE_CLOUD_ID=your-google-client-id \
  # ... add all other variables
  khaireddinearb/draftly:latest
```

**Advantages:** Good for testing or when you only need to override a few variables.

### Method 3: Using Docker Compose (Best for production)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  draftly:
    image: khaireddinearb/draftly:latest
    ports:
      - "3000:3000"
    env_file:
      - .env.docker
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

**Advantages:** Easy to manage, supports restart policies, and better for production deployments.

> **Security Tip:** Never commit your `.env.docker` file to version control. Add it to `.gitignore` and share it only over secure channels.

## Environment Variables Setup

### Step 1: Create Your `.env.docker` File

Create a file named `.env.docker` in the same directory where you'll run Docker. Copy the template below and fill in your actual values.

### Step 2: Complete Environment Variable Template

```env
# ============================================
# Application URLs
# ============================================
# Your public application URL (where users will access the app)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# ============================================
# Convex Configuration
# ============================================
# Get these from: https://dashboard.convex.dev
# 1. Go to your Convex project dashboard
# 2. Settings → Deployment → Copy the deployment URL
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=dev:your-project-id
# Should match NEXT_PUBLIC_APP_URL for production
CONVEX_SITE_URL=https://your-domain.com

# ============================================
# Google OAuth (for user authentication)
# ============================================
# Get these from: https://console.cloud.google.com/apis/credentials
# 1. Create OAuth 2.0 Client ID
# 2. Add authorized redirect URI: https://your-domain.com/api/auth/callback/google
GOOGLE_CLOUD_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ============================================
# NextAuth Configuration
# ============================================
# Generate a secret: openssl rand -base64 32
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-random-secret-here

# ============================================
# Polar Billing (Subscription Management)
# ============================================
# Get these from: https://polar.sh/dashboard
# 1. Settings → API Keys → Create Access Token
# 2. Settings → Webhooks → Create Webhook Secret
# 3. Products → Copy your Standard Plan ID
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_WEBHOOK_SECRET=polar_whs_...
POLAR_ENV=sandbox
# Change to 'production' when ready
POLAR_STANDARD_PLAN=your-plan-id-here

# ============================================
# Inngest (Background Workflows)
# ============================================
# Get these from: https://app.inngest.com
# 1. Settings → API Keys → Copy Signing Key and Event Key
INNGEST_SIGNING_KEY=signkey-prod-...
INNGEST_EVENT_KEY=...
INNGEST_DEV=0
# Set to 1 for development mode

# ============================================
# AI Providers
# ============================================
# Anthropic Claude
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# DeepSeek (Huawei ModelArts)
# Get from: https://console.huaweicloud.com/modelarts
DEEPSEEK_ENDPOINT_URL=https://api-ap-southeast-1.modelarts-maas.com
DEEPSEEK_API_KEY=your-deepseek-key

# Alibaba Qwen
# Get from: https://dashscope.console.aliyun.com
QWEN_ENDPOINT_URL=https://dashscope.aliyuncs.com/compatible-mode
QWEN_3_API_KEY=your-qwen-key

# ============================================
# Email (Optional - for password reset)
# ============================================
# Get from: https://resend.com/api-keys
# Leave empty if you don't need password reset emails
RESEND_API_KEY=
AUTH_EMAIL_FROM=
```

### Step 3: Where to Get Each Value

> **📖 Detailed Instructions:** For complete step-by-step guides with screenshots and detailed walkthroughs for each service, see the [Environment Variables Setup Guide](./ENVIRONMENT_VARIABLES.md).

**Quick Reference:**

| Variable | Where to Get It | Quick Steps |
| --- | --- | --- |
| **NEXT_PUBLIC_APP_URL** | Your domain | The URL where users will access your app |
| **NEXT_PUBLIC_CONVEX_URL** | [Convex Dashboard](https://dashboard.convex.dev) | Settings → Deployments → Copy URL |
| **CONVEX_DEPLOYMENT** | [Convex Dashboard](https://dashboard.convex.dev) | Settings → Deployments → Copy ID |
| **CONVEX_SITE_URL** | Same as NEXT_PUBLIC_APP_URL | Usually matches your app URL |
| **GOOGLE_CLOUD_ID** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Create OAuth 2.0 Client ID |
| **GOOGLE_CLIENT_SECRET** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Same as above → Copy Secret |
| **NEXTAUTH_URL** | Same as NEXT_PUBLIC_APP_URL | Your app's public URL |
| **NEXTAUTH_SECRET** | Generate locally | Run: `openssl rand -base64 32` |
| **POLAR_ACCESS_TOKEN** | [Polar Dashboard](https://polar.sh/dashboard) | Settings → API Keys → Create Token |
| **POLAR_WEBHOOK_SECRET** | [Polar Dashboard](https://polar.sh/dashboard) | Settings → Webhooks → Create Secret |
| **POLAR_STANDARD_PLAN** | [Polar Dashboard](https://polar.sh/dashboard) | Products → Plan → Copy ID |
| **POLAR_ENV** | Set manually | `sandbox` or `production` |
| **INNGEST_SIGNING_KEY** | [Inngest Console](https://app.inngest.com) | Settings → API Keys → Signing Key |
| **INNGEST_EVENT_KEY** | [Inngest Console](https://app.inngest.com) | Settings → API Keys → Event Key |
| **INNGEST_DEV** | Set manually | `0` (production) or `1` (dev) |
| **ANTHROPIC_API_KEY** | [Anthropic Console](https://console.anthropic.com/settings/keys) | Settings → API Keys → Create |
| **DEEPSEEK_ENDPOINT_URL** | Huawei ModelArts | Usually: `https://api-ap-southeast-1.modelarts-maas.com` |
| **DEEPSEEK_API_KEY** | [Huawei ModelArts](https://console.huaweicloud.com/modelarts) | Console → API Keys → Create |
| **QWEN_ENDPOINT_URL** | Alibaba DashScope | Usually: `https://dashscope.aliyuncs.com/compatible-mode` |
| **QWEN_3_API_KEY** | [Alibaba DashScope](https://dashscope.console.aliyun.com) | Console → API Keys → Create |
| **RESEND_API_KEY** | [Resend](https://resend.com/api-keys) | Dashboard → API Keys (optional) |
| **AUTH_EMAIL_FROM** | Your email domain | Email for password resets (optional) |

For detailed step-by-step instructions, see [Environment Variables Setup Guide](./ENVIRONMENT_VARIABLES.md).

### Step 4: Verify Your Setup

After creating `.env.docker`, verify it's correct:

```bash
# Check that the file exists and has content
cat .env.docker

# Make sure it's not committed to git (should be in .gitignore)
git check-ignore .env.docker
```

> **Important:** Missing environment variables will cause features to fail. For example:
> - Missing Convex variables → App won't connect to database
> - Missing Google OAuth → Users can't sign in
> - Missing AI keys → AI generation won't work
> - Missing Polar keys → Billing features disabled

## Using Docker Compose (Recommended for Production)

For easier management, use the provided `docker-compose.example.yml`:

1. Copy the example file:
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   ```

2. Edit `docker-compose.yml` and replace `<hub-user>` with the actual Docker Hub username/org.

3. Make sure your `.env.docker` file is in the same directory.

4. Start the container:
   ```bash
   docker-compose up -d
   ```

5. View logs:
   ```bash
   docker-compose logs -f
   ```

6. Stop the container:
   ```bash
   docker-compose down
   ```

