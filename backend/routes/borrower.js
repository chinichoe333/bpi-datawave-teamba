const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { SignJWT } = require('jose');
const { 
  User, Profile, Loan, Level, DigitalIdCard, ShareToken, 
  DecisionLedger, RiskScore, Repayment, ShareAccessLog 
} = require('../models');
const { authenticateToken, requireBorrower } = require('../middleware/auth');
const { 
  getLevelCaps, 
  generateReasonCodes, 
  generateCounterfactual,
  getPdBand 
} = require('../utils/helpers');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const loanApplicationSchema = Joi.object({
  amount: Joi.number().min(100).max(10000).required(),
  termWeeks: Joi.number().min(1).max(52).required(),
  purpose: Joi.string().min(5).max(200).required()
});

const shareRequestSchema = Joi.object({
  scopes: Joi.array().items(
    Joi.string().valid('basic_profile', 'reliability', 'risk_snapshot', 'credit_pathway')
  ).min(1).required(),
  rpLabel: Joi.string().max(100).optional(),
  ttlMinutes: Joi.number().min(1).max(1440).default(10)
});

// GET /me/digital-id
router.get('/digital-id', requireBorrower, async (req, res) => {
  try {
    const digitalId = await DigitalIdCard.findOne({ userId: req.user._id });
    const level = await Level.findOne({ userId: req.user._id });
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!digitalId || !level || !profile) {
      return res.status(404).json({ error: 'Digital ID not found' });
    }

    // Get latest decision if exists
    const latestLoan = await Loan.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('decisionId');

    let lastDecision = null;
    if (latestLoan && latestLoan.decisionId) {
      const riskScore = await RiskScore.findOne({ loanId: latestLoan._id });
      lastDecision = {
        pdBand: riskScore ? getPdBand(riskScore.pd) : 'N/A',
        reasons: riskScore ? riskScore.reasons : [],
        decidedAt: latestLoan.decisionId.decidedAt
      };
    }

    // Calculate reliability metrics
    const totalLoans = level.totalLoans;
    const onTimeRate = totalLoans > 0 ? (level.onTimePaid / totalLoans * 100).toFixed(1) : 0;

    // Get next level info
    const caps = getLevelCaps();
    const nextLevel = Math.min(level.level + 1, 10);
    const actionsToLevelUp = level.level < 10 ? 
      [`Complete ${nextLevel - level.streak} more on-time payments`] : 
      ['Maximum level reached'];

    res.json({
      liwaywaiId: digitalId.liwaywaiId,
      name: profile.name,
      kycLevel: digitalId.kycLevel,
      joinDate: digitalId.joinDate,
      level: {
        current: level.level,
        badge: `Level ${level.level}`,
        unlockedCap: level.unlockedCap,
        nextCap: caps[nextLevel] || level.unlockedCap
      },
      progress: {
        completed: level.streak,
        required: nextLevel,
        percentage: level.level < 10 ? (level.streak / nextLevel * 100).toFixed(1) : 100
      },
      reliability: {
        totalLoans,
        onTimePaid: level.onTimePaid,
        latePaid: level.latePaid,
        onTimeRate: `${onTimeRate}%`,
        streak: level.streak
      },
      lastDecision,
      actionsToLevelUp,
      updatedAt: digitalId.updatedAt
    });
  } catch (error) {
    console.error('Digital ID fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /me/digital-id/share
router.post('/digital-id/share', requireBorrower, async (req, res) => {
  try {
    const { error, value } = shareRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { scopes, rpLabel, ttlMinutes } = value;

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Create share token
    const shareToken = new ShareToken({
      userId: req.user._id,
      scopes,
      tokenHash,
      rpLabel: rpLabel || 'Unknown RP',
      expiresAt
    });
    await shareToken.save();

    // Generate share URL and QR code
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/rp/claims/${rawToken}`;
    const qrSvg = await QRCode.toString(shareUrl, { type: 'svg', width: 200 });

    res.json({
      shareUrl,
      qrSvg,
      expiresAt,
      scopes,
      rpLabel: shareToken.rpLabel,
      tokenId: shareToken._id
    });
  } catch (error) {
    console.error('Share creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me/digital-id/share/history
router.get('/digital-id/share/history', requireBorrower, async (req, res) => {
  try {
    const shares = await ShareToken.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const shareHistory = await Promise.all(shares.map(async (share) => {
      const accessCount = await ShareAccessLog.countDocuments({ 
        shareTokenId: share._id,
        status: 'success'
      });

      return {
        id: share._id,
        scopes: share.scopes,
        rpLabel: share.rpLabel,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        revokedAt: share.revokedAt,
        isActive: !share.revokedAt && share.expiresAt > new Date(),
        accessCount
      };
    }));

    res.json(shareHistory);
  } catch (error) {
    console.error('Share history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /me/digital-id/share/:id/revoke
router.post('/digital-id/share/:id/revoke', requireBorrower, async (req, res) => {
  try {
    const shareToken = await ShareToken.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!shareToken) {
      return res.status(404).json({ error: 'Share token not found' });
    }

    if (shareToken.revokedAt) {
      return res.status(400).json({ error: 'Token already revoked' });
    }

    shareToken.revokedAt = new Date();
    await shareToken.save();

    res.json({ message: 'Share token revoked successfully' });
  } catch (error) {
    console.error('Share revocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/apply
router.post('/apply', requireBorrower, async (req, res) => {
  try {
    const { error, value } = loanApplicationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, termWeeks, purpose } = value;

    // Check for active loans (one-active-loan guard)
    const activeLoan = await Loan.findOne({
      userId: req.user._id,
      status: { $in: ['approved', 'active'] }
    });

    if (activeLoan) {
      return res.status(400).json({ 
        error: 'You already have an active loan',
        activeLoanId: activeLoan._id
      });
    }

    // Get user level and cap
    const level = await Level.findOne({ userId: req.user._id });
    if (!level) {
      return res.status(404).json({ error: 'User level not found' });
    }

    // Check amount against cap
    if (amount > level.unlockedCap) {
      return res.status(400).json({ 
        error: `Amount exceeds your current limit of ₱${level.unlockedCap}`,
        currentCap: level.unlockedCap,
        requestedAmount: amount
      });
    }

    // Create loan application
    const loan = new Loan({
      userId: req.user._id,
      amount,
      termWeeks,
      purpose,
      status: 'applied',
      levelAtApply: level.level
    });
    await loan.save();

    // Call ML service for scoring
    try {
      const profile = await Profile.findOne({ userId: req.user._id });
      
      const scoringInput = {
        loanId: loan._id.toString(),
        userId: req.user._id.toString(),
        amount,
        termWeeks,
        purpose,
        level: level.level,
        streak: level.streak,
        totalLoans: level.totalLoans,
        onTimePaid: level.onTimePaid,
        latePaid: level.latePaid,
        profile: {
          kycLevel: profile.kycLevel,
          city: profile.city,
          occupation: profile.occupation
        }
      };

      const mlResponse = await axios.post(
        `${process.env.ML_SERVICE_URL}/score`,
        scoringInput,
        { timeout: 10000 }
      );

      const { pd, decision, reasons, counter_offer, counterfactual_hint } = mlResponse.data;

      // Save risk score
      const riskScore = new RiskScore({
        loanId: loan._id,
        pd,
        reasons,
        counterfactualHint: counterfactual_hint,
        modelVersion: 'champion-v1.0'
      });
      await riskScore.save();

      // Save decision to ledger
      const decisionLedger = new DecisionLedger({
        loanId: loan._id,
        inputsJSON: JSON.stringify(scoringInput),
        modelVersion: 'champion-v1.0',
        policyVersion: 'v1.0.0',
        decision,
        reasons,
        decidedAt: new Date()
      });
      await decisionLedger.save();

      // Update loan with decision
      loan.decisionId = decisionLedger._id;
      
      if (decision === 'approve') {
        loan.status = 'approved';
        loan.approvedAt = new Date();
      } else if (decision === 'counter' && counter_offer) {
        loan.status = 'counter_offered';
        loan.counterOffer = counter_offer;
      } else {
        loan.status = 'declined';
      }
      
      await loan.save();

      res.json({
        loanId: loan._id,
        decision,
        reasons,
        pd: pd.toFixed(4),
        pdBand: getPdBand(pd),
        counterOffer: counter_offer,
        counterfactualHint: counterfactual_hint,
        decidedAt: decisionLedger.decidedAt
      });

    } catch (mlError) {
      console.error('ML service error:', mlError);
      
      // Fallback decision logic
      const fallbackDecision = amount <= level.unlockedCap * 0.8 ? 'approve' : 'decline';
      const fallbackReasons = generateReasonCodes(fallbackDecision, {
        withinCap: amount <= level.unlockedCap,
        goodCredit: level.onTimePaid > level.latePaid
      });

      const decisionLedger = new DecisionLedger({
        loanId: loan._id,
        inputsJSON: JSON.stringify({ amount, termWeeks, level: level.level }),
        modelVersion: 'fallback-v1.0',
        policyVersion: 'v1.0.0',
        decision: fallbackDecision,
        reasons: fallbackReasons,
        decidedAt: new Date()
      });
      await decisionLedger.save();

      loan.decisionId = decisionLedger._id;
      loan.status = fallbackDecision === 'approve' ? 'approved' : 'declined';
      await loan.save();

      res.json({
        loanId: loan._id,
        decision: fallbackDecision,
        reasons: fallbackReasons,
        pd: '0.1500',
        pdBand: 'Medium',
        warning: 'Fallback decision used - ML service unavailable'
      });
    }

  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /loans/:id
router.get('/:id', requireBorrower, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('decisionId');

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const riskScore = await RiskScore.findOne({ loanId: loan._id });
    const repayments = await Repayment.find({ loanId: loan._id }).sort({ dueDate: 1 });

    res.json({
      id: loan._id,
      amount: loan.amount,
      termWeeks: loan.termWeeks,
      purpose: loan.purpose,
      status: loan.status,
      levelAtApply: loan.levelAtApply,
      counterOffer: loan.counterOffer,
      createdAt: loan.createdAt,
      approvedAt: loan.approvedAt,
      completedAt: loan.completedAt,
      decision: loan.decisionId ? {
        decision: loan.decisionId.decision,
        reasons: loan.decisionId.reasons,
        decidedAt: loan.decisionId.decidedAt,
        overrideNote: loan.decisionId.overrideNote
      } : null,
      riskScore: riskScore ? {
        pd: riskScore.pd,
        pdBand: getPdBand(riskScore.pd),
        reasons: riskScore.reasons,
        counterfactualHint: riskScore.counterfactualHint
      } : null,
      repayments
    });
  } catch (error) {
    console.error('Loan fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/:id/repayments/mark-paid
router.post('/:id/repayments/mark-paid', requireBorrower, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'approved'
    });

    if (!loan) {
      return res.status(404).json({ error: 'Active loan not found' });
    }

    // For simulation, mark loan as completed and update level
    loan.status = 'completed';
    loan.completedAt = new Date();
    await loan.save();

    // Update level progression
    const level = await Level.findOne({ userId: req.user._id });
    level.totalLoans += 1;
    level.onTimePaid += 1;
    level.streak += 1;

    // Check for level up
    const caps = getLevelCaps();
    const newLevel = Math.min(level.streak, 10);
    
    if (newLevel > level.level) {
      level.level = newLevel;
      level.unlockedCap = caps[newLevel];
    }

    level.updatedAt = new Date();
    await level.save();

    // Update digital ID
    await DigitalIdCard.findOneAndUpdate(
      { userId: req.user._id },
      {
        levelSnapshot: level.level,
        capCurrent: level.unlockedCap,
        capNext: caps[Math.min(level.level + 1, 10)],
        updatedAt: new Date()
      }
    );

    res.json({
      message: 'Repayment marked as paid',
      levelUp: newLevel > (level.level - 1),
      newLevel: level.level,
      newCap: level.unlockedCap,
      streak: level.streak
    });

  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;