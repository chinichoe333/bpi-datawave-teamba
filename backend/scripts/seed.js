require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { 
  User, Profile, Level, DigitalIdCard, Loan, 
  DecisionLedger, RiskScore, PolicyVersion 
} = require('../models');
const { generateLiwaywaiId, getLevelCaps } = require('../utils/helpers');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Level.deleteMany({}),
      DigitalIdCard.deleteMany({}),
      Loan.deleteMany({}),
      DecisionLedger.deleteMany({}),
      RiskScore.deleteMany({}),
      PolicyVersion.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create policy version
    const policyVersion = new PolicyVersion({
      version: 'v1.0.0',
      paramsJSON: JSON.stringify({
        levelCaps: getLevelCaps(),
        streakRequirements: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10 },
        pdThresholds: { approve: 0.20, counter: 0.35 },
        oneActiveLoan: true,
        maxLoanTerm: 52
      }),
      isActive: true
    });
    await policyVersion.save();
    console.log('📋 Created policy version');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@liwaywai.com',
      password_hash: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('👤 Created admin user');

    // Create demo borrowers with different levels
    const borrowers = [
      {
        email: 'demo@borrower.com',
        name: 'Maria Santos',
        city: 'Manila',
        occupation: 'Teacher',
        level: 0,
        streak: 0,
        totalLoans: 0,
        onTimePaid: 0,
        latePaid: 0
      },
      {
        email: 'level3@demo.com',
        name: 'Juan Dela Cruz',
        city: 'Quezon City',
        occupation: 'Engineer',
        level: 3,
        streak: 3,
        totalLoans: 5,
        onTimePaid: 5,
        latePaid: 0
      },
      {
        email: 'level6@demo.com',
        name: 'Ana Rodriguez',
        city: 'Cebu',
        occupation: 'Nurse',
        level: 6,
        streak: 6,
        totalLoans: 12,
        onTimePaid: 11,
        latePaid: 1
      },
      {
        email: 'level9@demo.com',
        name: 'Carlos Mendoza',
        city: 'Davao',
        occupation: 'Business Owner',
        level: 9,
        streak: 9,
        totalLoans: 20,
        onTimePaid: 19,
        latePaid: 1
      }
    ];

    const password = await bcrypt.hash('password123', 10);
    const caps = getLevelCaps();

    for (const borrowerData of borrowers) {
      // Create user
      const user = new User({
        email: borrowerData.email,
        password_hash: password,
        role: 'borrower'
      });
      await user.save();

      // Create profile
      const profile = new Profile({
        userId: user._id,
        name: borrowerData.name,
        city: borrowerData.city,
        occupation: borrowerData.occupation,
        kycLevel: borrowerData.level >= 3 ? 'verified' : 'basic'
      });
      await profile.save();

      // Create level
      const level = new Level({
        userId: user._id,
        level: borrowerData.level,
        unlockedCap: caps[borrowerData.level],
        streak: borrowerData.streak,
        totalLoans: borrowerData.totalLoans,
        onTimePaid: borrowerData.onTimePaid,
        latePaid: borrowerData.latePaid
      });
      await level.save();

      // Create digital ID
      const digitalId = new DigitalIdCard({
        userId: user._id,
        liwaywaiId: generateLiwaywaiId(),
        kycLevel: profile.kycLevel,
        levelSnapshot: borrowerData.level,
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        levelProgress: {
          completed: borrowerData.streak,
          required: Math.min(borrowerData.level + 1, 10)
        },
        capCurrent: caps[borrowerData.level],
        capNext: caps[Math.min(borrowerData.level + 1, 10)],
        policyVersionId: 'v1.0.0',
        consentSummary: ['data_processing', 'credit_check', 'marketing']
      });
      await digitalId.save();

      // Create sample loans for higher level users
      if (borrowerData.level > 0) {
        const loanCount = Math.min(borrowerData.totalLoans, 3); // Create up to 3 sample loans
        
        for (let i = 0; i < loanCount; i++) {
          const loanAmount = Math.floor(Math.random() * caps[borrowerData.level] * 0.8) + 200;
          const decisions = ['approved', 'completed'];
          const status = i === 0 ? 'completed' : decisions[Math.floor(Math.random() * decisions.length)];
          
          const loan = new Loan({
            userId: user._id,
            amount: loanAmount,
            termWeeks: Math.floor(Math.random() * 8) + 4,
            purpose: ['Emergency expenses', 'Business capital', 'Education', 'Medical bills'][Math.floor(Math.random() * 4)],
            status,
            levelAtApply: Math.max(0, borrowerData.level - i),
            createdAt: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000), // Spread over months
            approvedAt: status !== 'applied' ? new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000) : null,
            completedAt: status === 'completed' ? new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000) : null
          });
          await loan.save();

          // Create decision ledger
          const pd = 0.05 + Math.random() * 0.15; // Low to medium risk
          const decisionLedger = new DecisionLedger({
            loanId: loan._id,
            inputsJSON: JSON.stringify({
              amount: loanAmount,
              level: borrowerData.level,
              streak: borrowerData.streak,
              onTimeRate: borrowerData.totalLoans > 0 ? borrowerData.onTimePaid / borrowerData.totalLoans : 1
            }),
            modelVersion: 'champion-v1.0',
            policyVersion: 'v1.0.0',
            decision: 'approve',
            reasons: ['Strong borrower level', 'Excellent repayment history', 'Conservative amount'],
            decidedAt: loan.createdAt
          });
          await decisionLedger.save();

          // Create risk score
          const riskScore = new RiskScore({
            loanId: loan._id,
            pd,
            reasons: decisionLedger.reasons,
            counterfactualHint: null,
            modelVersion: 'champion-v1.0'
          });
          await riskScore.save();

          // Link decision to loan
          loan.decisionId = decisionLedger._id;
          await loan.save();
        }
      }

      console.log(`✅ Created borrower: ${borrowerData.name} (Level ${borrowerData.level})`);
    }

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('Admin: admin@liwaywai.com / admin123');
    console.log('Borrower L0: demo@borrower.com / password123');
    console.log('Borrower L3: level3@demo.com / password123');
    console.log('Borrower L6: level6@demo.com / password123');
    console.log('Borrower L9: level9@demo.com / password123');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedData();