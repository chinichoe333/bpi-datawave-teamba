const { Level, DigitalIdCard } = require('../models');

/**
 * Level system configuration
 */
const LEVEL_CONFIG = {
  maxLevel: 10,
  levelCaps: {
    0: 500,   // Starter
    1: 750,   // Bronze
    2: 1000,  // Silver
    3: 1250,  // Gold
    4: 1500,  // Platinum
    5: 2000,  // Diamond
    6: 2500,  // Elite
    7: 3000,  // Master
    8: 3500,  // Champion
    9: 4000,  // Legend
    10: 5000  // Ultimate
  },
  levelNames: {
    0: 'Starter',
    1: 'Bronze',
    2: 'Silver', 
    3: 'Gold',
    4: 'Platinum',
    5: 'Diamond',
    6: 'Elite',
    7: 'Master',
    8: 'Champion',
    9: 'Legend',
    10: 'Ultimate'
  },
  // Requirements to reach next level
  levelRequirements: {
    0: 1,  // 1 on-time payment to reach level 1
    1: 2,  // 2 consecutive payments
    2: 3,  // 3 consecutive payments
    3: 4,  // 4 consecutive payments
    4: 5,  // 5 consecutive payments
    5: 6,  // 6 consecutive payments
    6: 7,  // 7 consecutive payments
    7: 8,  // 8 consecutive payments
    8: 9,  // 9 consecutive payments
    9: 10, // 10 consecutive payments
    10: 0  // Max level reached
  },
  // Perks unlocked at each level
  levelPerks: {
    0: ['Basic lending access'],
    1: ['Increased limit: ₱750', 'Payment reminders'],
    2: ['Increased limit: ₱1,000', 'Grace period: 1 day'],
    3: ['Increased limit: ₱1,250', 'Lower interest rates', 'Priority support'],
    4: ['Increased limit: ₱1,500', 'Flexible payment dates'],
    5: ['Increased limit: ₱2,000', 'Premium features', 'Cashback rewards'],
    6: ['Increased limit: ₱2,500', 'VIP support', 'Special offers'],
    7: ['Increased limit: ₱3,000', 'Extended terms available'],
    8: ['Increased limit: ₱3,500', 'Exclusive products'],
    9: ['Increased limit: ₱4,000', 'Personal account manager'],
    10: ['Maximum limit: ₱5,000', 'All premium features', 'Lifetime benefits']
  }
};

/**
 * Update level progress after successful payment
 */
async function updateLevelProgress(userId, paymentType = 'ontime') {
  const level = await Level.findOne({ userId });
  if (!level) {
    throw new Error('Level record not found');
  }

  const wasEarlyOrOnTime = paymentType === 'early' || paymentType === 'ontime';
  let levelChanged = false;
  let newPerksUnlocked = [];

  if (wasEarlyOrOnTime) {
    // Increment streak and on-time payments
    level.streak += 1;
    level.onTimePaid += 1;
    
    // Check if eligible for level up
    const currentLevel = level.level;
    const requiredPayments = LEVEL_CONFIG.levelRequirements[currentLevel];
    
    if (currentLevel < LEVEL_CONFIG.maxLevel && level.streak >= requiredPayments) {
      // Level up!
      const newLevel = currentLevel + 1;
      level.level = newLevel;
      level.unlockedCap = LEVEL_CONFIG.levelCaps[newLevel];
      level.streak = 0; // Reset streak for next level
      levelChanged = true;
      newPerksUnlocked = LEVEL_CONFIG.levelPerks[newLevel] || [];
    }
  } else {
    // Late payment - reset streak but don't decrease level
    level.streak = 0;
    level.latePaid += 1;
  }

  level.totalLoans += 1;
  level.updatedAt = new Date();
  await level.save();

  // Update digital ID card if level changed
  if (levelChanged) {
    await updateDigitalIdCard(userId, level);
  }

  return {
    levelChanged,
    newLevel: level.level,
    newCap: level.unlockedCap,
    newPerksUnlocked,
    currentStreak: level.streak,
    nextLevelRequirement: LEVEL_CONFIG.levelRequirements[level.level] || 0,
    levelName: LEVEL_CONFIG.levelNames[level.level],
    nextLevelName: LEVEL_CONFIG.levelNames[level.level + 1] || 'Max Level'
  };
}

/**
 * Update digital ID card after level change
 */
async function updateDigitalIdCard(userId, levelRecord) {
  const digitalId = await DigitalIdCard.findOne({ userId });
  if (digitalId) {
    digitalId.levelSnapshot = levelRecord.level;
    digitalId.capCurrent = levelRecord.unlockedCap;
    digitalId.capNext = LEVEL_CONFIG.levelCaps[levelRecord.level + 1] || null;
    
    // Update level progress
    const nextLevelReq = LEVEL_CONFIG.levelRequirements[levelRecord.level] || 0;
    digitalId.levelProgress = {
      completed: levelRecord.streak,
      required: nextLevelReq
    };
    
    digitalId.updatedAt = new Date();
    await digitalId.save();
  }
}

/**
 * Get level information for a user
 */
async function getLevelInfo(userId) {
  const level = await Level.findOne({ userId });
  if (!level) {
    return null;
  }

  const currentLevel = level.level;
  const nextLevel = currentLevel + 1;
  const nextLevelReq = LEVEL_CONFIG.levelRequirements[currentLevel] || 0;
  
  return {
    currentLevel,
    levelName: LEVEL_CONFIG.levelNames[currentLevel],
    currentCap: level.unlockedCap,
    streak: level.streak,
    totalLoans: level.totalLoans,
    onTimePaid: level.onTimePaid,
    latePaid: level.latePaid,
    onTimeRate: level.totalLoans > 0 ? (level.onTimePaid / level.totalLoans) : 0,
    
    // Next level info
    nextLevel: nextLevel <= LEVEL_CONFIG.maxLevel ? nextLevel : null,
    nextLevelName: LEVEL_CONFIG.levelNames[nextLevel] || 'Max Level',
    nextLevelCap: LEVEL_CONFIG.levelCaps[nextLevel] || null,
    paymentsNeeded: Math.max(0, nextLevelReq - level.streak),
    progressPercentage: nextLevelReq > 0 ? Math.min(100, (level.streak / nextLevelReq) * 100) : 100,
    
    // Current perks
    currentPerks: LEVEL_CONFIG.levelPerks[currentLevel] || [],
    nextLevelPerks: LEVEL_CONFIG.levelPerks[nextLevel] || [],
    
    // Is max level
    isMaxLevel: currentLevel >= LEVEL_CONFIG.maxLevel
  };
}

/**
 * Get all level configurations (for admin/info purposes)
 */
function getAllLevelConfigs() {
  return LEVEL_CONFIG;
}

/**
 * Calculate level from payment history (for migration/recalculation)
 */
function calculateLevelFromHistory(paymentHistory) {
  let currentLevel = 0;
  let currentStreak = 0;
  let totalOnTime = 0;
  let totalLate = 0;

  // Sort payments by date
  const sortedPayments = paymentHistory.sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt));

  for (const payment of sortedPayments) {
    if (payment.isOnTime) {
      currentStreak += 1;
      totalOnTime += 1;
      
      // Check for level up
      const requiredForNext = LEVEL_CONFIG.levelRequirements[currentLevel];
      if (currentLevel < LEVEL_CONFIG.maxLevel && currentStreak >= requiredForNext) {
        currentLevel += 1;
        currentStreak = 0; // Reset for next level
      }
    } else {
      currentStreak = 0; // Reset streak on late payment
      totalLate += 1;
    }
  }

  return {
    level: currentLevel,
    streak: currentStreak,
    onTimePaid: totalOnTime,
    latePaid: totalLate,
    unlockedCap: LEVEL_CONFIG.levelCaps[currentLevel]
  };
}

/**
 * Get level progression simulation data (for demo purposes)
 */
function getLevelProgressionDemo(currentLevel) {
  const progressionSteps = [];
  
  for (let level = currentLevel; level < Math.min(currentLevel + 3, LEVEL_CONFIG.maxLevel); level++) {
    const nextLevel = level + 1;
    progressionSteps.push({
      fromLevel: level,
      toLevel: nextLevel,
      fromLevelName: LEVEL_CONFIG.levelNames[level],
      toLevelName: LEVEL_CONFIG.levelNames[nextLevel],
      fromCap: LEVEL_CONFIG.levelCaps[level],
      toCap: LEVEL_CONFIG.levelCaps[nextLevel],
      paymentsRequired: LEVEL_CONFIG.levelRequirements[level],
      newPerks: LEVEL_CONFIG.levelPerks[nextLevel] || [],
      capIncrease: LEVEL_CONFIG.levelCaps[nextLevel] - LEVEL_CONFIG.levelCaps[level]
    });
  }
  
  return progressionSteps;
}

/**
 * Get achievement milestones
 */
function getAchievementMilestones(levelInfo) {
  const milestones = [];
  
  // Payment streak milestones
  if (levelInfo.streak >= 5) {
    milestones.push({
      type: 'streak',
      title: 'Payment Streak Champion',
      description: `${levelInfo.streak} consecutive on-time payments`,
      icon: '🔥'
    });
  }
  
  // Level milestones
  if (levelInfo.currentLevel >= 5) {
    milestones.push({
      type: 'level',
      title: 'Elite Borrower',
      description: `Reached ${levelInfo.levelName} status`,
      icon: '💎'
    });
  }
  
  // Perfect payment record
  if (levelInfo.onTimeRate >= 0.95 && levelInfo.totalLoans >= 5) {
    milestones.push({
      type: 'reliability',
      title: 'Reliability Master',
      description: `${Math.round(levelInfo.onTimeRate * 100)}% on-time payment rate`,
      icon: '⭐'
    });
  }
  
  return milestones;
}

module.exports = {
  updateLevelProgress,
  getLevelInfo,
  getAllLevelConfigs,
  calculateLevelFromHistory,
  getLevelProgressionDemo,
  getAchievementMilestones,
  LEVEL_CONFIG
};