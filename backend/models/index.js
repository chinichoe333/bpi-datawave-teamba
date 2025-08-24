const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['borrower', 'admin'], default: 'borrower' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

// Profile Schema
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  occupation: { type: String, required: true },
  kycLevel: { type: String, enum: ['basic', 'verified'], default: 'basic' },
  createdAt: { type: Date, default: Date.now }
});

// Consent Schema
const consentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true }, // e.g., 'data_processing', 'credit_check'
  grantedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null }
});

// Loan Schema
const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  termWeeks: { type: Number, required: true },
  purpose: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['applied', 'approved', 'declined', 'counter_offered', 'active', 'completed', 'defaulted'],
    default: 'applied'
  },
  levelAtApply: { type: Number, required: true },
  decisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DecisionLedger' },
  counterOffer: {
    amount: Number,
    termWeeks: Number,
    reason: String
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  completedAt: { type: Date }
});

// Repayment Schema
const repaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  paidAt: { type: Date },
  status: { type: String, enum: ['pending', 'paid', 'late', 'missed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Level Schema
const levelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  level: { type: Number, default: 0, min: 0, max: 10 },
  unlockedCap: { type: Number, default: 500 },
  streak: { type: Number, default: 0 },
  totalLoans: { type: Number, default: 0 },
  onTimePaid: { type: Number, default: 0 },
  latePaid: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// Risk Score Schema
const riskScoreSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  pd: { type: Number, required: true }, // Probability of default
  reasons: [{ type: String }],
  counterfactualHint: { type: String },
  modelVersion: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Policy Version Schema
const policyVersionSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  paramsJSON: { type: String, required: true }, // Stringified JSON
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false }
});

// Decision Ledger Schema
const decisionLedgerSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  inputsJSON: { type: String, required: true }, // Stringified JSON of inputs
  modelVersion: { type: String, required: true },
  policyVersion: { type: String, required: true },
  decision: { type: String, enum: ['approve', 'decline', 'counter'], required: true },
  reasons: [{ type: String }],
  overrideNote: { type: String },
  overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decidedAt: { type: Date, default: Date.now }
});

// Digital ID Card Schema
const digitalIdCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  liwaywaiId: { type: String, required: true, unique: true },
  kycLevel: { type: String, required: true },
  levelSnapshot: { type: Number, required: true },
  joinDate: { type: Date, required: true },
  lastDecisionJSON: { type: String }, // Stringified JSON
  reliabilityJSON: { type: String }, // Stringified JSON
  levelProgress: {
    completed: { type: Number, default: 0 },
    required: { type: Number, default: 1 }
  },
  capCurrent: { type: Number, required: true },
  capNext: { type: Number },
  policyVersionId: { type: String, required: true },
  consentSummary: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

// Share Token Schema
const shareTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scopes: [{ type: String }],
  tokenHash: { type: String, required: true, unique: true },
  rpLabel: { type: String },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// TTL index for automatic cleanup
shareTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Share Access Log Schema
const shareAccessLogSchema = new mongoose.Schema({
  shareTokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShareToken', required: true },
  accessedAt: { type: Date, default: Date.now },
  rpIp: { type: String, required: true },
  status: { type: String, enum: ['success', 'expired', 'revoked', 'invalid'], required: true },
  scopesAccessed: [{ type: String }]
});

// Compound indexes
loanSchema.index({ userId: 1, status: 1 });
consentSchema.index({ userId: 1, key: 1 });
repaymentSchema.index({ loanId: 1, dueDate: 1 });

// Models
const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);
const Consent = mongoose.model('Consent', consentSchema);
const Loan = mongoose.model('Loan', loanSchema);
const Repayment = mongoose.model('Repayment', repaymentSchema);
const Level = mongoose.model('Level', levelSchema);
const RiskScore = mongoose.model('RiskScore', riskScoreSchema);
const PolicyVersion = mongoose.model('PolicyVersion', policyVersionSchema);
const DecisionLedger = mongoose.model('DecisionLedger', decisionLedgerSchema);
const DigitalIdCard = mongoose.model('DigitalIdCard', digitalIdCardSchema);
const ShareToken = mongoose.model('ShareToken', shareTokenSchema);
const ShareAccessLog = mongoose.model('ShareAccessLog', shareAccessLogSchema);

module.exports = {
  User,
  Profile,
  Consent,
  Loan,
  Repayment,
  Level,
  RiskScore,
  PolicyVersion,
  DecisionLedger,
  DigitalIdCard,
  ShareToken,
  ShareAccessLog
};