# LiwaywAI API Documentation

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Auth Endpoints

### POST /auth/signup
Create new borrower account with stepwise consent.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "city": "Manila",
  "occupation": "Teacher"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "borrower"
  },
  "digitalId": {
    "liwaywaiId": "LW123ABC",
    "level": 0,
    "unlockedCap": 500
  }
}
```

### POST /auth/login
Authenticate user and return JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Borrower Endpoints

### GET /me/digital-id
Get borrower's digital ID card with current level, progress, and reliability metrics.

**Response:**
```json
{
  "liwaywaiId": "LW123ABC",
  "name": "John Doe",
  "kycLevel": "basic",
  "joinDate": "2024-01-01T00:00:00.000Z",
  "level": {
    "current": 3,
    "badge": "Level 3",
    "unlockedCap": 1250,
    "nextCap": 1500
  },
  "progress": {
    "completed": 2,
    "required": 4,
    "percentage": "50.0"
  },
  "reliability": {
    "totalLoans": 5,
    "onTimePaid": 4,
    "latePaid": 1,
    "onTimeRate": "80.0%",
    "streak": 2
  },
  "lastDecision": {
    "pdBand": "Low",
    "reasons": ["Strong borrower level", "Good repayment history"],
    "decidedAt": "2024-01-15T10:30:00.000Z"
  },
  "actionsToLevelUp": ["Complete 2 more on-time payments"]
}
```

### POST /me/digital-id/share
Create time-limited, scoped sharing token for digital ID.

**Request:**
```json
{
  "scopes": ["basic_profile", "reliability", "risk_snapshot"],
  "rpLabel": "Bank XYZ",
  "ttlMinutes": 10
}
```

**Response:**
```json
{
  "shareUrl": "https://app.liwaywai.com/rp/claims/token123",
  "qrSvg": "<svg>...</svg>",
  "expiresAt": "2024-01-01T10:10:00.000Z",
  "scopes": ["basic_profile", "reliability"],
  "rpLabel": "Bank XYZ",
  "tokenId": "token_id"
}
```

### POST /loans/apply
Submit loan application with automatic ML scoring.

**Request:**
```json
{
  "amount": 1000,
  "termWeeks": 4,
  "purpose": "Emergency expenses"
}
```

**Response:**
```json
{
  "loanId": "loan_id",
  "decision": "approve",
  "reasons": ["Strong borrower level", "Conservative amount"],
  "pd": "0.1250",
  "pdBand": "Low",
  "counterOffer": null,
  "counterfactualHint": null,
  "decidedAt": "2024-01-01T10:00:00.000Z"
}
```

### POST /loans/:id/repayments/mark-paid
Mark loan as paid (simulation) and trigger level progression.

**Response:**
```json
{
  "message": "Repayment marked as paid",
  "levelUp": true,
  "newLevel": 4,
  "newCap": 1500,
  "streak": 4
}
```

## Admin Endpoints

### GET /admin/applications
Get paginated list of loan applications with risk scores.

**Query Parameters:**
- `status`: Filter by loan status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### POST /admin/applications/:id/override
Override ML decision with admin justification.

**Request:**
```json
{
  "decision": "approve",
  "note": "Manual approval due to special circumstances"
}
```

### GET /admin/borrowers/:id
Get complete borrower 360 view with timeline.

### GET /admin/shares
Get share token logs with access history.

## Relying Party Endpoints

### GET /rp/claims/:token
Retrieve scoped claims using share token.

**Response:**
```json
{
  "claims": {
    "iss": "liwaywai-prototype",
    "sub": "LW123ABC",
    "aud": "Bank XYZ",
    "basic_profile": {
      "liwaywai_id": "LW123ABC",
      "kyc_level": "verified",
      "join_date": "2024-01-01T00:00:00.000Z"
    },
    "reliability": {
      "level": 3,
      "unlocked_cap": 1250,
      "on_time_rate": "80.0%"
    }
  },
  "jwt": "signed_jwt_token",
  "metadata": {
    "expires_at": "2024-01-01T10:10:00.000Z",
    "scopes": ["basic_profile", "reliability"]
  }
}
```

## ML Service Endpoints

### POST /score
Score loan application using Champion model.

**Request:**
```json
{
  "loanId": "loan_id",
  "userId": "user_id",
  "amount": 1000,
  "termWeeks": 4,
  "level": 3,
  "streak": 2,
  "totalLoans": 5,
  "onTimePaid": 4,
  "profile": {
    "kycLevel": "verified",
    "city": "Manila",
    "occupation": "Teacher"
  }
}
```

**Response:**
```json
{
  "pd": 0.1250,
  "decision": "approve",
  "reasons": ["Strong borrower level", "Conservative amount"],
  "counter_offer": null,
  "counterfactual_hint": null,
  "model_version": "champion-v1.0",
  "scored_at": "2024-01-01T10:00:00.000Z"
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `410`: Gone (expired/revoked tokens)
- `500`: Internal Server Error