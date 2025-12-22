# Influencer Marketplace Platform

A professional two-sided marketplace connecting brands with social media influencers.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control

## Project Structure

```
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand state management
│   │   ├── lib/          # API client and utilities
│   │   └── types/        # TypeScript types
│   └── ...
├── backend/           # Express backend API
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, validation middleware
│   │   ├── routes/       # API routes
│   │   ├── lib/          # Prisma client
│   │   └── types/        # TypeScript types
│   └── prisma/           # Database schema and seeds
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Update DATABASE_URL with your PostgreSQL credentials

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed the database
npm run prisma:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file (optional, defaults work for local dev)
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at http://localhost:5173
The backend API will be available at http://localhost:3001

## Default Users (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@marketplace.com | Admin123! |
| Client | client@example.com | Client123! |
| Influencer | influencer@example.com | Influencer123! |

## Features

### For Clients (Brands)
- Post advertisement campaigns
- Set budget ranges and deadlines
- Receive and review bids from influencers
- Shortlist, accept, or reject bids
- Message influencers directly
- Close campaigns

### For Influencers
- Create professional profiles with social stats
- Browse available campaigns
- Submit competitive bids with proposals
- Track bid status
- Communicate with clients

### For Admins
- View platform statistics
- Manage users (approve, block)
- Moderate advertisements

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Advertisements
- `GET /api/advertisements` - List advertisements
- `GET /api/advertisements/:id` - Get advertisement details
- `POST /api/advertisements` - Create advertisement (Client)
- `PATCH /api/advertisements/:id/close` - Close advertisement (Client)

### Bids
- `POST /api/bids` - Submit bid (Influencer)
- `GET /api/bids/my-bids` - Get my bids (Influencer)
- `PATCH /api/bids/:id/shortlist` - Shortlist bid (Client)
- `PATCH /api/bids/:id/accept` - Accept bid (Client)

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversation/:userId` - Get messages
- `POST /api/messages` - Send message

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/influencer_marketplace"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## License

MIT
