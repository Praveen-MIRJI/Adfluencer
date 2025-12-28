# Update Membership Plans

This guide will help you update to exactly **3 subscription plans** that work for both clients and influencers.

## New Plan Structure

**ONLY 3 PLANS TOTAL** (same for both CLIENT and INFLUENCER):

1. **Weekly Pro** - ₹100/week
2. **Monthly Premium** - ₹300/month ⭐ (Most Popular)  
3. **Annual Elite** - ₹600/year (Best Value - Only ₹50/month!)

## Quick Update (Run in Supabase)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste from: `backend/database/update_plans_simple.sql`
3. Click **Run**
4. ✅ Done! You'll have exactly 3 plans

## What This Does

- ❌ **Deletes ALL existing plans** (Free, Pay-per-action, etc.)
- ✅ **Creates exactly 3 new plans**
- ✅ Each plan has `targetRole = 'ALL'` (works for both clients and influencers)
- ✅ No duplicate plans
- ✅ Clean, simple pricing

## Verification

After running, you should see in your database:

```
name              | price | billingCycle | targetRole | isPopular
------------------|-------|--------------|------------|----------
Weekly Pro        | 100   | WEEKLY       | ALL        | false
Monthly Premium   | 300   | MONTHLY      | ALL        | true
Annual Elite      | 600   | YEARLY       | ALL        | false
```

**Total: 3 plans** (not 6!)

## Plan Features

### 1. Weekly Pro - ₹100/week
- Unlimited campaigns & bids
- Priority support  
- Basic analytics
- Direct messaging
- 1 featured listing

### 2. Monthly Premium - ₹300/month ⭐
- Everything in Weekly
- Advanced analytics
- 3 featured listings
- 500 messages/month
- Performance insights

### 3. Annual Elite - ₹600/year 💎
- Everything in Monthly
- 24/7 Priority support
- Dedicated account manager
- Custom reporting
- 10 featured listings
- Unlimited messages
- Early feature access

## Notes

- All 3 plans work for **both** clients and influencers
- Monthly plan is marked as "Most Popular"
- Annual plan is the best value (₹50/month vs ₹400/month for weekly)
- All plans include unlimited campaigns and bids
