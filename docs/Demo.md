# LiwaywAI Demo Script

## Overview
This demo showcases the complete LiwaywAI lending platform with explainable AI decisions, gamified progression, and privacy-first digital identity sharing.

## Demo Accounts

### Borrowers (password: `password123`)
- **Level 0 (New)**: `demo@borrower.com` - Maria Santos
- **Level 3**: `level3@demo.com` - Juan Dela Cruz  
- **Level 6**: `level6@demo.com` - Ana Rodriguez
- **Level 9**: `level9@demo.com` - Carlos Mendoza

### Admin (password: `admin123`)
- **Admin**: `admin@liwaywai.com`

## Demo Flow

### 1. New Borrower Journey (Level 0)

**Login as:** `demo@borrower.com`

1. **Dashboard Overview**
   - View Level 0 badge with ₱500 cap
   - See 0% progress to Level 1
   - No loan history yet

2. **Digital ID Card**
   - Navigate to Digital ID
   - View auto-issued LiwaywAI ID
   - See basic profile and reliability metrics
   - Note "No recent assessments"

3. **First Loan Application**
   - Click "Apply for Loan"
   - Try ₱600 (exceeds cap) → See validation error
   - Apply for ₱400, 4 weeks, "Emergency expenses"
   - **Expected Decision**: Approve (new borrower, conservative amount)
   - View explainable reasons: "New borrower - conservative amount", "Within approved limit"

4. **Simulate Repayment**
   - Go to loan details
   - Click "Mark as Paid" 
   - **Result**: Level up to Level 1, cap increases to ₱750
   - Return to dashboard to see updated level badge

### 2. Experienced Borrower (Level 3)

**Login as:** `level3@demo.com`

1. **Dashboard Review**
   - Level 3 badge with ₱1,250 cap
   - View reliability: 100% on-time rate, 3-payment streak
   - See progress toward Level 4

2. **Loan Application - Approve Scenario**
   - Apply for ₱1,000, 6 weeks, "Business capital"
   - **Expected Decision**: Approve
   - Reasons: "Strong borrower level (Level 3+)", "Excellent repayment history", "Conservative amount"
   - PD Band: "Low" or "Very Low"

3. **Loan Application - Counter Offer Scenario**
   - Apply for ₱1,200 (96% of cap), 8 weeks
   - **Expected Decision**: Counter offer
   - Counter: Reduced to ₱875, 6 weeks
   - Reason: "Reduced amount and term for approval"

### 3. High-Level Borrower (Level 6)

**Login as:** `level6@demo.com`

1. **Digital ID Sharing**
   - Navigate to Digital ID
   - Click "Share Digital ID"
   - Select scopes: `basic_profile`, `reliability`, `risk_snapshot`
   - Set RP label: "Partner Bank"
   - Generate QR code and share URL
   - Copy share URL for next step

2. **Relying Party Claims**
   - Open new browser tab/incognito
   - Paste share URL (format: `/rp/claims/{token}`)
   - View scoped claims with JWS signature
   - See only selected data (no PII by default)
   - Note expiration time (10 minutes default)

3. **Share Management**
   - Return to borrower account
   - Go to "Share History"
   - View active share with access count
   - Revoke the share
   - Try accessing claims URL again → See "410 Gone" error

### 4. Admin Console

**Login as:** `admin@liwaywai.com`

1. **Dashboard Overview**
   - View total borrowers, loans, pending applications
   - See recent activity feed
   - Review level distribution chart

2. **Application Queue**
   - Navigate to Applications
   - Filter by status: "applied"
   - View applications with PD scores and reasons
   - Select an application to override

3. **Manual Override**
   - Choose a declined application
   - Override to "approve"
   - Add justification: "Manual approval - verified income"
   - See decision logged in audit trail

4. **Borrower 360 View**
   - Navigate to specific borrower
   - View complete timeline: loans, decisions, repayments, level-ups
   - See share history and access logs
   - Review reliability metrics evolution

5. **Share Audit**
   - Navigate to Shares section
   - Filter by date range or status
   - Export access logs as CSV
   - Review RP access patterns

### 5. Edge Cases & Error Handling

1. **One-Active-Loan Guard**
   - Login as borrower with approved loan
   - Try to apply for another loan
   - See error: "You already have an active loan"

2. **Cap Enforcement**
   - Try applying for amount > current cap
   - See validation error with current limit

3. **Expired Share Token**
   - Create share with 1-minute TTL
   - Wait for expiration
   - Try accessing → "410 Gone"

4. **ML Service Fallback**
   - Stop ML service (simulate failure)
   - Apply for loan
   - See fallback decision with warning

## Key Demo Points

### Explainability
- Every decision includes clear reasons
- Counterfactual hints for declined applications
- PD bands instead of raw probabilities
- Actionable improvement suggestions

### Gamification
- Visual level progression (0-10)
- Streak-based advancement
- Increasing caps with levels
- Progress indicators and next steps

### Privacy & Security
- Scoped claims (only requested data)
- Time-limited tokens (default 10 minutes)
- Revocable shares
- JWS-signed claims for verification
- Complete audit trail

### Transparency
- Immutable decision ledger
- Model and policy version tracking
- Admin override justifications
- Complete borrower timeline

## Performance Targets
- **Page Load**: < 3s on 3G
- **Decision Time**: < 10s
- **Digital ID Load**: < 2s

## Prototype Warnings
- Prominent "SIMULATION ONLY" banners
- No real payments or SMS
- Synthetic data and simplified ML
- Development security settings