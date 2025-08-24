# LiwaywAI Data Model

## Collections Overview

### Core Entities
- `users` - User accounts (borrowers + admins)
- `profiles` - KYC and personal information
- `levels` - Gamification progression tracking
- `digital_id_cards` - Digital identity documents

### Lending Workflow
- `loans` - Loan applications and status
- `repayments` - Payment tracking (simulated)
- `risk_scores` - ML model outputs
- `decision_ledger` - Immutable decision audit trail

### Sharing & Privacy
- `share_tokens` - Time-limited sharing credentials
- `share_access_logs` - Access audit trail
- `consents` - User consent management

### Policy & Configuration
- `policy_versions` - Versioned business rules

## Schema Definitions

### users
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password_hash: String (bcrypt),
  role: String (enum: ['borrower', 'admin']),
  createdAt: Date
}
```

**Indexes:**
- `email: 1` (unique)

### profiles
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  city: String,
  occupation: String,
  kycLevel: String (enum: ['basic', 'verified']),
  createdAt: Date
}
```

### levels
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  level: Number (0-10),
  unlockedCap: Number,
  streak: Number (consecutive on-time payments),
  totalLoans: Number,
  onTimePaid: Number,
  latePaid: Number,
  updatedAt: Date
}
```

**Business Rules:**
- Level 0: ₱500 cap, 0 streak required
- Level 1: ₱750 cap, 1 streak required
- ...
- Level 10: ₱5,000 cap, 10 streak required

### digital_id_cards
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  liwaywaiId: String (unique, format: LW{timestamp}{random}),
  kycLevel: String,
  levelSnapshot: Number,
  joinDate: Date,
  lastDecisionJSON: String (stringified),
  reliabilityJSON: String (stringified),
  levelProgress: {
    completed: Number,
    required: Number
  },
  capCurrent: Number,
  capNext: Number,
  policyVersionId: String,
  consentSummary: [String],
  updatedAt: Date
}
```

### loans
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  amount: Number,
  termWeeks: Number,
  purpose: String,
  status: String (enum: ['applied', 'approved', 'declined', 'counter_offered', 'active', 'completed', 'defaulted']),
  levelAtApply: Number,
  decisionId: ObjectId (ref: DecisionLedger),
  counterOffer: {
    amount: Number,
    termWeeks: Number,
    reason: String
  },
  createdAt: Date,
  approvedAt: Date,
  completedAt: Date
}
```

**Indexes:**
- `userId: 1, status: 1` (compound)

**Business Rules:**
- One active loan per user (status: 'approved' or 'active')
- Amount must not exceed user's unlockedCap

### decision_ledger
```javascript
{
  _id: ObjectId,
  loanId: ObjectId (ref: Loan),
  inputsJSON: String (all scoring inputs),
  modelVersion: String,
  policyVersion: String,
  decision: String (enum: ['approve', 'decline', 'counter']),
  reasons: [String],
  overrideNote: String,
  overriddenBy: ObjectId (ref: User),
  decidedAt: Date
}
```

**Immutability:** Records are never updated, only created

### risk_scores
```javascript
{
  _id: ObjectId,
  loanId: ObjectId (ref: Loan),
  pd: Number (probability of default, 0-1),
  reasons: [String],
  counterfactualHint: String,
  modelVersion: String,
  createdAt: Date
}
```

### share_tokens
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  scopes: [String] (enum: ['basic_profile', 'reliability', 'risk_snapshot', 'credit_pathway']),
  tokenHash: String (bcrypt hash, unique),
  rpLabel: String,
  expiresAt: Date,
  revokedAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `expiresAt: 1` (TTL index for auto-cleanup)
- `tokenHash: 1` (unique)

### share_access_logs
```javascript
{
  _id: ObjectId,
  shareTokenId: ObjectId (ref: ShareToken),
  accessedAt: Date,
  rpIp: String,
  status: String (enum: ['success', 'expired', 'revoked', 'invalid']),
  scopesAccessed: [String]
}
```

### policy_versions
```javascript
{
  _id: ObjectId,
  version: String (unique),
  paramsJSON: String (stringified policy parameters),
  createdAt: Date,
  isActive: Boolean
}
```

**Sample Policy JSON:**
```json
{
  "levelCaps": {
    "0": 500, "1": 750, "2": 1000, "3": 1250, "4": 1500,
    "5": 2000, "6": 2500, "7": 3000, "8": 3500, "9": 4000, "10": 5000
  },
  "streakRequirements": {
    "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
    "6": 6, "7": 7, "8": 8, "9": 9, "10": 10
  },
  "pdThresholds": {
    "approve": 0.20,
    "counter": 0.35
  },
  "oneActiveLoan": true,
  "maxLoanTerm": 52
}
```

## Data Flow

### Loan Application Flow
1. **Application** → `loans` (status: 'applied')
2. **ML Scoring** → `risk_scores` + `decision_ledger`
3. **Decision** → Update `loans.status` + link `decisionId`
4. **Repayment** → Update `levels` (streak, caps) + `digital_id_cards`

### Digital ID Sharing Flow
1. **Share Request** → Generate token, hash with bcrypt
2. **Store** → `share_tokens` (with expiry)
3. **Access** → Verify hash, check expiry/revocation
4. **Log** → `share_access_logs` (every access attempt)
5. **Claims** → Return scoped data with JWS signature

### Level Progression Logic
```javascript
// On successful repayment
level.streak += 1
level.onTimePaid += 1
level.totalLoans += 1

// Check for level up
const newLevel = Math.min(level.streak, 10)
if (newLevel > level.level) {
  level.level = newLevel
  level.unlockedCap = levelCaps[newLevel]
}
```

## Security Considerations

### Data Protection
- Passwords: bcrypt hashed (10+ rounds)
- Share tokens: bcrypt hashed, never stored in plain text
- PII minimization: Only first initial in shared claims
- JWT: Short expiry, secure secrets

### Audit Trail
- Immutable `decision_ledger` with model/policy versions
- Complete `share_access_logs` with IP tracking
- Admin override justifications required
- Consent tracking with timestamps

### Access Control
- JWT-based authentication
- Role-based authorization (borrower/admin)
- Scoped claims for data sharing
- Time-limited share tokens (default 10 min)

## Performance Optimizations

### Indexes
- Compound index on `loans.userId + status` for active loan checks
- TTL index on `share_tokens.expiresAt` for automatic cleanup
- Unique indexes on critical fields (email, liwaywaiId, tokenHash)

### Caching Strategies
- Digital ID data (frequently accessed)
- Policy versions (rarely change)
- Level caps lookup (static data)

### Query Patterns
- Paginated admin queries with skip/limit
- Filtered loan applications by status
- Recent activity with date-based sorting