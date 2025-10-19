"""
🧠 SmartDoc - Data Type Detector Trainer (Enhanced)
--------------------------------------------------
Trains a lightweight TF-IDF + Logistic Regression model to detect dataset domains.
This version is more robust for limited samples and includes a testing interface.
"""

import os
import re
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.calibration import CalibratedClassifierCV
from sklearn.utils.class_weight import compute_class_weight
import warnings
warnings.filterwarnings('ignore')

# --- Enhanced Configuration ---
MODEL_FILE = "data_type_model.pkl"
TRAINING_DATA_FILE = "training_data.json"
MIN_SAMPLES_FOR_STRATIFY = 5
MIN_SAMPLES_PER_CLASS_FOR_TEST = 2
CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence to trust prediction

# -----------------------------
# 1️⃣ Enhanced Training Samples (Expanded & Organized)
# -----------------------------
ENHANCED_TRAIN_DATA = [
    # HR (Human Resources) - Expanded
    ("employee name, department, designation, salary, join date", "hr"),
    ("emp_id, attendance, leave balance, bonus, payroll", "hr"),
    ("department, employee, hire date, position", "hr"),
    ("performance, rating, manager, team, promotion", "hr"),
    ("recruitment, candidate, interview, offer, onboarding", "hr"),
    ("training, skill, certification, development, career", "hr"),
    ("benefits, insurance, retirement, vacation, sick", "hr"),

    # Sales - Expanded
    ("customer, order_id, revenue, amount, region, date", "sales"),
    ("invoice, product, sales, target, achieved, profit", "sales"),
    ("client, amount, total sales, category, margin", "sales"),
    ("territory, quota, commission, pipeline, opportunity", "sales"),
    ("deal, stage, probability, forecast, close_date", "sales"),
    ("retention, churn, loyalty, satisfaction, feedback", "sales"),
    ("channel, partner, distributor, reseller, affiliate", "sales"),

    # Finance - Expanded
    ("invoice_no, account, balance, credit, debit, ledger", "finance"),
    ("expense, asset, liability, income, tax, gst, vat", "finance"),
    ("loan_id, principal, interest, emi, bank, payment", "finance"),
    ("budget, forecast, cashflow, revenue, expenditure", "finance"),
    ("investment, portfolio, stock, bond, dividend, yield", "finance"),
    ("audit, compliance, regulation, reporting, standard", "finance"),
    ("currency, exchange, rate, foreign, transaction", "finance"),

    # Personal Expense - Expanded
    ("date, category, expense, note, amount, payment_mode", "personal_expense"),
    ("fuel, groceries, utilities, rent, entertainment, total", "personal_expense"),
    ("budget, savings, investment, income, spending, limit", "personal_expense"),
    ("subscription, membership, fee, renewal, automatic", "personal_expense"),
    ("travel, transportation, accommodation, food, shopping", "personal_expense"),

    # Admin - Expanded
    ("office, policy, vendor, contract, compliance, approval", "admin"),
    ("asset_id, procurement, maintenance, vendor, status", "admin"),
    ("facility, location, building, floor, room, capacity", "admin"),
    ("document, record, archive, retention, disposal", "admin"),
    ("meeting, agenda, minutes, action, followup", "admin"),

    # Procurement - Expanded
    ("supplier, po_number, item, quantity, cost, delivery", "procurement"),
    ("vendor, purchase_order, invoice, payment, approval", "procurement"),
    ("rfq, quotation, bid, tender, evaluation, award", "procurement"),
    ("inventory, stock, reorder, level, warehouse, storage", "procurement"),
    ("contract, terms, conditions, renewal, termination", "procurement"),

    # Marketing - Expanded
    ("campaign, impressions, clicks, cpc, budget, reach", "marketing"),
    ("lead, conversion, ad_spend, roi, audience, platform", "marketing"),
    ("segment, demographic, geographic, behavior, psychographic", "marketing"),
    ("brand, awareness, perception, positioning, equity", "marketing"),
    ("social, media, engagement, share, like, comment", "marketing"),

    # IT - Expanded
    ("user, device, software, issue, ticket, resolution", "it"),
    ("server, uptime, ip, status, alert, network", "it"),
    ("security, firewall, antivirus, malware, breach", "it"),
    ("backup, recovery, disaster, backup, restore", "it"),
    ("license, subscription, renewal, compliance, audit", "it"),

    # Factory (Shop Floor Operations) - Expanded
    ("machine, shift, operator, output, downtime, maintenance", "factory"),
    ("batch, line, yield, defect, supervisor", "factory"),
    ("quality, inspection, defect, rejection, acceptance", "factory"),
    ("safety, incident, hazard, precaution, training", "factory"),
    ("efficiency, utilization, capacity, throughput, bottleneck", "factory"),

    # Manufacturing (Production Planning/Inventory) - Expanded
    ("production, raw_material, process, qc, wastage, batch", "manufacturing"),
    ("assembly, part_no, defect, inspection, completion", "manufacturing"),
    ("bom, component, subassembly, routing, operation", "manufacturing"),
    ("schedule, plan, forecast, capacity, constraint", "manufacturing"),
    ("supply, chain, logistics, distribution, delivery", "manufacturing"),

    # Personal Life - Expanded
    ("habit, goal, workout, sleep, mood, energy", "personal_life"),
    ("task, reflection, emotion, gratitude, journal", "personal_life"),
    ("health, fitness, nutrition, exercise, weight", "personal_life"),
    ("learning, course, skill, progress, achievement", "personal_life"),
    ("relationship, family, friend, contact, event", "personal_life"),

    # New Categories
    # Healthcare
    ("patient, diagnosis, treatment, medication, hospital", "healthcare"),
    ("appointment, doctor, specialist, prescription, test", "healthcare"),
    
    # Education
    ("student, grade, course, attendance, performance", "education"),
    ("teacher, subject, classroom, assignment, exam", "education"),
    
    # E-commerce
    ("product, sku, price, inventory, category, review", "ecommerce"),
    ("order, shipping, delivery, tracking, return", "ecommerce"),
    
    # Real Estate
    ("property, address, price, area, bedrooms, bathrooms", "real_estate"),
    ("lease, rent, tenant, landlord, contract, deposit", "real_estate"),
]

# -----------------------------
# 2️⃣ Enhanced Core Functions
# -----------------------------

def enhanced_preprocess(text):
    """Enhanced text preprocessing with better normalization."""
    text = text.lower().strip()
    
    # Remove special characters but keep meaningful separators
    text = re.sub(r"[^a-z0-9, _-]+", " ", text)
    
    # Normalize multiple spaces and commas
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r",\s*", ", ", text)
    
    return text.strip()

def save_training_data(data, file_path):
    """Save training data to JSON for persistence and manual editing."""
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"💾 Training data saved to: {file_path}")
    except Exception as e:
        print(f"❌ Failed to save training data: {e}")

def load_training_data(file_path):
    """Load training data from JSON file."""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"📝 No existing training data found at {file_path}, using default data.")
        return ENHANCED_TRAIN_DATA
    except Exception as e:
        print(f"❌ Error loading training data: {e}, using default data.")
        return ENHANCED_TRAIN_DATA

def analyze_class_distribution(labels):
    """Analyze and report class distribution."""
    label_series = pd.Series(labels)
    distribution = label_series.value_counts().sort_index()
    
    print("\n📊 Class Distribution Analysis:")
    print("=" * 40)
    for label, count in distribution.items():
        percentage = (count / len(labels)) * 100
        print(f"  {label:.<20} {count:>3} samples ({percentage:>5.1f}%)")
    
    print(f"\n  Total samples: {len(labels)}")
    print(f"  Unique classes: {len(distribution)}")
    
    return distribution

def enhanced_train_test_split(X, y, test_ratio=0.2, random_state=42):
    """Enhanced train/test split with better handling of small datasets."""
    
    y_series = pd.Series(y)
    class_counts = y_series.value_counts()
    
    print(f"📈 Dataset size: {len(y)} samples, {len(class_counts)} classes")
    
    # Dynamic test ratio adjustment based on dataset size
    if len(y) < 50:
        test_ratio = 0.15
    elif len(y) < 100:
        test_ratio = 0.18
    
    # Check if stratification is feasible
    can_stratify = all(count >= MIN_SAMPLES_FOR_STRATIFY for count in class_counts)
    
    # Ensure minimum samples in test set
    min_test_samples = max(2, int(len(y) * test_ratio))
    if min_test_samples < len(class_counts):
        test_ratio = len(class_counts) / len(y) * 1.5
        can_stratify = False
        print(f"⚠️  Adjusted test ratio to {test_ratio:.3f} to ensure minimum test samples")

    print(f"🔧 Splitting with test_size: {test_ratio:.3f}, stratify: {can_stratify}")

    if can_stratify:
        return train_test_split(X, y, test_size=test_ratio, random_state=random_state, stratify=y)
    else:
        print("ℹ️  Stratification disabled due to small class sizes")
        return train_test_split(X, y, test_size=test_ratio, random_state=random_state)

def train_and_save_model(data, model_path, training_data_path=None):
    """Enhanced training pipeline with better evaluation and model calibration."""
    
    # Save training data if path provided
    if training_data_path:
        save_training_data(data, training_data_path)
    
    texts = [enhanced_preprocess(t[0]) for t in data]
    labels = [t[1] for t in data]

    # Analyze class distribution
    distribution = analyze_class_distribution(labels)
    
    # --- Enhanced Vectorization ---
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),  # Extended to trigrams for better context
        max_features=1500,   # Increased features for better discrimination
        min_df=2,           # Ignore terms that appear in only 1 document
        max_df=0.8          # Ignore terms that appear in more than 80% of documents
    )
    X = vectorizer.fit_transform(texts)
    y = np.array(labels)
    
    print(f"🔡 Vectorizer features: {X.shape[1]}")

    # --- Enhanced Data Splitting ---
    Xtr, Xte, ytr, yte = enhanced_train_test_split(X, y)

    # --- Enhanced Model Training with Class Weights ---
    print("🚀 Starting enhanced model training...")
    
    # Compute class weights for imbalanced data
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(ytr),
        y=ytr
    )
    class_weight_dict = dict(zip(np.unique(ytr), class_weights))
    
    # Train with calibrated classifier for better probability estimates
    base_clf = LogisticRegression(
        max_iter=2000, 
        solver='lbfgs',
        multi_class='multinomial',
        class_weight=class_weight_dict,
        C=0.1  # Regularization strength
    )
    
    # Use calibration for better probability estimates
    clf = CalibratedClassifierCV(base_clf, method='sigmoid', cv=min(5, len(np.unique(ytr))))
    clf.fit(Xtr, ytr)
    
    print("✅ Enhanced training completed successfully.")

    # --- Comprehensive Evaluation ---
    ypred = clf.predict(Xte)
    yprob = clf.predict_proba(Xte)
    acc = accuracy_score(yte, ypred)
    
    # Calculate confidence statistics
    max_probs = np.max(yprob, axis=1)
    avg_confidence = np.mean(max_probs)
    low_confidence_count = np.sum(max_probs < CONFIDENCE_THRESHOLD)
    
    print("\n--- Enhanced Model Evaluation ---")
    print(f"📈 Model Accuracy (Test Set): {acc:.3f}")
    print(f"🎯 Average Confidence: {avg_confidence:.3f}")
    print(f"⚠️  Low-confidence predictions (<{CONFIDENCE_THRESHOLD}): {low_confidence_count}/{len(yte)}")
    
    try:
        print("\n📋 Classification Report:\n", classification_report(yte, ypred))
        
        # Cross-validation for more robust performance estimate
        if len(y) >= 20:  # Only run CV if we have enough data
            cv_scores = cross_val_score(clf, X, y, cv=min(5, len(np.unique(y))), scoring='accuracy')
            print(f"🔄 Cross-validation Accuracy: {np.mean(cv_scores):.3f} (+/- {np.std(cv_scores) * 2:.3f})")
            
    except Exception as e:
        print(f"📊 Evaluation detail limited due to: {e}")

    # --- Save Enhanced Model ---
    model_data = {
        "model": clf,
        "vectorizer": vectorizer,
        "classes": list(np.unique(y)),
        "training_info": {
            "training_samples": len(data),
            "accuracy": acc,
            "avg_confidence": avg_confidence,
            "feature_count": X.shape[1],
            "timestamp": pd.Timestamp.now().isoformat()
        }
    }
    
    joblib.dump(model_data, model_path)
    print(f"\n📦 Enhanced model saved to: {model_path}")
    
    return model_data

def predict_data_type(model_data, header_text, return_alternatives=3):
    """Enhanced prediction with confidence scores and alternative predictions."""
    clf = model_data["model"]
    vectorizer = model_data["vectorizer"]
    classes = model_data.get("classes", [])
    
    processed_text = enhanced_preprocess(header_text)
    X_test = vectorizer.transform([processed_text])
    
    prediction = clf.predict(X_test)[0]
    probabilities = clf.predict_proba(X_test)[0]
    confidence = np.max(probabilities)
    
    # Get top alternative predictions
    alternative_predictions = []
    if return_alternatives > 0 and len(classes) > 1:
        prob_class_pairs = list(zip(probabilities, classes))
        prob_class_pairs.sort(reverse=True)
        
        for i, (prob, cls) in enumerate(prob_class_pairs[1:return_alternatives+1], 1):
            if prob > 0.05:  # Only include meaningful alternatives
                alternative_predictions.append({
                    'type': cls,
                    'confidence': prob,
                    'rank': i
                })
    
    result = {
        'predicted_type': prediction,
        'confidence': confidence,
        'is_high_confidence': confidence >= CONFIDENCE_THRESHOLD,
        'alternatives': alternative_predictions,
        'processed_text': processed_text
    }
    
    return result

def load_model(model_path):
    """Safely load model with error handling."""
    try:
        model_data = joblib.load(model_path)
        print(f"✅ Model loaded successfully from {model_path}")
        print(f"📊 Model info: {model_data['training_info']['training_samples']} training samples, "
              f"accuracy: {model_data['training_info']['accuracy']:.3f}")
        return model_data
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None

def interactive_test_mode(model_data):
    """Interactive mode for testing the model."""
    print("\n🎯 Interactive Testing Mode")
    print("Type 'quit' to exit, 'help' for commands")
    
    while True:
        try:
            user_input = input("\n📥 Enter header text: ").strip()
            
            if user_input.lower() == 'quit':
                break
            elif user_input.lower() == 'help':
                print("Available commands:")
                print("  quit - Exit interactive mode")
                print("  help - Show this help")
                print("  Any other text will be classified")
                continue
            elif not user_input:
                continue
                
            result = predict_data_type(model_data, user_input)
            
            print(f"\n🔍 Results for: '{user_input}'")
            print(f"   Predicted: {result['predicted_type'].upper()}")
            print(f"   Confidence: {result['confidence']:.3f}")
            print(f"   Status: {'HIGH confidence' if result['is_high_confidence'] else 'LOW confidence'}")
            
            if result['alternatives']:
                print(f"   Alternatives:")
                for alt in result['alternatives']:
                    print(f"     {alt['rank']}. {alt['type']} ({alt['confidence']:.3f})")
                    
        except KeyboardInterrupt:
            print("\n👋 Exiting interactive mode.")
            break
        except Exception as e:
            print(f"❌ Error during prediction: {e}")

# -----------------------------
# 3️⃣ Enhanced Main Execution Block
# -----------------------------

if __name__ == "__main__":
    
    # Full paths for saving/loading
    MODEL_PATH = os.path.join(os.getcwd(), MODEL_FILE)
    TRAINING_PATH = os.path.join(os.getcwd(), TRAINING_DATA_FILE)
    
    print("🧠 SmartDoc Enhanced Data Type Detector")
    print("=" * 50)
    
    # Load or use training data
    training_data = load_training_data(TRAINING_PATH)
    
    # 1. Train and save the enhanced model
    print("\n🚀 Starting enhanced model training...")
    trained_model = train_and_save_model(training_data, MODEL_PATH, TRAINING_PATH)

    # 2. Comprehensive testing
    print("\n--- Comprehensive Model Testing ---")
    TEST_SAMPLES = [
        "product name, price, stock quantity, supplier_id, location",
        "date, amount_paid, vendor_name, check_number, description", 
        "click_through_rate, cpa, ad_group, creative_id, keywords",
        "calories, protein, fats, carbs, meal_type, feeling",
        "patient_id, diagnosis, treatment, medication, hospital",
        "student_name, grade, course, attendance, performance",
        "property_address, price, area, bedrooms, bathrooms",
    ]
    
    for sample in TEST_SAMPLES:
        result = predict_data_type(trained_model, sample)
        status_icon = "✅" if result['is_high_confidence'] else "⚠️ "
        print(f"{status_icon} '{sample[:50]}{'...' if len(sample) > 50 else ''}'")
        print(f"   → {result['predicted_type'].upper()} (conf: {result['confidence']:.3f})")
        
        if result['alternatives']:
            best_alt = result['alternatives'][0]
            print(f"   ≈ Alternative: {best_alt['type']} ({best_alt['confidence']:.3f})")

    # 3. Interactive testing mode
    print("\n" + "=" * 50)
    interactive_test_mode(trained_model)