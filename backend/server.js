require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const borrowerRoutes = require('./routes/borrower');
const adminRoutes = require('./routes/admin');
const rpRoutes = require('./routes/rp');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prototype banner middleware
app.use((req, res, next) => {
  res.setHeader('X-Prototype-Warning', 'SIMULATION ONLY - NOT FOR PRODUCTION');
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/me', borrowerRoutes);
app.use('/loans', borrowerRoutes);
app.use('/admin', adminRoutes);
app.use('/rp', rpRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    warning: 'PROTOTYPE - SIMULATION ONLY'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    warning: 'PROTOTYPE - SIMULATION ONLY'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('⚠️  PROTOTYPE - SIMULATION ONLY - NOT FOR PRODUCTION');
});

module.exports = app;