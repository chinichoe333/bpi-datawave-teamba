# Python Setup Guide for LiwaywAI

## If you encountered Python installation errors, follow this guide:

### Option 1: Manual Python Package Installation

```bash
# Navigate to ML service directory
cd ml-service

# Upgrade pip first
python3 -m pip install --upgrade pip

# Install packages individually
python3 -m pip install Flask
python3 -m pip install Flask-CORS
python3 -m pip install python-dotenv

# For numpy (try these in order until one works):
python3 -m pip install numpy
# OR if that fails:
python3 -m pip install --no-binary=numpy numpy
# OR if that fails:
python3 -m pip install numpy==1.24.3 --force-reinstall
```

### Option 2: Use Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Upgrade pip in virtual environment
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### Option 3: Use Simplified ML Service (No NumPy)

If numpy installation keeps failing, replace the `ml-service/app.py` file with this simplified version that doesn't require numpy:

```python
#!/usr/bin/env python3
"""
LiwaywAI ML Scoring Service - Simplified Version
Fallback version without numpy dependency
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

MODEL_VERSION = "champion-v1.0-simple"

class SimpleScorer:
    def __init__(self):
        self.model_version = MODEL_VERSION
        
    def extract_features(self, data):
        features = {}
        features['level'] = data.get('level', 0)
        features['streak'] = data.get('streak', 0)
        features['total_loans'] = data.get('totalLoans', 0)
        features['on_time_paid'] = data.get('onTimePaid', 0)
        features['amount'] = data.get('amount', 0)
        features['term_weeks'] = data.get('termWeeks', 4)
        
        features['on_time_rate'] = (
            features['on_time_paid'] / max(features['total_loans'], 1)
        )
        
        level_caps = {0: 500, 1: 750, 2: 1000, 3: 1250, 4: 1500, 
                     5: 2000, 6: 2500, 7: 3000, 8: 3500, 9: 4000, 10: 5000}
        unlocked_cap = level_caps.get(features['level'], 500)
        features['amount_to_cap_ratio'] = features['amount'] / unlocked_cap
        
        return features
    
    def calculate_pd(self, features):
        base_pd = 0.15
        level_adjustment = -0.02 * features['level']
        rate_adjustment = -0.1 * features['on_time_rate']
        amount_adjustment = 0.1 * features['amount_to_cap_ratio']
        
        pd = base_pd + level_adjustment + rate_adjustment + amount_adjustment
        pd += (random.random() - 0.5) * 0.05
        pd = max(0.01, min(0.95, pd))
        
        return pd
    
    def make_decision(self, features, pd):
        if features['amount_to_cap_ratio'] > 1.0:
            return 'decline'
        
        if pd <= 0.20:
            return 'approve'
        elif pd <= 0.35:
            if features['amount_to_cap_ratio'] > 0.8:
                return 'counter'
            else:
                return 'approve'
        else:
            return 'decline'
    
    def generate_reasons(self, features, pd, decision):
        reasons = []
        
        if decision == 'approve':
            if features['level'] >= 3:
                reasons.append('Strong borrower level (Level 3+)')
            if features['on_time_rate'] >= 0.9:
                reasons.append('Excellent repayment history (90%+ on-time)')
            if features['amount_to_cap_ratio'] <= 0.7:
                reasons.append('Conservative amount relative to limit')
        elif decision == 'decline':
            if features['amount_to_cap_ratio'] > 0.9:
                reasons.append('Amount too close to current limit')
            if features['on_time_rate'] < 0.7:
                reasons.append('Inconsistent repayment history')
        elif decision == 'counter':
            reasons.append('Partial approval based on current profile')
            
        return reasons if reasons else ['Standard policy assessment']
    
    def generate_counter_offer(self, features):
        if features['amount_to_cap_ratio'] > 0.8:
            level_caps = {0: 500, 1: 750, 2: 1000, 3: 1250, 4: 1500, 
                         5: 2000, 6: 2500, 7: 3000, 8: 3500, 9: 4000, 10: 5000}
            unlocked_cap = level_caps.get(features['level'], 500)
            counter_amount = int(unlocked_cap * 0.7)
            
            return {
                'amount': counter_amount,
                'termWeeks': min(features['term_weeks'], 6),
                'reason': 'Reduced amount and term for approval'
            }
        return None
    
    def score(self, data):
        try:
            features = self.extract_features(data)
            pd = self.calculate_pd(features)
            decision = self.make_decision(features, pd)
            reasons = self.generate_reasons(features, pd, decision)
            
            counter_offer = None
            if decision == 'counter':
                counter_offer = self.generate_counter_offer(features)
            
            counterfactual = None
            if decision == 'decline' and features['level'] < 5:
                next_level = features['level'] + 1
                counterfactual = f"Reach Level {next_level} with {next_level} consecutive on-time payments"
            
            return {
                'pd': round(pd, 4),
                'decision': decision,
                'reasons': reasons,
                'counter_offer': counter_offer,
                'counterfactual_hint': counterfactual,
                'model_version': self.model_version,
                'scored_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Scoring error: {str(e)}")
            raise

scorer = SimpleScorer()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_version': MODEL_VERSION,
        'timestamp': datetime.utcnow().isoformat(),
        'warning': 'PROTOTYPE - SIMULATION ONLY'
    })

@app.route('/score', methods=['POST'])
def score_application():
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        
        required_fields = ['loanId', 'userId', 'amount', 'termWeeks']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        result = scorer.score(data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Scoring endpoint error: {str(e)}")
        return jsonify({
            'error': 'Internal scoring error',
            'model_version': MODEL_VERSION
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
```

### Option 4: Skip ML Service (Use Fallback)

The backend has a built-in fallback mechanism. If the ML service is not running, it will make simple rule-based decisions. You can:

1. Skip the ML service installation entirely
2. Just run the frontend and backend:
   ```bash
   # In one terminal
   cd backend && npm run dev
   
   # In another terminal  
   cd frontend && npm run dev
   ```

## Testing Your Setup

### Test Python Dependencies:
```bash
cd ml-service
python3 -c "import flask, flask_cors; print('✅ Basic dependencies OK')"
python3 -c "import numpy; print('✅ NumPy OK')" # Optional
```

### Test ML Service:
```bash
cd ml-service
python3 app.py
```

Then in another terminal:
```bash
curl http://localhost:5001/health
```

## Common Issues and Solutions

### Issue: "Cannot import 'setuptools.build_meta'"
**Solution**: This is a Python 3.13 compatibility issue. Try:
```bash
python3 -m pip install --upgrade setuptools wheel
python3 -m pip install --no-build-isolation -r requirements.txt
```

### Issue: NumPy compilation errors
**Solution**: Use pre-compiled wheels:
```bash
python3 -m pip install --only-binary=all numpy
```

### Issue: Permission errors
**Solution**: Use user installation:
```bash
python3 -m pip install --user -r requirements.txt
```

### Issue: Multiple Python versions
**Solution**: Use specific Python version:
```bash
python3.11 -m pip install -r requirements.txt  # Use your preferred version
```

## Alternative: Docker Setup (Advanced)

If you continue having Python issues, you can run the ML service in Docker:

```dockerfile
# Create Dockerfile in ml-service directory
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app.py"]
```

```bash
# Build and run
cd ml-service
docker build -t liwaywai-ml .
docker run -p 5001:5001 liwaywai-ml
```