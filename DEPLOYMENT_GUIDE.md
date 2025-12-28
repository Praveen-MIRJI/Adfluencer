# Adfluencer Deployment Guide

Complete step-by-step guide to deploy your Adfluencer application to Vercel (Frontend) and Render (Backend).

---

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ GitHub account with your code pushed
- ✅ Supabase project set up and running
- ✅ All environment variables from your `.env` files
- ✅ Razorpay API keys (if using payments)
- ✅ Email service credentials (Nodemailer)

---

## 🎯 Deployment Architecture

```
Frontend (React/Vite) → Vercel
Backend (Node.js/Express) → Render
Database → Supabase (already hosted)
```

---

# Part 1: Deploy Backend to Render

## Step 1: Prepare Backend for Deployment

### 1.1 Update package.json
Make sure your `backend/package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx watch src/index.ts"
  }
}
```

### 1.2 Create Build Configuration
Your backend should already have TypeScript configured. Verify `tsconfig.json` exists.

---

## Step 2: Sign Up for Render

1. Go to **https://render.com**
2. Click **"Get Started"**
3. Sign up with your **GitHub account**
4. Authorize Render to access your repositories

---

## Step 3: Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** if not already connected to GitHub
4. Find and select your **"Adfluencer"** repository
5. Click **"Connect"**

---

## Step 4: Configure Web Service

### Basic Settings:
- **Name**: `adfluencer-backend` (or your choice)
- **Region**: Choose closest to your users (e.g., Singapore, Mumbai)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Instance Type:
- Select **"Free"** (for testing) or **"Starter"** ($7/month for production)

---

## Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add ALL variables from your `backend/.env` file:

```
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_here

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL (will update after deploying frontend)
FRONTEND_URL=http://localhost:5173
```

**Important**: 
- Don't include quotes around values
- Use actual values, not placeholders
- You'll update `FRONTEND_URL` after deploying frontend

---

## Step 6: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Watch the logs for any errors
4. Once deployed, you'll get a URL like: `https://adfluencer-backend.onrender.com`

**Save this URL!** You'll need it for the frontend.

---

## Step 7: Test Backend

1. Open your backend URL in browser
2. You should see a response (might be "Cannot GET /" - that's okay)
3. Test an endpoint: `https://your-backend-url.onrender.com/api/health` (if you have one)

---

# Part 2: Deploy Frontend to Vercel

## Step 1: Prepare Frontend for Deployment

### 1.1 Update API Configuration

Open `frontend/src/lib/api.ts` and update it:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 1.2 Create Vercel Configuration

Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Step 2: Sign Up for Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Sign up with your **GitHub account**
4. Authorize Vercel to access your repositories

---

## Step 3: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find and select your **"Adfluencer"** repository
3. Click **"Import"**

---

## Step 4: Configure Project

### Framework Preset:
- Vercel should auto-detect **"Vite"**

### Root Directory:
- Click **"Edit"** next to Root Directory
- Enter: `frontend`
- Click **"Continue"**

### Build Settings:
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

---

## Step 5: Add Environment Variables

Click **"Environment Variables"**

Add these variables:

```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Replace** `your-backend-url.onrender.com` with your actual Render backend URL from Part 1.

---

## Step 6: Deploy Frontend

1. Click **"Deploy"**
2. Wait for deployment (3-5 minutes)
3. Watch the build logs
4. Once deployed, you'll get a URL like: `https://adfluencer.vercel.app`

---

## Step 7: Update Backend CORS

1. Go back to **Render Dashboard**
2. Open your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://adfluencer.vercel.app
   ```
5. Click **"Save Changes"**
6. Backend will automatically redeploy

---

# Part 3: Final Configuration

## Step 1: Update CORS in Backend Code

Make sure your `backend/src/index.ts` has proper CORS:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## Step 2: Test Your Application

1. Open your Vercel URL: `https://adfluencer.vercel.app`
2. Try to:
   - ✅ Sign up
   - ✅ Login
   - ✅ Create a campaign
   - ✅ Submit a bid
   - ✅ Send a message

---

# Part 4: Custom Domain (Optional)

## For Vercel (Frontend):

1. Go to your project on Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `adfluencer.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

## For Render (Backend):

1. Go to your service on Render
2. Click **"Settings"** → **"Custom Domain"**
3. Add your API subdomain (e.g., `api.adfluencer.com`)
4. Follow DNS configuration instructions

---

# 🔧 Troubleshooting

## Backend Issues:

### Build Fails:
- Check if all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`
- Check build logs on Render

### Environment Variables:
- Make sure no quotes around values
- Check for typos in variable names
- Verify Supabase credentials are correct

### 500 Errors:
- Check Render logs: Dashboard → Your Service → Logs
- Look for error messages
- Verify database connection

## Frontend Issues:

### Build Fails:
- Check if `vite.config.ts` is correct
- Verify all imports are correct
- Check build logs on Vercel

### API Connection Fails:
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Open browser console for errors

### Blank Page:
- Check browser console for errors
- Verify routing is correct
- Check if `vercel.json` is configured

---

# 📊 Monitoring

## Render:
- **Logs**: Dashboard → Your Service → Logs
- **Metrics**: Dashboard → Your Service → Metrics
- **Health**: Check if service is running

## Vercel:
- **Deployments**: Project → Deployments
- **Analytics**: Project → Analytics
- **Logs**: Deployment → Function Logs

---

# 💰 Costs

## Free Tier Limits:

### Render (Free):
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ Cold starts (30-60 seconds to wake up)
- ✅ 750 hours/month free
- ✅ Good for testing

### Render (Starter - $7/month):
- ✅ Always on (no cold starts)
- ✅ Better performance
- ✅ Recommended for production

### Vercel (Free):
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Good for most projects

---

# 🚀 Auto-Deployment

Both Vercel and Render support auto-deployment:

1. **Push to GitHub** → Automatic deployment
2. **Pull Request** → Preview deployment (Vercel)
3. **Merge to main** → Production deployment

---

# 📝 Environment Variables Checklist

## Backend (.env):
- [ ] NODE_ENV
- [ ] PORT
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] JWT_SECRET
- [ ] RAZORPAY_KEY_ID
- [ ] RAZORPAY_KEY_SECRET
- [ ] EMAIL_HOST
- [ ] EMAIL_PORT
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] FRONTEND_URL

## Frontend (.env):
- [ ] VITE_API_URL
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_RAZORPAY_KEY_ID

---

# ✅ Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL saved
- [ ] Frontend deployed to Vercel
- [ ] Frontend URL saved
- [ ] Backend FRONTEND_URL updated
- [ ] CORS configured correctly
- [ ] Environment variables added
- [ ] Application tested
- [ ] Custom domain configured (optional)
- [ ] Auto-deployment working

---

# 🎉 You're Done!

Your Adfluencer application is now live!

- **Frontend**: https://adfluencer.vercel.app
- **Backend**: https://adfluencer-backend.onrender.com

Share your app with users and start getting feedback!

---

# 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review deployment logs
3. Verify environment variables
4. Check Supabase connection
5. Test API endpoints individually

Good luck with your deployment! 🚀
