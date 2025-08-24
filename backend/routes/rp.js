const express = require('express');
const bcrypt = require('bcryptjs');
const { SignJWT } = require('jose');
const { 
  ShareToken, ShareAccessLog, User, Profile, Level, 
  DigitalIdCard, Loan, RiskScore 
} = require('../models');
const { getPdBand } = require('../utils/helpers');

const router = express.Router();

// GET /rp/claims/:token
router.get('/claims/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Find share token by comparing hash
    const shareTokens = await ShareToken.find({
      expiresAt: { $gt: new Date() },
      revokedAt: null
    });

    let matchedToken = null;
    for (const shareToken of shareTokens) {
      const isMatch = await bcrypt.compare(token, shareToken.tokenHash);
      if (isMatch) {
        matchedToken = shareToken;
        break;
      }
    }

    // Log access attempt
    const logAccess = async (status, scopesAccessed = []) => {
      if (matchedToken) {
        await ShareAccessLog.create({
          shareTokenId: matchedToken._id,
          accessedAt: new Date(),
          rpIp: clientIp,
          status,
          scopesAccessed
        });
      }
    };

    // Token not found or invalid
    if (!matchedToken) {
      await logAccess('invalid');
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is expired
    if (matchedToken.expiresAt <= new Date()) {
      await logAccess('expired');
      return res.status(410).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Check if token is revoked
    if (matchedToken.revokedAt) {
      await logAccess('revoked');
      return res.status(410).json({ 
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Get user data
    const user = await User.findById(matchedToken.userId);
    const profile = await Profile.findOne({ userId: matchedToken.userId });
    const level = await Level.findOne({ userId: matchedToken.userId });
    const digitalId = await DigitalIdCard.findOne({ userId: matchedToken.userId });

    if (!user || !profile || !level || !digitalId) {
      await logAccess('invalid');
      return res.status(404).json({ 
        error: 'User data not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Build scoped claims
    const claims = {
      iss: 'liwaywai-prototype',
      sub: digitalId.liwaywaiId,
      aud: matchedToken.rpLabel || 'unknown-rp',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(matchedToken.expiresAt.getTime() / 1000),
      scopes: matchedToken.scopes
    };

    // Add scope-specific data
    if (matchedToken.scopes.includes('basic_profile')) {
      claims.basic_profile = {
        liwaywai_id: digitalId.liwaywaiId,
        kyc_level: digitalId.kycLevel,
        join_date: digitalId.joinDate.toISOString(),
        name_initial: profile.name.charAt(0).toUpperCase() // Privacy: only first initial
      };
    }

    if (matchedToken.scopes.includes('reliability')) {
      const onTimeRate = level.totalLoans > 0 ? 
        (level.onTimePaid / level.totalLoans * 100).toFixed(1) : 0;

      claims.reliability = {
        level: level.level,
        level_badge: `Level ${level.level}`,
        unlocked_cap: level.unlockedCap,
        streak: level.streak,
        progress: {
          completed: level.streak,
          required: Math.min(level.level + 1, 10),
          percentage: level.level < 10 ? 
            (level.streak / Math.min(level.level + 1, 10) * 100).toFixed(1) : 100
        },
        reliability_metrics: {
          total_loans: level.totalLoans,
          on_time_paid: level.onTimePaid,
          late_paid: level.latePaid,
          on_time_rate: `${onTimeRate}%`
        }
      };
    }

    if (matchedToken.scopes.includes('risk_snapshot')) {
      // Get latest risk assessment
      const latestLoan = await Loan.findOne({ userId: matchedToken.userId })
        .sort({ createdAt: -1 });
      
      let riskSnapshot = {
        pd_band: 'No Assessment',
        assessment_date: null,
        policy_version: digitalId.policyVersionId
      };

      if (latestLoan) {
        const riskScore = await RiskScore.findOne({ loanId: latestLoan._id });
        if (riskScore) {
          riskSnapshot = {
            pd_band: getPdBand(riskScore.pd),
            pd_value: riskScore.pd.toFixed(4),
            reasons: riskScore.reasons,
            assessment_date: riskScore.createdAt.toISOString(),
            policy_version: digitalId.policyVersionId
          };
        }
      }

      claims.risk_snapshot = riskSnapshot;
    }

    if (matchedToken.scopes.includes('credit_pathway')) {
      const nextLevel = Math.min(level.level + 1, 10);
      const caps = { 0: 500, 1: 750, 2: 1000, 3: 1250, 4: 1500, 
                    5: 2000, 6: 2500, 7: 3000, 8: 3500, 9: 4000, 10: 5000 };
      
      claims.credit_pathway = {
        current_cap: level.unlockedCap,
        next_cap: caps[nextLevel] || level.unlockedCap,
        actions_to_level_up: level.level < 10 ? 
          [`Complete ${nextLevel - level.streak} more on-time payments`] : 
          ['Maximum level reached'],
        estimated_timeline: level.level < 10 ? 
          `${nextLevel - level.streak} loan cycles` : 'N/A'
      };
    }

    // Sign JWT with JWS
    const secret = new TextEncoder().encode(process.env.JWS_SECRET);
    const jwt = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(matchedToken.expiresAt)
      .sign(secret);

    // Log successful access
    await logAccess('success', matchedToken.scopes);

    // Set security headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.json({
      claims,
      jwt,
      metadata: {
        token_id: matchedToken._id,
        issued_at: new Date().toISOString(),
        expires_at: matchedToken.expiresAt.toISOString(),
        scopes: matchedToken.scopes,
        rp_label: matchedToken.rpLabel,
        warning: 'PROTOTYPE - SIMULATION ONLY'
      }
    });

  } catch (error) {
    console.error('Claims fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /rp/verify/:jwt
router.get('/verify/:jwt', async (req, res) => {
  try {
    const { jwt } = req.params;
    
    // Verify JWT signature
    const { jwtVerify } = require('jose');
    const secret = new TextEncoder().encode(process.env.JWS_SECRET);
    
    const { payload } = await jwtVerify(jwt, secret);
    
    res.json({
      valid: true,
      claims: payload,
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ 
      valid: false,
      error: 'Invalid or expired JWT',
      verified_at: new Date().toISOString()
    });
  }
});

module.exports = router;