const crypto = require('crypto');

// Generate unique LiwaywAI ID
const generateLiwaywaiId = () => {
  const prefix = 'LW';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Calculate level caps based on policy
const getLevelCaps = () => {
  return {
    0: 500,
    1: 750,
    2: 1000,
    3: 1250,
    4: 1500,
    5: 2000,
    6: 2500,
    7: 3000,
    8: 3500,
    9: 4000,
    10: 5000
  };
};

// Get streak requirements for each level
const getStreakRequirements = () => {
  return {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10
  };
};

// Calculate PD band from probability
const getPdBand = (pd) => {
  if (pd <= 0.05) return 'Very Low';
  if (pd <= 0.15) return 'Low';
  if (pd <= 0.30) return 'Medium';
  if (pd <= 0.50) return 'High';
  return 'Very High';
};

// Generate reason codes based on decision factors
const generateReasonCodes = (decision, factors = {}) => {
  const reasons = [];
  
  if (decision === 'approve') {
    if (factors.goodCredit) reasons.push('Strong repayment history');
    if (factors.lowRisk) reasons.push('Low risk profile');
    if (factors.withinCap) reasons.push('Amount within approved limit');
  } else if (decision === 'decline') {
    if (factors.exceedsCap) reasons.push('Amount exceeds current limit');
    if (factors.hasActiveLoan) reasons.push('Active loan exists');
    if (factors.highRisk) reasons.push('High risk assessment');
  } else if (decision === 'counter') {
    if (factors.partialApproval) reasons.push('Partial amount approved');
    if (factors.shorterTerm) reasons.push('Shorter term recommended');
  }
  
  return reasons.length > 0 ? reasons : ['Standard policy assessment'];
};

// Generate counterfactual hints
const generateCounterfactual = (decision, currentLevel, requestedAmount) => {
  if (decision === 'decline') {
    const caps = getLevelCaps();
    const nextLevel = Math.min(currentLevel + 1, 10);
    return `To access ₱${requestedAmount}, reach Level ${nextLevel} by maintaining ${nextLevel} consecutive on-time payments`;
  }
  return null;
};

module.exports = {
  generateLiwaywaiId,
  getLevelCaps,
  getStreakRequirements,
  getPdBand,
  generateReasonCodes,
  generateCounterfactual
};