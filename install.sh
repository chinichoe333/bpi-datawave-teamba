#!/bin/bash

echo "🚀 LiwaywAI Prototype Installation"
echo "=================================="
echo "⚠️  PROTOTYPE - SIMULATION ONLY - NOT FOR PRODUCTION"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js 18+ first."
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.8+ first."
    exit 1
fi

# Get Python version
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "🐍 Detected Python version: $PYTHON_VERSION"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please ensure MongoDB is installed and running."
    echo "   You can install MongoDB Community Edition from: https://www.mongodb.com/try/download/community"
    echo "   Or use MongoDB Atlas cloud service."
    echo ""
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install ML service dependencies with better error handling
echo "📦 Installing ML service dependencies..."
cd ml-service

# Upgrade pip first
echo "🔧 Upgrading pip..."
python3 -m pip install --upgrade pip

# Try installing with different methods based on Python version
if [[ $(echo "$PYTHON_VERSION >= 3.12" | bc -l) -eq 1 ]]; then
    echo "🔧 Python 3.12+ detected, using compatibility mode..."
    # For Python 3.12+, install with no build isolation to avoid setuptools issues
    python3 -m pip install --no-build-isolation -r requirements.txt
else
    echo "🔧 Installing with standard method..."
    python3 -m pip install -r requirements.txt
fi

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "⚠️  Standard installation failed, trying alternative method..."
    echo "🔧 Installing packages individually..."
    
    # Install packages one by one with fallback versions
    python3 -m pip install "Flask>=2.3.0"
    python3 -m pip install "Flask-CORS>=4.0.0"
    python3 -m pip install "python-dotenv>=1.0.0"
    
    # Try numpy with different approaches
    if ! python3 -m pip install "numpy>=1.24.0"; then
        echo "🔧 Trying numpy with no binary..."
        python3 -m pip install numpy --no-binary=numpy
    fi
fi

cd ..

# Setup environment
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "✅ Created .env file. Please update with your MongoDB connection string."
else
    echo "✅ Environment file already exists."
fi

# Test Python dependencies
echo "🧪 Testing Python dependencies..."
cd ml-service
if python3 -c "import flask, flask_cors, numpy, dotenv; print('✅ All Python dependencies installed successfully!')" 2>/dev/null; then
    echo "✅ Python environment ready!"
else
    echo "⚠️  Some Python dependencies may have issues. You can still proceed, but the ML service might need manual setup."
fi
cd ..

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your MongoDB connection string"
echo "2. Start MongoDB service (or use MongoDB Atlas)"
echo "3. Run: npm run seed (to load demo data)"
echo "4. Run: npm run dev (to start all services)"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   ML Service: http://localhost:5001"
echo ""
echo "👤 Demo Accounts:"
echo "   Admin: admin@liwaywai.com / admin123"
echo "   Borrower: demo@borrower.com / password123"
echo ""
echo "⚠️  Remember: This is a PROTOTYPE for demonstration only!"