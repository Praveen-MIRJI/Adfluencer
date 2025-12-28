# Credit System Setup Guide

The credit system has been fully implemented but requires database initialization to function.

## Quick Setup (2 minutes)

### Step 1: Initialize Database Tables
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `backend/database/credit_system_setup.sql`
4. Click **Run** to create the credit system tables

### Step 2: Enable Frontend Credit System
1. Open `frontend/.env`
2. Change `VITE_CREDIT_SYSTEM_ENABLED=false` to `VITE_CREDIT_SYSTEM_ENABLED=true`
3. Restart your frontend development server

### Step 3: Verify Setup
1. Refresh your frontend application
2. The credit balance component should now load without errors
3. Login as an admin and go to `/admin/credits` to configure the system

## What Gets Created

The setup script creates these tables:
- **CreditSettings** - System configuration (pricing, enabled/disabled)
- **UserCredits** - User credit balances and usage tracking
- **CreditTransaction** - Complete transaction history

## Default Configuration

After setup, the credit system will be:
- ✅ **Disabled by default** (everything is free)
- ✅ **₹5 per bid credit** (when enabled)
- ✅ **₹10 per post credit** (when enabled)
- ✅ **Row Level Security enabled** for data protection

## Admin Configuration

Once set up, admins can:
1. Go to `/admin/credits` in the application
2. Toggle the credit system on/off
3. Adjust pricing for bid and post credits
4. View system statistics and revenue
5. Manually adjust user credit balances

## User Experience

When enabled, users will:
- See their credit balance in the dashboard
- Get prompted to purchase credits when bidding/posting
- Have access to credit purchase modal with Razorpay integration
- View complete transaction history at `/credits`

## Troubleshooting

**If you see 500 errors:**
1. Ensure the SQL script ran successfully in Supabase
2. Check that all three tables were created (CreditSettings, UserCredits, CreditTransaction)
3. Verify the default CreditSettings record exists
4. Set `VITE_CREDIT_SYSTEM_ENABLED=true` in `frontend/.env`
5. Restart both backend and frontend servers

**If credit components don't appear:**
- Check that `VITE_CREDIT_SYSTEM_ENABLED=true` in your `.env` file
- Restart the frontend development server after changing environment variables

The system is designed to gracefully handle missing tables by showing a disabled state until properly configured.