# LiwaywAI Prototype

**⚠️ PROTOTYPE • SIMULATION ONLY • NOT FOR PRODUCTION ⚠️**

A demo-ready lending platform prototype showcasing explainable AI decisions, gamified progression, and privacy-first digital identity sharing.

## Features

- **Borrower PWA**: Stepwise consent → KYC-lite → loan application → explainable decisions
- **Gamification**: 10-level progression (₱500 → ₱5,000 caps) based on repayment streaks
- **Digital ID Card**: Auto-issued, scoped sharing via QR/links with JWS signatures
- **Admin Console**: Application queue, borrower 360, policy management, audit logs
- **Champion Scoring**: Python/Flask microservice with explainable ML decisions

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (PWA)
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **ML Service**: Python + Flask
- **Auth**: JWT with bcrypt
- **Security**: JWS signatures, token hashing, scoped claims

## Quick Start

```bash
# Install dependencies
npm install
cd ml-service && pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB connection

# Start services
npm run dev        # Starts both MERN and Flask services
npm run seed       # Load demo data

# Access
# Frontend: http://localhost:5173
# API: http://localhost:3000
# ML Service: http://localhost:5001
```

## Demo Flow

1. **Signup/Login** → Auto-issued Digital ID
2. **Apply for Loan** → Explainable decision with reasons
3. **Repayment Simulation** → Level progression
4. **Digital ID Sharing** → Scoped, time-limited claims
5. **Admin Override** → Policy management and audit

## Project Structure

```
├── frontend/          # React PWA
├── backend/           # Express API
├── ml-service/        # Flask scoring service
├── docs/             # API docs, data model, security
├── seeds/            # Demo data
└── tests/            # E2E tests
```

See `docs/` for detailed API contracts, data model, and security considerations.