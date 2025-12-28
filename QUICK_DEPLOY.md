# Quick Deployment Checklist

## ✅ Pre-Deployment Checklist

Before you start deploying, make sure you have:

1. [ ] GitHub repository with latest code pushed
2. [ ] Supabase project URL and keys
3. [ ] Razorpay API keys
4. [ ] Email service credentials (Gmail app password)
5. [ ] JWT secret key

---

## 🚀 Quick Start: Deploy in 15 Minutes

### Step 1: Deploy Backend to Render (5 minutes)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Select **"Adfluencer"** repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables (copy from backend/.env)
6. Click **"Create Web Service"**
7. **Save the URL** (e.g., https://adfluencer-backend.onrender.com)

### Step 2: Deploy Frontend to Vercel (5 minutes)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Select **"Adfluencer"** repository
4. Configure:
   - Root Directory: `frontend`
   - Framework: Vite (auto-detected)
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```
6. Click **"Deploy"**
7. **Save the URL** (e.g., https://adfluencer.vercel.app)

### Step 3: Update Backend CORS (2 minutes)

1. Go back to Render
2. Open your backend service → Environment
3. Update `FRONTEND_URL` to your Vercel URL
4. Save (auto-redeploys)

### Step 4: Test (3 minutes)

1. Open your Vercel URL
2. Test signup, login, and basic features
3. Check browser console for errors

---

## 📝 Environment Variables Reference

### Backend (Render):
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
FRONTEND_URL=https://your-vercel-url.vercel.app
```

### Frontend (Vercel):
```
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RAZORPAY_KEY_ID=
```

---

## 🎯 Important URLs

After deployment, save these:

- **Frontend**: https://adfluencer.vercel.app
- **Backend**: https://adfluencer-backend.onrender.com
- **Supabase**: https://app.supabase.com

---

## ⚠️ Common Issues

### Backend won't start:
- Check environment variables are set correctly
- Verify build logs on Render
- Make sure all dependencies are in package.json

### Frontend can't connect to backend:
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Look at browser console for errors

### Cold starts (Free tier):
- Render free tier sleeps after 15 min
- First request takes 30-60 seconds
- Upgrade to Starter ($7/mo) for always-on

---

## 💡 Pro Tips

1. **Test locally first**: Make sure everything works on localhost
2. **Check logs**: Both Vercel and Render have detailed logs
3. **Use environment variables**: Never hardcode secrets
4. **Monitor costs**: Check usage on both platforms
5. **Set up custom domain**: Makes your app look professional

---

## 🆘 Need Help?

1. Read the full DEPLOYMENT_GUIDE.md
2. Check Render/Vercel documentation
3. Review deployment logs
4. Test API endpoints individually

---

## ✅ Success!

Once deployed, your app will be live at:
- https://adfluencer.vercel.app

Share it with users and start getting feedback! 🎉
