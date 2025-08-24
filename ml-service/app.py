#!/usr/bin/env python3
"""
LiwaywAI ML Scoring Service
Champion model for explainable lending decisions
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Model version
MODEL_VERSION = "champion-v1.0"

class ChampionScorer:
    """
    Champion scoring model with explainable decisions
    Uses logistic regression-like rules for prototype
    """
    
    def __init__(self):
        self.model_version = MODEL_VERSION
        self.feature_weights = {
            'level': 0.15,
            'streak': 0.20,
            'amount_to_cap_ratio': -0.25,
            'total_loans': 0.10,
            'on_time_rate': 0.30,
            'kyc_level': 0.05,
            'term_weeks': -0.05
        }
        
    def extract_features(self, data):
        """Extract and engineer features from input data"""
        features = {}
        
        # Basic features
        features['level'] = data.get('level', 0)
        features['streak'] = data.get('streak', 0)
        features['total_loans'] = data.get('totalLoans', 0)
        features['on_time_paid'] = data.get('onTimePaid', 0)
        features['late_paid'] = data.get('latePaid', 0)
        features['amount'] = data.get('amount', 0)
        features['term_weeks'] = data.get('termWeeks', 4)
        
        # Derived features
        features['on_time_rate'] = (
            features['on_time_paid'] / max(features['total_loans'], 1)
        )
        
        # Get unlocked cap from level (simplified)
        level_caps = {0: 500, 1: 750, 2: 1000, 3: 1250, 4: 1500, 
                     5: 2000, 6: 2500, 7: 3000, 8: 3500, 9: 4000, 10: 5000}
        unlocked_cap = level_caps.get(features['level'], 500)
        features['amount_to_cap_ratio'] = features['amount'] / unlocked_cap
        
        # KYC level (basic=0, verified=1)
        profile = data.get('profile', {})
        features['kyc_level'] = 1 if profile.get('kycLevel') == 'verified' else 0
        
        return features
    
    def calculate_pd(self, features):
        """Calculate probability of default using weighted features"""
        
        # Special handling for new borrowers (Level 0, no history)
        if features['level'] == 0 and features['total_loans'] == 0:
            # New borrowers get favorable treatment for small amounts
            if features['amount_to_cap_ratio'] <= 0.6:
                return 0.15  # Low risk for conservative amounts
            elif features['amount_to_cap_ratio'] <= 0.8:
                return 0.25  # Medium risk
            else:
                return 0.35  # Higher risk but still approvable
        
        # Base PD
        base_pd = 0.15
        
        # Calculate weighted score
        score = 0
        for feature, weight in self.feature_weights.items():
            if feature in features:
                score += features[feature] * weight
        
        # Convert to probability using logistic function
        pd = 1 / (1 + np.exp(-(-score + 0.5)))  # Adjusted for reasonable range
        
        # Clamp to reasonable range
        pd = max(0.01, min(0.95, pd))
        
        return pd
    
    def generate_reasons(self, features, pd, decision):
        """Generate explainable reason codes"""
        reasons = []
        
        if decision == 'approve':
            if features['level'] == 0 and features['total_loans'] == 0:
                reasons.append('Welcome! First loan approved for new borrower')
                if features['amount_to_cap_ratio'] <= 0.6:
                    reasons.append('Conservative amount shows responsible borrowing')
                if features['kyc_level'] == 1:
                    reasons.append('Verified identity provides additional confidence')
            elif features['level'] >= 3:
                reasons.append('Strong borrower level (Level 3+)')
            if features['on_time_rate'] >= 0.9:
                reasons.append('Excellent repayment history (90%+ on-time)')
            if features['streak'] >= 3:
                reasons.append('Consistent payment streak')
            if features['amount_to_cap_ratio'] <= 0.7:
                reasons.append('Conservative amount relative to limit')
            if pd <= 0.25:
                reasons.append('Low to medium risk assessment')
                
        elif decision == 'decline':
            if features['amount_to_cap_ratio'] > 0.9:
                reasons.append('Amount too close to current limit')
            if features['on_time_rate'] < 0.5 and features['total_loans'] > 0:
                reasons.append('Inconsistent repayment history')
            if features['level'] == 0 and features['total_loans'] == 0 and features['amount_to_cap_ratio'] > 0.9:
                reasons.append('New borrower - please start with smaller amount')
            if pd > 0.5:
                reasons.append('High risk assessment')
                
        elif decision == 'counter':
            if features['amount_to_cap_ratio'] > 0.8:
                reasons.append('Reduced amount within comfort zone')
            if features['term_weeks'] > 8:
                reasons.append('Shorter term recommended')
            reasons.append('Partial approval based on current profile')
        
        # Default reason if none generated
        if not reasons:
            reasons.append('Standard policy assessment')
            
        return reasons
    
    def generate_counterfactual(self, features, decision):
        """Generate counterfactual explanation"""
        if decision == 'decline':
            if features['level'] == 0 and features['total_loans'] == 0:
                safe_amount = int(features['amount'] * 0.6)
                return f"As a new borrower, try applying for ₱{safe_amount} to get started and build your credit history"
            elif features['level'] < 5:
                next_level = features['level'] + 1
                return f"Reach Level {next_level} with {next_level} consecutive on-time payments to unlock higher limits"
            elif features['on_time_rate'] < 0.8:
                return "Improve repayment consistency to 80%+ for better approval odds"
            elif features['amount_to_cap_ratio'] > 0.9:
                safe_amount = int(features['amount'] * 0.7)
                return f"Consider applying for ₱{safe_amount} for higher approval probability"
        elif decision == 'counter':
            return "Counter-offer provided with adjusted terms for better approval odds"
        
        return None
    
    def make_decision(self, features, pd):
        """Make lending decision based on PD and business rules"""
        
        # Hard rules first
        if features['amount_to_cap_ratio'] > 1.0:
            return 'decline'
        
        # Special approval logic for new borrowers
        if features['level'] == 0 and features['total_loans'] == 0:
            if features['amount_to_cap_ratio'] <= 0.8:
                return 'approve'  # Approve new borrowers for reasonable amounts
            else:
                return 'counter'  # Counter-offer for high amounts
        
        # PD-based decision thresholds for existing borrowers
        if pd <= 0.25:  # More lenient threshold
            return 'approve'
        elif pd <= 0.40:  # Extended counter-offer range
            # Counter-offer logic
            if features['amount_to_cap_ratio'] > 0.8:
                return 'counter'
            else:
                return 'approve'
        else:
            return 'decline'
    
    def generate_counter_offer(self, features):
        """Generate counter-offer terms"""
        level_caps = {0: 500, 1: 750, 2: 1000, 3: 1250, 4: 1500, 
                     5: 2000, 6: 2500, 7: 3000, 8: 3500, 9: 4000, 10: 5000}
        unlocked_cap = level_caps.get(features['level'], 500)
        
        if features['level'] == 0 and features['total_loans'] == 0:
            # New borrowers get 60% of cap as counter-offer
            counter_amount = int(unlocked_cap * 0.6)
            return {
                'amount': counter_amount,
                'termWeeks': min(features['term_weeks'], 8),  # Reasonable term
                'reason': 'Welcome offer for new borrower - build your credit history!'
            }
        elif features['amount_to_cap_ratio'] > 0.8:
            # Existing borrowers get 70% of cap
            counter_amount = int(unlocked_cap * 0.7)
            return {
                'amount': counter_amount,
                'termWeeks': min(features['term_weeks'], 6),  # Shorter term
                'reason': 'Reduced amount and term for approval'
            }
        
        return None
    
    def score(self, data):
        """Main scoring function"""
        try:
            # Extract features
            features = self.extract_features(data)
            
            # Calculate PD
            pd = self.calculate_pd(features)
            
            # Make decision
            decision = self.make_decision(features, pd)
            
            # Generate explanations
            reasons = self.generate_reasons(features, pd, decision)
            counterfactual = self.generate_counterfactual(features, decision)
            
            # Generate counter-offer if applicable
            counter_offer = None
            if decision == 'counter':
                counter_offer = self.generate_counter_offer(features)
            
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

# Initialize scorer
scorer = ChampionScorer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_version': MODEL_VERSION,
        'timestamp': datetime.utcnow().isoformat(),
        'warning': 'PROTOTYPE - SIMULATION ONLY'
    })

@app.route('/score', methods=['POST'])
def score_application():
    """Score loan application"""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        
        # Required fields validation
        required_fields = ['loanId', 'userId', 'amount', 'termWeeks']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Log scoring request (without PII)
        logger.info(f"Scoring request for loan {data['loanId']}, amount: {data['amount']}")
        
        # Score the application
        result = scorer.score(data)
        
        logger.info(f"Scoring result for loan {data['loanId']}: {result['decision']} (PD: {result['pd']})")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Scoring endpoint error: {str(e)}")
        return jsonify({
            'error': 'Internal scoring error',
            'model_version': MODEL_VERSION
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        'model_version': MODEL_VERSION,
        'model_type': 'Champion Logistic Regression',
        'features': list(scorer.feature_weights.keys()),
        'decision_thresholds': {
            'approve': '≤ 0.20 PD',
            'counter': '0.20 < PD ≤ 0.35',
            'decline': '> 0.35 PD'
        },
        'warning': 'PROTOTYPE - SIMULATION ONLY'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print("🤖 LiwaywAI ML Service Starting...")
    print(f"📊 Model Version: {MODEL_VERSION}")
    print("⚠️  PROTOTYPE - SIMULATION ONLY")
    
    app.run(host='0.0.0.0', port=port, debug=debug)