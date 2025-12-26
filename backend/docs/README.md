# Adfluencer Platform - Backend Documentation

## Overview
This is the backend API for the Adfluencer influencer marketplace platform.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
- `DATABASE_URL` - Supabase connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

### 3. Run Database Migrations
Execute the SQL files in `backend/database/` folder in your Supabase SQL Editor:
1. `complete_database_setup.sql` - Creates all tables
2. `supabase_storage_setup.sql` - Sets up storage buckets

### 4. Start the Server
```bash
npm run dev   # Development
npm start     # Production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset

### KYC Verification
- `POST /api/kyc/submit` - Submit KYC verification
- `GET /api/kyc/status` - Get user's KYC status
- `GET /api/kyc/admin/all` - Admin: Get all KYC submissions
- `PUT /api/kyc/admin/review/:id` - Admin: Review KYC

### Billing
- `GET /api/billing/plans` - Get membership plans
- `POST /api/billing/subscribe` - Subscribe to a plan
- `GET /api/billing/subscription` - Get current subscription
- `GET /api/billing/wallet` - Get wallet balance
- `POST /api/billing/wallet/topup` - Add funds to wallet

## Project Structure
```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, validation middleware
│   ├── lib/            # Supabase client, utilities
│   └── types/          # TypeScript types
├── database/           # SQL migration files
├── docs/               # Documentation
└── tests/              # Test files
```
