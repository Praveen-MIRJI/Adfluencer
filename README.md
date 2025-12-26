# Adfluencer - Influencer Marketing Marketplace

A production-grade influencer marketplace platform connecting brands with influencers. Built similar to Freelancer/Upwork but specialized for influencer marketing campaigns.

## 🏗️ Project Structure

```
├── .kiro/              # Kiro IDE configuration
├── .vscode/            # VS Code settings
├── backend/            # Node.js/Express API
│   ├── src/            # Source code
│   ├── database/       # SQL migration files
│   ├── docs/           # API documentation
│   └── tests/          # Test files
└── frontend/           # React/Vite application
    └── src/            # Source code
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 💰 Payment & Escrow System

### Fee Structure (Indian Market)

```
CLIENT PAYS: ₹1,000
├── Razorpay Fee (2% + 18% GST): -₹24
├── Platform Fee (10%): -₹100
└── PROVIDER RECEIVES: ₹876

Platform Earnings: ₹100 (Platform Fee)
Razorpay Fee: ₹24 (Operational Expense)
```

### Escrow Flow

```
1. CREATED          → Client initiates payment
2. HELD_IN_ESCROW   → Payment captured, funds secured
3. WORK_SUBMITTED   → Provider submits deliverables
4. APPROVED         → Client approves work
5. PAID_OUT         → Provider receives payment

Alternative Flows:
- DISPUTED          → Dispute raised, admin reviews
- REFUNDED          → Client refunded (before work submitted)
```

### API Endpoints

#### Escrow
- `GET /api/escrow/fee-breakdown?amount=1000` - Get fee breakdown
- `POST /api/escrow` - Create escrow for contract
- `POST /api/escrow/verify-payment` - Verify Razorpay payment
- `POST /api/escrow/:id/submit-work` - Provider submits work
- `POST /api/escrow/:id/approve` - Client approves & releases payment
- `POST /api/escrow/:id/dispute` - Raise dispute
- `POST /api/escrow/:id/refund` - Request refund

#### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature
- `GET /api/payments/history` - Get payment history

## ✨ Features

### Core Features
- **User Authentication** - JWT-based auth with role-based access
- **KYC Verification** - Document upload with admin review
- **Advertisement Management** - Create, browse, manage campaigns
- **Bid System** - Influencers bid on campaigns with proposals
- **Contract Management** - Create contracts from accepted bids

### Payment & Billing
- **Razorpay Integration** - Secure payment gateway (India)
- **Escrow System** - Funds held until work completion
- **Wallet System** - In-app wallet for transactions
- **Membership Plans** - ₹100/month, ₹500/year options
- **Pay-per-action** - ₹5 per bid, ₹10 per advertisement

### Campaign Management
- **Deliverables System** - Submit and review deliverables
- **Milestone Payments** - Break contracts into milestones
- **Dispute Resolution** - Admin-mediated dispute handling

### Communication
- **Messaging System** - Direct messaging between users
- **Notifications** - In-app notifications for all activities

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Payments**: Razorpay

## ⚙️ Environment Variables

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

## 📊 Database Schema

Key tables:
- `User` - User accounts
- `Contract` - Contracts between clients and influencers
- `EscrowTransaction` - Payment escrow with full fee breakdown
- `Deliverable` - Work submissions
- `Dispute` - Dispute records
- `UserWallet` - User wallet balances
- `WalletTransaction` - Wallet transaction history
- `PlatformRevenue` - Platform earnings tracking

## 🔒 Security

- JWT authentication
- Row Level Security (RLS) on Supabase
- Razorpay signature verification
- Input validation with express-validator
- CORS configuration

## 📝 License

MIT
