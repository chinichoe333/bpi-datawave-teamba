const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User, Profile, Level, DigitalIdCard } = require('../models');
const { generateLiwaywaiId } = require('../utils/helpers');

const router = express.Router();

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  city: Joi.string().min(2).required(),
  occupation: Joi.string().min(2).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name, city, occupation } = value;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Create user
    const user = new User({
      email,
      password_hash,
      role: 'borrower'
    });
    await user.save();

    // Create profile
    const profile = new Profile({
      userId: user._id,
      name,
      city,
      occupation,
      kycLevel: 'basic'
    });
    await profile.save();

    // Initialize level
    const level = new Level({
      userId: user._id,
      level: 0,
      unlockedCap: 500,
      streak: 0
    });
    await level.save();

    // Auto-issue Digital ID Card
    const liwaywaiId = generateLiwaywaiId();
    const digitalId = new DigitalIdCard({
      userId: user._id,
      liwaywaiId,
      kycLevel: 'basic',
      levelSnapshot: 0,
      joinDate: new Date(),
      levelProgress: { completed: 0, required: 1 },
      capCurrent: 500,
      capNext: 750,
      policyVersionId: 'v1.0.0',
      consentSummary: []
    });
    await digitalId.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      digitalId: {
        liwaywaiId,
        level: 0,
        unlockedCap: 500
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;