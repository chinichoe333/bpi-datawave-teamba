const express = require('express');
const Joi = require('joi');
const { 
  Loan, User, Profile, Level, DecisionLedger, ShareToken, 
  ShareAccessLog, PolicyVersion, RiskScore 
} = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Validation schemas
const overrideSchema = Joi.object({
  decision: Joi.string().valid('approve', 'decline').required(),
  note: Joi.string().min(10).max(500).required()
});

const policySchema = Joi.object({
  version: Joi.string().required(),
  params: Joi.object().required()
});

// GET /admin/applications
router.get('/applications', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const loans = await Loan.find(query)
      .populate('userId', 'email')
      .populate('decisionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Enrich with risk scores and profiles
    const enrichedLoans = await Promise.all(loans.map(async (loan) => {
      const riskScore = await RiskScore.findOne({ loanId: loan._id });
      const profile = await Profile.findOne({ userId: loan.userId._id });
      const level = await Level.findOne({ userId: loan.userId._id });

      return {
        id: loan._id,
        borrower: {
          email: loan.userId.email,
          name: profile?.name || 'N/A',
          level: level?.level || 0
        },
        amount: loan.amount,
        termWeeks: loan.termWeeks,
        purpose: loan.purpose,
        status: loan.status,
        levelAtApply: loan.levelAtApply,
        createdAt: loan.createdAt,
        decision: loan.decisionId ? {
          decision: loan.decisionId.decision,
          reasons: loan.decisionId.reasons,
          overrideNote: loan.decisionId.overrideNote,
          decidedAt: loan.decisionId.decidedAt
        } : null,
        riskScore: riskScore ? {
          pd: riskScore.pd,
          reasons: riskScore.reasons
        } : null
      };
    }));

    const total = await Loan.countDocuments(query);

    res.json({
      applications: enrichedLoans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/applications/:id/override
router.post('/applications/:id/override', async (req, res) => {
  try {
    const { error, value } = overrideSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { decision, note } = value;

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'applied' && loan.status !== 'declined') {
      return res.status(400).json({ error: 'Loan cannot be overridden in current status' });
    }

    // Update decision ledger with override
    const decisionLedger = await DecisionLedger.findById(loan.decisionId);
    if (decisionLedger) {
      decisionLedger.decision = decision;
      decisionLedger.overrideNote = note;
      decisionLedger.overriddenBy = req.user._id;
      await decisionLedger.save();
    }

    // Update loan status
    loan.status = decision === 'approve' ? 'approved' : 'declined';
    if (decision === 'approve') {
      loan.approvedAt = new Date();
    }
    await loan.save();

    res.json({
      message: 'Application overridden successfully',
      loanId: loan._id,
      newStatus: loan.status,
      overrideNote: note
    });
  } catch (error) {
    console.error('Override error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/borrowers/:id
router.get('/borrowers/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'borrower') {
      return res.status(404).json({ error: 'Borrower not found' });
    }

    const profile = await Profile.findOne({ userId: user._id });
    const level = await Level.findOne({ userId: user._id });
    
    // Get complete timeline
    const loans = await Loan.find({ userId: user._id })
      .populate('decisionId')
      .sort({ createdAt: -1 });

    const shares = await ShareToken.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Enrich loans with risk scores
    const enrichedLoans = await Promise.all(loans.map(async (loan) => {
      const riskScore = await RiskScore.findOne({ loanId: loan._id });
      return {
        id: loan._id,
        amount: loan.amount,
        termWeeks: loan.termWeeks,
        purpose: loan.purpose,
        status: loan.status,
        createdAt: loan.createdAt,
        approvedAt: loan.approvedAt,
        completedAt: loan.completedAt,
        decision: loan.decisionId ? {
          decision: loan.decisionId.decision,
          reasons: loan.decisionId.reasons,
          overrideNote: loan.decisionId.overrideNote
        } : null,
        riskScore: riskScore ? {
          pd: riskScore.pd,
          reasons: riskScore.reasons
        } : null
      };
    }));

    // Calculate share access stats
    const shareStats = await Promise.all(shares.map(async (share) => {
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
        accessCount
      };
    }));

    res.json({
      borrower: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        profile: profile ? {
          name: profile.name,
          gender: profile.gender,   
          city: profile.city,
          occupation: profile.occupation,
          kycLevel: profile.kycLevel
        } : null,
        level: level ? {
          current: level.level,
          unlockedCap: level.unlockedCap,
          streak: level.streak,
          totalLoans: level.totalLoans,
          onTimePaid: level.onTimePaid,
          latePaid: level.latePaid,
          onTimeRate: level.totalLoans > 0 ? 
            (level.onTimePaid / level.totalLoans * 100).toFixed(1) : 0
        } : null
      },
      timeline: {
        loans: enrichedLoans,
        shares: shareStats
      }
    });
  } catch (error) {
    console.error('Borrower 360 error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /admin/policy
router.put('/policy', async (req, res) => {
  try {
    const { error, value } = policySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { version, params } = value;

    // Check if version already exists
    const existingPolicy = await PolicyVersion.findOne({ version });
    if (existingPolicy) {
      return res.status(400).json({ error: 'Policy version already exists' });
    }

    // Deactivate current active policy
    await PolicyVersion.updateMany({ isActive: true }, { isActive: false });

    // Create new policy version
    const policyVersion = new PolicyVersion({
      version,
      paramsJSON: JSON.stringify(params),
      isActive: true
    });
    await policyVersion.save();

    res.json({
      message: 'Policy version created successfully',
      version,
      isActive: true,
      createdAt: policyVersion.createdAt
    });
  } catch (error) {
    console.error('Policy creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/policy
router.get('/policy', async (req, res) => {
  try {
    const policies = await PolicyVersion.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const policiesWithParams = policies.map(policy => ({
      id: policy._id,
      version: policy.version,
      params: JSON.parse(policy.paramsJSON),
      isActive: policy.isActive,
      createdAt: policy.createdAt
    }));

    res.json(policiesWithParams);
  } catch (error) {
    console.error('Policy fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/shares
router.get('/shares', async (req, res) => {
  try {
    const { from, to, status, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Build query for share tokens
    const query = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const shares = await ShareToken.find(query)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Enrich with access logs
    const enrichedShares = await Promise.all(shares.map(async (share) => {
      const accessLogs = await ShareAccessLog.find({ shareTokenId: share._id })
        .sort({ accessedAt: -1 });

      const isActive = !share.revokedAt && share.expiresAt > new Date();
      const matchesStatus = !status || 
        (status === 'active' && isActive) ||
        (status === 'expired' && !isActive && !share.revokedAt) ||
        (status === 'revoked' && share.revokedAt);

      if (!matchesStatus) return null;

      return {
        id: share._id,
        borrowerEmail: share.userId.email,
        scopes: share.scopes,
        rpLabel: share.rpLabel,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        revokedAt: share.revokedAt,
        isActive,
        accessCount: accessLogs.length,
        lastAccessed: accessLogs.length > 0 ? accessLogs[0].accessedAt : null,
        accessLogs: accessLogs.map(log => ({
          accessedAt: log.accessedAt,
          rpIp: log.rpIp,
          status: log.status,
          scopesAccessed: log.scopesAccessed
        }))
      };
    }));

    // Filter out null results
    const filteredShares = enrichedShares.filter(share => share !== null);

    const total = await ShareToken.countDocuments(query);

    res.json({
      shares: filteredShares,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Shares fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get key metrics
    const totalBorrowers = await User.countDocuments({ role: 'borrower' });
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'approved' });
    const pendingApplications = await Loan.countDocuments({ status: 'applied' });
    
    // Recent activity
    const recentLoans = await Loan.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentShares = await ShareToken.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Level distribution
    const levelDistribution = await Level.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const genderAggArr = await Profile.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.role': 'borrower' } },
      {
        $group: {
          _id: null,
          female: { $sum: { $cond: [{ $eq: ['$gender', 'female'] }, 1, 0] } },
          male:   { $sum: { $cond: [{ $eq: ['$gender', 'male'] }, 1, 0] } },
          other:  { $sum: { $cond: [
            { $and: [{ $ne: ['$gender', 'female'] }, { $ne: ['$gender', 'male'] }] }, 1, 0
          ] } }
        }
      },
      { $project: { _id: 0, female: 1, male: 1, other: 1 } }
    ]);
    const genderAgg = genderAggArr[0] || { female: 0, male: 0, other: 0 };

    const occupationsAgg = await Profile.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.role': 'borrower' } },
      { $match: { occupation: { $ne: null, $ne: '' } } },
      { $group: { _id: '$occupation', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } },
      { $sort: { count: -1, label: 1 } },
      { $limit: 20 }
    ]);

    const locationsAgg = await Profile.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.role': 'borrower' } },
      { $match: { city: { $ne: null, $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', count: 1 } },
      { $sort: { count: -1, label: 1 } },
      { $limit: 20 }
    ]);

    const demographics = {
      total: totalBorrowers,
      gender: genderAgg,
      occupations: occupationsAgg,
      locations: locationsAgg
    };

    res.json({
      metrics: {
        totalBorrowers,
        totalLoans,
        activeLoans,
        pendingApplications
      },
      recentActivity: {
        loans: recentLoans.map(loan => ({
          id: loan._id,
          borrowerEmail: loan.userId.email,
          amount: loan.amount,
          status: loan.status,
          createdAt: loan.createdAt
        })),
        shares: recentShares.map(share => ({
          id: share._id,
          borrowerEmail: share.userId.email,
          scopes: share.scopes,
          rpLabel: share.rpLabel,
          createdAt: share.createdAt
        }))
      },
      levelDistribution,
      demographics
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;