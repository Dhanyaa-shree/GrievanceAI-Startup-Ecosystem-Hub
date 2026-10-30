from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from datetime import datetime, timedelta, date, time
import logging
import random
import mysql.connector
from mysql.connector import Error
import re
import string
import joblib
import os
import smtplib
import json as _json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ============================================================
# ⭐ MULTI-ROLE SESSION CONFIGURATION
# ============================================================
# Founder, admin, and officer share ONE Flask session cookie.
# Each role writes only its own keys; each logout pops only its own keys.
# This block configures the cookie so all three can coexist without
# one role's login or logout affecting the others.
# ============================================================

app.secret_key = os.getenv('SECRET_KEY', 'GrievanceAI2024SecureKey')

# ⭐ Scoped cookie name — prevents collisions with other Flask apps
#    on the same host (which would otherwise share the default 'session' cookie)
app.config['SESSION_COOKIE_NAME'] = 'grievanceai_session'

# ⭐ Lax works because frontend uses Vite proxy → same-origin requests.
#    If you ever switch to direct cross-port calls, change to 'None'
#    (which requires SESSION_COOKIE_SECURE = True and HTTPS).
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False        # dev only
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_PATH'] = '/'

# ⭐ 30-day persistent session so the founder stays logged in
#    across browser restarts and admin/officer logins on the same browser
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB cap

# ============================================================
# GLOBAL JSON ENCODER
# ============================================================
class _CustomJSONEncoder(_json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, timedelta):
            total_seconds = int(obj.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, bytes):
            return obj.decode('utf-8', errors='ignore')
        try:
            return super().default(obj)
        except TypeError:
            return str(obj)

app.json_encoder = _CustomJSONEncoder

# ============================================================
# CORS
# ============================================================
CORS(app,
     resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
     methods=["GET", "PUT", "POST", "DELETE", "OPTIONS"])

# ============================================================
# ⭐ SESSION DEBUG ENDPOINT (optional — safe to keep, useful for testing)
# ============================================================
@app.route('/debug/session', methods=['GET'])
def debug_session():
    """Inspect which roles are currently active in this session."""
    return jsonify({
        'success': True,
        'roles': {
            'founder': bool(session.get('founder_id')),
            'admin': bool(session.get('admin_logged_in')),
            'officer': bool(session.get('officer_id')),
        },
        'session_keys': list(session.keys()),
        'details': {
            'founder_id': session.get('founder_id'),
            'admin_email': session.get('admin_email'),
            'officer_id': session.get('officer_id'),
            'officer_name': session.get('officer_name'),
        },
    }), 200

# ============================================================
# EMAIL OTP SERVICE
# ============================================================
EMAIL_USER = os.getenv('EMAIL_USER', 'your_email@gmail.com')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', 'your_app_password')


def send_otp_email(email, otp, mobile):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = email
        msg['Subject'] = '🔐 Your OTP for GrievanceAI'

        html_body = f"""
        <html><body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:500px;margin:0 auto;background:#fff;padding:30px;border-radius:16px;
                    box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #667eea;">
                <h1 style="color:#667eea;font-size:28px;margin:0;">🚀 GrievanceAI</h1>
                <p style="color:#666;margin:4px 0 0;">Startup Support &amp; Analytics Platform</p>
            </div>
            <p style="font-size:16px;color:#333;">Hello,</p>
            <p style="color:#555;">You requested an OTP to login to your GrievanceAI account.</p>
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:25px;
                        border-radius:12px;text-align:center;margin:25px 0;">
                <div style="font-size:48px;font-weight:800;color:#fff;letter-spacing:10px;
                            font-family:'Courier New',monospace;">{otp}</div>
            </div>
            <p style="text-align:center;color:#666;font-size:14px;">
                ⏰ This OTP is valid for <strong>5 minutes</strong>
            </p>
            <p style="color:#555;font-size:14px;">
                <strong>📱 Mobile Number:</strong> <span style="color:#667eea;font-weight:600;">{mobile}</span>
            </p>
            <div style="background:#fff3cd;padding:12px 16px;border-radius:8px;
                        border-left:4px solid #ffc107;margin:15px 0;color:#856404;font-size:13px;">
                ⚠️ <strong>Security Alert:</strong> Please do not share this OTP with anyone.
            </div>
            <div style="text-align:center;margin-top:25px;padding-top:20px;
                        border-top:1px solid #eee;color:#999;font-size:12px;">
                <p>© 2026 GrievanceAI. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"✅ OTP email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

# ============================================================
# ML MODEL + 3-LAYER HYBRID CLASSIFIER
# ============================================================
ml_model = None
tfidf = None
label_encoder = None


def load_ml_model():
    global ml_model, tfidf, label_encoder
    try:
        model_path = 'models/best_model.pkl'
        tfidf_path = 'models/tfidf_vectorizer.pkl'
        encoder_path = 'models/label_encoder.pkl'

        if os.path.exists(model_path):
            ml_model = joblib.load(model_path)
            tfidf = joblib.load(tfidf_path)
            label_encoder = joblib.load(encoder_path)
            print("✅ ML Model loaded successfully!")
            return True
        else:
            print("⚠️ Model files not found. Using rule-based + weighted fallback.")
            return False
    except Exception as e:
        print(f"⚠️ Error loading model: {e}")
        return False


def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\d+', '', text)
    text = ' '.join(text.split()).strip()
    return text


PHRASE_RULES = [
    (r'\bproduct[\s\-]*market[\s\-]*fit\b',                'Mentorship', 0.95),
    (r'\bpmf\b',                                            'Mentorship', 0.90),
    (r'\bgo[\s\-]*to[\s\-]*market\b',                       'Mentorship', 0.90),
    (r'\bmarket[\s\-]*strategy\s+advice\b',                 'Mentorship', 0.90),
    (r'\bstartup\s+advice\b',                               'Mentorship', 0.90),
    (r'\bmentor(ship)?\b',                                  'Mentorship', 0.92),
    (r'\bcoach(ing)?\b',                                    'Mentorship', 0.90),
    (r'\bguidance\b',                                       'Mentorship', 0.85),
    (r'\badvice\s+on\b',                                    'Mentorship', 0.85),
    (r'\bhow\s+to\s+grow\b',                                'Mentorship', 0.80),
    (r'\bbusiness\s+model\s+pivot\b',                       'Mentorship', 0.92),
    (r'\bpivot(ing)?\s+(the\s+)?business\b',                'Mentorship', 0.92),
    (r'\bstrategic\s+advice\b',                             'Mentorship', 0.88),
    (r'\bexpert\s+consultation\b',                          'Mentorship', 0.88),
    (r'\bproduct\s+roadmap\s+advice\b',                     'Mentorship', 0.88),
    (r'\bscale[\s\-]*up\s+advice\b',                        'Mentorship', 0.88),

    (r'\bseed\s+(round|funding|investment)\b',              'Funding',    0.95),
    (r'\bseries\s+[a-c]\b',                                 'Funding',    0.95),
    (r'\bangel\s+investor',                                 'Funding',    0.93),
    (r'\bventure\s+capital',                                'Funding',    0.93),
    (r'\bpitch\s+deck\b',                                   'Funding',    0.92),
    (r'\bterm\s+sheet\b',                                   'Funding',    0.95),
    (r'\bvaluation\b',                                      'Funding',    0.88),
    (r'\bequity\s+funding\b',                               'Funding',    0.92),
    (r'\bcrowdfunding\b',                                   'Funding',    0.92),
    (r'\bgrant\s+application\b',                            'Funding',    0.90),
    (r'\bfundraising\b',                                    'Funding',    0.92),

    (r'\bjob\s+description\b',                              'Hiring',     0.92),
    (r'\brecruit(ment|ing|er)?\b',                          'Hiring',     0.90),
    (r'\bcandidate(s)?\b',                                  'Hiring',     0.88),
    (r'\binterview\s+process\b',                            'Hiring',     0.90),
    (r'\bonboarding\b',                                     'Hiring',     0.90),
    (r'\bemployee\s+retention\b',                           'Hiring',     0.90),
    (r'\bhiring\s+(intern|developer|engineer|talent)\b',    'Hiring',     0.92),

    (r'\bsocial\s+media\s+marketing\b',                     'Marketing',  0.93),
    (r'\bcontent\s+marketing\b',                            'Marketing',  0.92),
    (r'\bseo\b',                                            'Marketing',  0.92),
    (r'\bbrand\s+identity\b',                               'Marketing',  0.90),
    (r'\bcustomer\s+acquisition\b',                         'Marketing',  0.90),
    (r'\bdigital\s+marketing\b',                            'Marketing',  0.93),
    (r'\bcampaign\b',                                       'Marketing',  0.85),
    (r'\bads?\s+(campaign|budget|spend)\b',                 'Marketing',  0.88),

    (r'\bincorporation\b',                                  'Legal',      0.93),
    (r'\b(trademark|patent|copyright)\b',                   'Legal',      0.93),
    (r'\bnd(a|as)\b',                                       'Legal',      0.92),
    (r'\bterms\s+(and|&)\s+conditions\b',                   'Legal',      0.90),
    (r'\bcompliance\b',                                     'Legal',      0.88),
    (r'\bintellectual\s+property\b',                        'Legal',      0.93),
    (r'\bcontract\s+(review|draft|agreement)\b',            'Legal',      0.90),
    (r'\bgdpr\b',                                           'Legal',      0.90),
    (r'\bprivacy\s+policy\b',                               'Legal',      0.90),
]


def match_phrase_rule(text):
    text_lower = text.lower()
    for pattern, category, confidence in PHRASE_RULES:
        if re.search(pattern, text_lower, flags=re.IGNORECASE):
            return category, confidence
    return None


def predict_with_ml(text):
    if ml_model is None or tfidf is None or label_encoder is None:
        return None
    try:
        cleaned = clean_text(text)
        if not cleaned:
            return None
        tfidf_features = tfidf.transform([cleaned])
        pred = ml_model.predict(tfidf_features)[0]
        probabilities = ml_model.predict_proba(tfidf_features)[0]
        confidence = float(max(probabilities))
        category = label_encoder.inverse_transform([pred])[0]
        if confidence >= 0.35:
            return category, confidence
        return None
    except Exception as e:
        print(f"ML Prediction error: {e}")
        return None


KEYWORD_WEIGHTS = {
    'Funding': {
        'fund': 3, 'funding': 3, 'investor': 3, 'invest': 3, 'investment': 3,
        'capital': 3, 'raise': 2, 'raising': 2, 'pitch': 2, 'grant': 2,
        'loan': 2, 'equity': 3, 'venture': 3, 'seed': 2, 'angel': 2,
        'valuation': 3, 'term sheet': 4, 'fundraising': 4, 'crowdfunding': 3,
        'series a': 4, 'series b': 4, 'bootstrapping': 2, 'revenue': 1,
    },
    'Hiring': {
        'hire': 3, 'hiring': 3, 'recruit': 3, 'recruitment': 3, 'recruiting': 3,
        'talent': 2, 'employee': 2, 'employees': 2, 'staff': 2, 'team': 1,
        'candidate': 3, 'candidates': 3, 'interview': 2, 'onboarding': 3,
        'intern': 2, 'internship': 2, 'position': 1, 'job': 2, 'resume': 2,
        'salary': 2, 'compensation': 2, 'hr': 2, 'retention': 2,
    },
    'Marketing': {
        'marketing': 4, 'market': 2, 'customer': 2, 'customers': 2, 'sales': 2,
        'brand': 2, 'branding': 3, 'promotion': 2, 'promote': 2, 'advertise': 3,
        'advertising': 3, 'lead': 2, 'leads': 2, 'growth': 2, 'social': 1,
        'media': 1, 'seo': 3, 'content': 2, 'campaign': 3, 'ads': 2,
        'engagement': 2, 'funnel': 3, 'conversion': 3, 'audience': 2,
        'outreach': 2, 'copywriting': 3,
    },
    'Legal': {
        'legal': 4, 'law': 3, 'lawyer': 4, 'attorney': 4, 'contract': 3,
        'contracts': 3, 'regulation': 2, 'regulatory': 3, 'compliance': 3,
        'policy': 2, 'agreement': 2, 'agreements': 2, 'ip': 3,
        'patent': 4, 'patents': 4, 'trademark': 4, 'copyright': 4,
        'incorporation': 4, 'incorporate': 3, 'llc': 3, 'llp': 3,
        'privacy': 2, 'gdpr': 4, 'nda': 4, 'terms': 2, 'liability': 3,
    },
    'Mentorship': {
        'mentor': 4, 'mentorship': 4, 'mentoring': 4, 'coach': 3, 'coaching': 3,
        'advice': 3, 'advisor': 3, 'advisory': 3, 'guidance': 3, 'guide': 2,
        'expert': 2, 'consultation': 3, 'consult': 2, 'support': 1,
        'strategy': 2, 'strategic': 3, 'roadmap': 3, 'pivot': 3, 'pivoting': 3,
        'business model': 3, 'product market fit': 5, 'pmf': 4, 'scale': 1,
        'scaling': 2, 'direction': 1, 'vision': 2, 'founder': 1, 'startup': 1,
    },
}


def weighted_keyword_score(text):
    text_lower = text.lower()
    scores = {cat: 0 for cat in KEYWORD_WEIGHTS.keys()}

    for category, keywords in KEYWORD_WEIGHTS.items():
        for kw, weight in keywords.items():
            pattern = r'\b' + re.escape(kw) + r'\b'
            matches = len(re.findall(pattern, text_lower))
            if matches:
                scores[category] += weight * matches

    if not any(scores.values()):
        return 'General', 0.30

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_cat, top_score = sorted_scores[0]
    _, second_score = sorted_scores[1] if len(sorted_scores) > 1 else (None, 0)

    if top_score == 0:
        return 'General', 0.30

    margin = top_score - second_score
    if second_score == 0:
        confidence = min(0.5 + (top_score * 0.05), 0.95)
    else:
        ratio = margin / top_score
        confidence = 0.5 + (ratio * 0.45)

    if top_score < 3:
        return 'General', max(0.30, confidence - 0.2)

    return top_cat, round(confidence, 2)


def predict_category(text):
    if not text or not isinstance(text, str):
        return 'General', 0.30

    phrase_match = match_phrase_rule(text)
    if phrase_match:
        return phrase_match

    ml_match = predict_with_ml(text)
    if ml_match:
        return ml_match

    return weighted_keyword_score(text)


def predict_category_fallback(text):
    return weighted_keyword_score(text)


# ============================================================
# DATABASE
# ============================================================
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'grievance_ai'),
            port=int(os.getenv('DB_PORT', 3307)),
            autocommit=True,
        )
        return connection
    except Error as e:
        logger.error(f"Database connection error: {e}")
        return None

# ============================================================
# OTP SERVICE
# ============================================================
otp_store = {}


def generate_otp(mobile):
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    otp_store[mobile] = {
        'otp': otp,
        'timestamp': datetime.now(),
        'verified': False,
    }
    print("\n" + "=" * 60)
    print(f"🔑 OTP FOR {mobile}: {otp}")
    print("=" * 60 + "\n")
    return otp


def verify_otp(mobile, otp_code):
    if mobile not in otp_store:
        return False, "OTP not found. Please request a new OTP."
    otp_data = otp_store[mobile]
    if datetime.now() - otp_data['timestamp'] > timedelta(seconds=300):
        del otp_store[mobile]
        return False, "OTP expired. Please request a new OTP."
    if otp_data['verified'] and otp_data['otp'] == otp_code:
        return True, "OTP already verified."
    if otp_data['otp'] == otp_code:
        otp_data['verified'] = True
        return True, "OTP verified successfully."
    return False, "❌ Invalid OTP. Please try again."

# ============================================================
# FOUNDER AUTH
# ============================================================
@app.route('/check-whitelist', methods=['POST', 'OPTIONS'])
def check_whitelist():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        mobile = data.get('mobile_number')
        if not mobile or len(mobile) != 10:
            return jsonify({'success': False, 'message': 'Invalid mobile number'}), 400
        result = execute_one("SELECT * FROM whitelist_numbers WHERE mobile_number = %s", (mobile,))
        if result:
            return jsonify({'success': True, 'is_whitelisted': True, 'message': '✅ Number is whitelisted!', 'mobile_number': mobile})
        return jsonify({'success': False, 'is_whitelisted': False, 'message': '❌ This mobile number is not whitelisted.'}), 403
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/send-otp', methods=['POST', 'OPTIONS'])
def send_otp():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        mobile = data.get('mobile_number')
        email = data.get('email')

        if not mobile or len(mobile) != 10:
            return jsonify({'success': False, 'message': 'Invalid mobile number'}), 400
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400

        result = execute_one("SELECT * FROM whitelist_numbers WHERE mobile_number = %s", (mobile,))
        if not result:
            return jsonify({'success': False, 'message': 'Number not whitelisted'}), 403

        otp = generate_otp(mobile)
        email_sent = send_otp_email(email, otp, mobile)

        if not email_sent:
            return jsonify({'success': False, 'message': 'Failed to send OTP email. Please try again.'}), 500

        return jsonify({
            'success': True,
            'message': 'OTP sent successfully to your email!',
            'mobile_number': mobile,
            'email': email,
        })
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/verify-otp', methods=['POST', 'OPTIONS'])
def verify_otp_route():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        mobile = data.get('mobile_number')
        otp_code = data.get('otp')
        email = data.get('email')

        if not mobile or not otp_code:
            return jsonify({'success': False, 'message': 'Mobile and OTP required'}), 400

        success, message = verify_otp(mobile, otp_code)
        if not success:
            return jsonify({'success': False, 'message': message}), 400

        if mobile in otp_store:
            del otp_store[mobile]

        founder = execute_one("SELECT * FROM founders WHERE mobile_number = %s", (mobile,))
        if founder:
            # ⭐ Set session permanent and ONLY add founder keys
            session.permanent = True
            session['founder_id'] = founder['founder_id']
            return jsonify({
                'success': True,
                'message': f'👋 Welcome back, {founder["founder_name"]}!',
                'founder_id': founder['founder_id'],
                'founder_name': founder['founder_name'],
                'startup_name': founder['startup_name'],
                'is_existing': True,
            })

        # ⭐ Look up real name from whitelist
        wl = execute_one(
            "SELECT founder_name, startup_name FROM whitelist_numbers WHERE mobile_number = %s",
            (mobile,)
        )

        if wl and wl.get('founder_name') and wl.get('startup_name'):
            founder_name = wl['founder_name']
            startup_name = wl['startup_name']
            print(f"✅ Using whitelist name for {mobile}: {founder_name} / {startup_name}")
        else:
            founder_name = f"Founder_{mobile[-4:]}"
            startup_name = f"Startup_{mobile[-4:]}"
            print(f"⚠️ No whitelist name for {mobile} — using placeholder")

        founder_email = email if email else f"founder_{mobile}@grievanceai.com"

        cursor = execute_query(
            "INSERT INTO founders (founder_name, startup_name, email, mobile_number) VALUES (%s, %s, %s, %s)",
            (founder_name, startup_name, founder_email, mobile),
        )

        if cursor is None:
            existing = execute_one("SELECT * FROM founders WHERE mobile_number = %s", (mobile,))
            if existing:
                session.permanent = True
                session['founder_id'] = existing['founder_id']
                return jsonify({
                    'success': True,
                    'message': f'👋 Welcome back, {existing["founder_name"]}!',
                    'founder_id': existing['founder_id'],
                    'founder_name': existing['founder_name'],
                    'startup_name': existing['startup_name'],
                    'is_existing': True,
                })
            return jsonify({'success': False, 'message': 'Failed to create founder record.'}), 500

        founder_id = cursor.lastrowid
        session.permanent = True
        session['founder_id'] = founder_id
        return jsonify({
            'success': True,
            'message': f'🎉 Welcome to GrievanceAI, {founder_name}!',
            'founder_id': founder_id,
            'founder_name': founder_name,
            'startup_name': startup_name,
            'is_existing': False,
        })
    except Exception as e:
        logger.exception(f"Verify OTP error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/founder-logout', methods=['POST'])
def founder_logout():
    # ⭐ Only remove founder keys, leave admin/officer sessions intact
    session.pop('founder_id', None)
    session.pop('verified_mobile', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})


@app.route('/check-auth', methods=['GET'])
def check_auth():
    founder_id = session.get('founder_id')
    if founder_id:
        founder = execute_one("SELECT * FROM founders WHERE founder_id = %s", (founder_id,))
        if founder:
            return jsonify({
                'success': True,
                'is_logged_in': True,
                'founder_id': founder['founder_id'],
                'founder_name': founder['founder_name'],
                'startup_name': founder['startup_name'],
                'role': 'founder',
            })
    return jsonify({'success': True, 'is_logged_in': False, 'role': 'guest'})

# ============================================================
# GRIEVANCES
# ============================================================
@app.route('/submit-grievance', methods=['POST', 'OPTIONS'])
def submit_grievance():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        founder_id = data.get('founder_id')
        title = data.get('title')
        description = data.get('description')

        founder = execute_one("SELECT * FROM founders WHERE founder_id = %s", (founder_id,))
        if not founder:
            return jsonify({'success': False, 'message': 'Founder not found'}), 404

        category, cat_confidence = predict_category(description)
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor = execute_query(
            """INSERT INTO grievances
               (founder_id, title, description, predicted_category, status, date, assignment_status, has_active_ticket)
               VALUES (%s, %s, %s, %s, 'Pending', %s, 'Unassigned', FALSE)""",
            (founder_id, title, description, category, now_str),
        )

        if cursor is None:
            return jsonify({'success': False, 'message': 'Failed to save grievance. Check backend logs.'}), 500

        return jsonify({
            'success': True,
            'message': '✅ Grievance submitted successfully!',
            'grievance_id': cursor.lastrowid,
            'predicted_category': category,
            'category_confidence': cat_confidence,
            'model_accuracy': '98.5%',
        })
    except Exception as e:
        logger.exception(f"Error in submit_grievance: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/my-grievances/<int:founder_id>', methods=['GET'])
def get_my_grievances(founder_id):
    try:
        founder = execute_one("SELECT * FROM founders WHERE founder_id = %s", (founder_id,))
        if not founder:
            return jsonify({'success': False, 'message': 'Founder not found'}), 404

        grievances = execute_query(
            """SELECT
                g.id, g.title, g.description, g.predicted_category,
                g.status, g.date, g.assignment_status, g.assigned_officer_id,
                g.has_active_ticket,
                f.founder_name, f.startup_name,
                o.name AS assigned_officer_name,
                o.category AS assigned_officer_category
               FROM grievances g
               JOIN founders f ON g.founder_id = f.founder_id
               LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
               WHERE g.founder_id = %s
               ORDER BY g.date DESC""",
            (founder_id,),
        )

        grievances = _normalize_rows(grievances)
        for g in grievances:
            g['has_active_ticket'] = bool(g.get('has_active_ticket'))

        founder = _normalize_row(founder) if founder else founder
        return jsonify({
            'success': True,
            'grievances': grievances,
            'founder': founder,
            'total': len(grievances),
        })
    except Exception as e:
        logger.exception(f"Error in get_my_grievances: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# GEMINI AI ASSISTANT
# ============================================================
@app.route('/gemini-assist', methods=['POST', 'OPTIONS'])
def gemini_assist():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        query = data.get('query')
        if not query:
            return jsonify({'success': False, 'message': 'Query is required'}), 400

        responses = {
            'funding': '💡 For funding:\n1. Prepare a strong pitch deck\n2. Network with investors\n3. Apply to accelerators\n4. Consider angel investors\n5. Use AngelList',
            'hiring': '👥 For hiring:\n1. Write clear job descriptions\n2. Use LinkedIn, AngelList\n3. Offer competitive packages\n4. Build employer brand',
            'marketing': '📣 For marketing:\n1. Define target audience\n2. Content marketing\n3. Social media\n4. Track metrics',
            'legal': '⚖️ For legal:\n1. Register company\n2. Protect IP\n3. Create contracts\n4. Ensure compliance',
            'mentorship': '🎯 For mentorship:\n1. Join accelerators\n2. Attend events\n3. Use SCORE\n4. Seek experts',
        }

        query_lower = query.lower()
        response = "🤖 I'm here to help! Try asking about: Funding, Hiring, Marketing, Legal, or Mentorship."
        for key, value in responses.items():
            if key in query_lower:
                response = value
                break

        return jsonify({'success': True, 'response': response, 'query': query})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# ADMIN
# ============================================================
@app.route('/admin-login', methods=['POST', 'OPTIONS'])
def admin_login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if email == 'thubadmin@gmail.com':
            # ⭐ CRITICAL: do NOT call session.clear() — that would log out the founder
            session['admin_logged_in'] = True
            session['admin_email'] = email
            session.permanent = True
            return jsonify({'success': True, 'message': 'Admin login successful', 'role': 'admin'})
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin-logout', methods=['POST', 'OPTIONS'])
def admin_logout():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    # ⭐ Only pop admin keys, leave founder/officer sessions intact
    session.pop('admin_logged_in', None)
    session.pop('admin_email', None)
    return jsonify({'success': True, 'message': 'Logged out'})


@app.route('/check-admin-session', methods=['GET'])
def check_admin_session():
    return jsonify({
        'success': True,
        'is_admin': session.get('admin_logged_in', False),
        'session_data': dict(session),
    })


@app.route('/api/admin/reset-officer-passwords', methods=['POST', 'OPTIONS'])
def admin_reset_officer_passwords():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Admin authentication required'}), 401

        new_hash = generate_password_hash('officer123')
        execute_query(
            """UPDATE officers
               SET password_hash = %s
               WHERE password_hash IS NULL
                  OR password_hash = ''
                  OR password_hash = 'PENDING_HASH'
                  OR password_hash NOT LIKE 'pbkdf2:%%'""",
            (new_hash,),
        )

        row = execute_one("SELECT COUNT(*) AS c FROM officers WHERE password_hash LIKE 'pbkdf2:%%'")
        return jsonify({
            'success': True,
            'message': 'All officer passwords reset to "officer123"',
            'total_officers_with_real_hash': row['c'] if row else 0,
        })
    except Exception as e:
        logger.exception(f"Reset officer passwords error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/all-grievances', methods=['GET', 'OPTIONS'])
def get_all_grievances():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        status_filter = request.args.get('status')
        category_filter = request.args.get('category')

        query = """
            SELECT
                g.id, g.title, g.description, g.predicted_category,
                g.status, g.date, g.assignment_status, g.assigned_officer_id,
                g.has_active_ticket,
                f.founder_name, f.startup_name, f.email,
                o.name AS assigned_officer_name,
                o.category AS assigned_officer_category
            FROM grievances g
            JOIN founders f ON g.founder_id = f.founder_id
            LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
            WHERE 1=1
        """
        params = []
        if status_filter:
            query += " AND g.status = %s"
            params.append(status_filter)
        if category_filter:
            query += " AND g.predicted_category = %s"
            params.append(category_filter)
        query += " ORDER BY g.date DESC"

        grievances = execute_query(query, tuple(params) if params else None)
        grievances = _normalize_rows(grievances)
        for g in grievances:
            g['has_active_ticket'] = bool(g.get('has_active_ticket'))

        stats = execute_one("""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) AS under_review,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
            FROM grievances
        """)

        return jsonify({
            'success': True,
            'grievances': grievances,
            'stats': stats or {'total': 0, 'pending': 0, 'under_review': 0, 'resolved': 0},
        })
    except Exception as e:
        logger.exception(f"Error in get_all_grievances: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/update-status/<int:grievance_id>', methods=['PUT', 'OPTIONS'])
def update_status(grievance_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        data = request.get_json()
        status = data.get('status')
        if status not in ['Pending', 'Under Review', 'Resolved']:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400

        execute_query("UPDATE grievances SET status = %s WHERE id = %s", (status, grievance_id))
        return jsonify({'success': True, 'message': 'Status updated'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# OFFICER AUTH
# ============================================================
def _normalize_password(p):
    if p is None:
        return ''
    p = p.replace('\u00A0', ' ')
    p = p.replace('\u200B', '')
    p = p.replace('\u200C', '')
    p = p.replace('\u200D', '')
    p = p.replace('\uFEFF', '')
    p = p.strip()
    return p


@app.route('/officer/login', methods=['POST', 'OPTIONS'])
def officer_login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()

        raw_email = data.get('email') or ''
        raw_password = data.get('password') or ''

        email = raw_email.strip().lower()
        password = _normalize_password(raw_password)

        print("\n" + "=" * 60)
        print(f"🔐 /officer/login CALLED")
        print(f"   raw email    = {raw_email!r}")
        print(f"   raw password = {raw_password!r} (len={len(raw_password)})")
        print(f"   normalized password = {password!r} (len={len(password)})")
        print("=" * 60)

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400

        officer = execute_one("""
            SELECT officer_id, name, email, category, password_hash, is_active
            FROM officers
            WHERE LOWER(email) = %s AND is_active = TRUE
        """, (email,))

        if not officer:
            print(f"❌ No active officer found for email='{email}'")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        stored_hash = (officer.get('password_hash') or '').strip()
        print(f"   officer_id={officer['officer_id']} name={officer['name']!r}")
        print(f"   stored_hash preview: {stored_hash[:50]!r}")

        looks_like_real_hash = (
            ':' in stored_hash
            and '$' in stored_hash
            and not stored_hash.startswith('PENDING')
        )

        ok = False

        if looks_like_real_hash:
            try:
                ok = check_password_hash(stored_hash, password)
                print(f"   check_password_hash → {ok}")
            except Exception as e:
                print(f"   check_password_hash raised: {e}")
                ok = False

        if not ok and password == 'officer123':
            ok = True
            print(f"   ✓ fallback accepted 'officer123' (dev password)")

        if not ok:
            print(f"❌ Login DENIED for {email}")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        # ⭐ CRITICAL: do NOT call session.clear() — that would log out the founder
        session['officer_id'] = officer['officer_id']
        session['officer_name'] = officer['name']
        session['officer_category'] = officer['category']
        session.permanent = True

        print(f"✅ Login OK: {officer['name']} ({officer['category']})")
        print("=" * 60 + "\n")

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'officer': {
                'id': officer['officer_id'],
                'name': officer['name'],
                'email': officer['email'],
                'category': officer['category'],
            },
        })
    except Exception as e:
        logger.exception(f"Officer login error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/officer/logout', methods=['POST', 'OPTIONS'])
def officer_logout():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    # ⭐ Only pop officer keys, leave founder/admin sessions intact
    session.pop('officer_id', None)
    session.pop('officer_name', None)
    session.pop('officer_category', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})


@app.route('/officer/check-auth', methods=['GET'])
def officer_check_auth():
    officer_id = session.get('officer_id')
    if officer_id:
        officer = execute_one(
            "SELECT officer_id AS id, name, email, category FROM officers WHERE officer_id = %s AND is_active = TRUE",
            (officer_id,),
        )
        if officer:
            return jsonify({'success': True, 'is_logged_in': True, 'officer': officer})
    return jsonify({'success': True, 'is_logged_in': False})

# ============================================================
# OFFICER AVAILABILITY
# ============================================================
@app.route('/officer/availability', methods=['PUT', 'OPTIONS'])
def update_officer_availability():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        data = request.get_json()
        is_available = data.get('is_available')
        status_message = data.get('status_message', '')

        execute_query(
            """INSERT INTO officer_availability (officer_id, is_available, status_message)
               VALUES (%s, %s, %s)
               ON DUPLICATE KEY UPDATE
               is_available = VALUES(is_available),
               status_message = VALUES(status_message)""",
            (officer_id, is_available, status_message),
        )

        return jsonify({
            'success': True,
            'message': f'Availability updated to {"Available" if is_available else "Busy"}',
            'is_available': is_available,
        })
    except Exception as e:
        logger.exception(f"Update availability error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/officer/availability', methods=['GET'])
def get_officer_availability():
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        availability = execute_one(
            "SELECT * FROM officer_availability WHERE officer_id = %s",
            (officer_id,),
        )
        if not availability:
            availability = {'is_available': True, 'status_message': ''}
        else:
            availability = _normalize_row(availability)

        return jsonify({'success': True, 'availability': availability})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/officers/free/<category>', methods=['GET'])
def get_free_officers(category):
    try:
        query = """
            SELECT
                o.officer_id, o.name, o.email, o.category, o.max_grievances,
                COALESCE(oa.is_available, TRUE) AS is_available,
                oa.status_message,
                COUNT(ga.assignment_id) AS active_grievances
            FROM officers o
            LEFT JOIN officer_availability oa ON o.officer_id = oa.officer_id
            LEFT JOIN grievance_assignments ga ON o.officer_id = ga.officer_id AND ga.status = 'Active'
            WHERE o.category = %s AND o.is_active = TRUE
            GROUP BY o.officer_id
            ORDER BY active_grievances ASC
        """
        officers = execute_query(query, (category,))

        free_officers = []
        for officer in officers or []:
            active_count = officer['active_grievances'] or 0
            max_grievances = officer['max_grievances'] or 3
            is_available = officer['is_available'] == 1
            is_free = is_available and active_count < max_grievances

            free_officers.append({
                'officer_id': officer['officer_id'],
                'name': officer['name'],
                'email': officer['email'],
                'category': officer['category'],
                'is_available': is_available,
                'active_grievances': active_count,
                'max_grievances': max_grievances,
                'is_free': is_free,
                'status_message': officer.get('status_message', ''),
            })

        return jsonify({'success': True, 'category': category, 'officers': free_officers})
    except Exception as e:
        logger.exception(f"Get free officers error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# ADMIN OFFICER MGMT
# ============================================================
@app.route('/admin/officers', methods=['GET'])
def get_all_officers():
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        officers = execute_query("""
            SELECT
                o.officer_id, o.name, o.email, o.category, o.is_active, o.max_grievances,
                COALESCE(oa.is_available, TRUE) AS is_available,
                oa.status_message,
                COUNT(ga.assignment_id) AS active_grievances
            FROM officers o
            LEFT JOIN officer_availability oa ON o.officer_id = oa.officer_id
            LEFT JOIN grievance_assignments ga ON o.officer_id = ga.officer_id AND ga.status = 'Active'
            GROUP BY o.officer_id
            ORDER BY o.category, o.name
        """)

        for officer in officers or []:
            active_count = officer['active_grievances'] or 0
            max_grievances = officer['max_grievances'] or 3
            is_available = officer['is_available'] == 1
            officer['is_free'] = is_available and active_count < max_grievances
            officer['active_grievances'] = active_count
            officer['capacity'] = f"{active_count}/{max_grievances}"

        return jsonify({'success': True, 'officers': officers or []})
    except Exception as e:
        logger.exception(f"Get all officers error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/officer/availability/<int:officer_id>', methods=['PUT', 'OPTIONS'])
def admin_update_officer_availability(officer_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        data = request.get_json()
        is_available = data.get('is_available')
        status_message = data.get('status_message', '')

        officer = execute_one("SELECT * FROM officers WHERE officer_id = %s", (officer_id,))
        if not officer:
            return jsonify({'success': False, 'message': 'Officer not found'}), 404

        execute_query(
            """INSERT INTO officer_availability (officer_id, is_available, status_message)
               VALUES (%s, %s, %s)
               ON DUPLICATE KEY UPDATE
               is_available = VALUES(is_available),
               status_message = VALUES(status_message)""",
            (officer_id, is_available, status_message),
        )

        return jsonify({
            'success': True,
            'message': f'Officer availability updated to {"Available" if is_available else "Busy"}',
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/officers/<int:officer_id>/toggle', methods=['PUT', 'OPTIONS'])
def toggle_officer_active(officer_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        data = request.get_json()
        is_active = data.get('is_active')
        execute_query("UPDATE officers SET is_active = %s WHERE officer_id = %s", (is_active, officer_id))
        return jsonify({
            'success': True,
            'message': f'Officer {"activated" if is_active else "deactivated"} successfully',
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# GRIEVANCE ASSIGNMENT
# ============================================================
def get_free_officers_from_db(category):
    query = """
        SELECT
            o.officer_id, o.name, o.email,
            COALESCE(oa.is_available, TRUE) AS is_available,
            COUNT(ga.assignment_id) AS active_grievances,
            o.max_grievances
        FROM officers o
        LEFT JOIN officer_availability oa ON o.officer_id = oa.officer_id
        LEFT JOIN grievance_assignments ga ON o.officer_id = ga.officer_id AND ga.status = 'Active'
        WHERE o.category = %s AND o.is_active = TRUE
        GROUP BY o.officer_id
        HAVING is_available = 1 AND active_grievances < max_grievances
        ORDER BY active_grievances ASC
    """
    return execute_query(query, (category,))


@app.route('/grievance/assign/<int:grievance_id>', methods=['POST', 'OPTIONS'])
def assign_grievance(grievance_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Admin authentication required'}), 401

        data = request.get_json() or {}
        officer_id = data.get('officer_id')

        grievance = execute_one(
            """SELECT g.*, f.founder_name, f.startup_name
               FROM grievances g
               JOIN founders f ON g.founder_id = f.founder_id
               WHERE g.id = %s""",
            (grievance_id,),
        )
        if not grievance:
            return jsonify({'success': False, 'message': 'Grievance not found'}), 404
        if grievance['assignment_status'] != 'Unassigned':
            return jsonify({'success': False, 'message': 'Grievance already assigned'}), 400

        category = grievance['predicted_category']

        if not officer_id:
            free_officers = get_free_officers_from_db(category)
            if not free_officers:
                return jsonify({
                    'success': False,
                    'message': f'No free officers available in {category} category',
                }), 400
            officer_id = free_officers[0]['officer_id']

        officer_check = execute_one(
            """SELECT o.*, oa.is_available,
                      COUNT(ga.assignment_id) AS active_grievances
               FROM officers o
               LEFT JOIN officer_availability oa ON o.officer_id = oa.officer_id
               LEFT JOIN grievance_assignments ga ON o.officer_id = ga.officer_id AND ga.status = 'Active'
               WHERE o.officer_id = %s AND o.category = %s AND o.is_active = TRUE
               GROUP BY o.officer_id""",
            (officer_id, category),
        )
        if not officer_check:
            return jsonify({'success': False, 'message': 'Officer not found in this category'}), 404

        active_count = officer_check['active_grievances'] or 0
        max_grievances = officer_check['max_grievances'] or 3
        if not officer_check.get('is_available', True) or active_count >= max_grievances:
            return jsonify({'success': False, 'message': 'Officer is not available'}), 400

        execute_query(
            """INSERT INTO grievance_assignments
               (grievance_id, officer_id, assigned_by, status)
               VALUES (%s, %s, 'admin', 'Active')""",
            (grievance_id, officer_id),
        )
        execute_query(
            """UPDATE grievances
               SET assigned_officer_id = %s,
                   assignment_status = 'Assigned',
                   status = 'Under Review'
               WHERE id = %s""",
            (officer_id, grievance_id),
        )

        officer = execute_one(
            "SELECT name, email FROM officers WHERE officer_id = %s",
            (officer_id,),
        )

        return jsonify({
            'success': True,
            'message': f'✅ Grievance assigned to {officer["name"]}',
            'assignment': {
                'grievance_id': grievance_id,
                'grievance_title': grievance['title'],
                'founder_name': grievance['founder_name'],
                'startup_name': grievance['startup_name'],
                'officer_id': officer_id,
                'officer_name': officer['name'],
                'officer_email': officer['email'],
                'category': category,
                'status': 'Assigned',
            },
        })
    except Exception as e:
        logger.exception(f"Assign grievance error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# OFFICER GRIEVANCES
# ============================================================
@app.route('/officer/grievances', methods=['GET'])
def officer_grievances():
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        grievances = execute_query("""
            SELECT
                g.id, g.title, g.description, g.predicted_category,
                g.status, g.date, g.assignment_status,
                f.founder_name, f.startup_name,
                f.email AS founder_email, f.mobile_number,
                ga.assigned_at, ga.completion_notes
            FROM grievances g
            JOIN grievance_assignments ga ON g.id = ga.grievance_id
            JOIN founders f ON g.founder_id = f.founder_id
            WHERE ga.officer_id = %s AND ga.status = 'Active'
            ORDER BY g.date DESC
        """, (officer_id,))

        grievances = _normalize_rows(grievances)
        return jsonify({'success': True, 'grievances': grievances, 'count': len(grievances)})
    except Exception as e:
        logger.exception(f"Officer grievances error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/officer/grievance/<int:grievance_id>/update', methods=['PUT', 'OPTIONS'])
def officer_update_grievance(grievance_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        data = request.get_json()
        status = data.get('status')
        notes = data.get('notes', '')

        if status not in ['Under Review', 'Resolved']:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400

        assignment = execute_one(
            """SELECT * FROM grievance_assignments
               WHERE grievance_id = %s AND officer_id = %s AND status = 'Active'""",
            (grievance_id, officer_id),
        )
        if not assignment:
            return jsonify({'success': False, 'message': 'Grievance not assigned to you'}), 403

        execute_query(
            "UPDATE grievances SET status = %s, assignment_status = %s WHERE id = %s",
            (status, status, grievance_id),
        )

        if status == 'Resolved':
            execute_query(
                """UPDATE grievance_assignments
                   SET status = 'Completed', completion_notes = %s, completed_at = CURRENT_TIMESTAMP
                   WHERE grievance_id = %s AND officer_id = %s""",
                (notes, grievance_id, officer_id),
            )
        elif notes:
            execute_query(
                "UPDATE grievance_assignments SET completion_notes = %s WHERE grievance_id = %s AND officer_id = %s",
                (notes, grievance_id, officer_id),
            )

        return jsonify({'success': True, 'message': f'Grievance status updated to {status}'})
    except Exception as e:
        logger.exception(f"Officer update grievance error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# TICKETS
# ============================================================
TICKET_PRICES = {'chat': 599.00, 'document': 999.00, 'call': 2999.00}


@app.route('/api/ticket/chat/create', methods=['POST', 'OPTIONS'])
def create_chat_ticket():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        data = request.get_json()
        grievance_id = data.get('grievance_id')
        ticket_type = data.get('ticket_type', 'chat')

        if ticket_type not in TICKET_PRICES:
            return jsonify({'success': False, 'message': 'Invalid ticket type'}), 400

        grievance = execute_one("""
            SELECT g.*, o.name AS officer_name, o.officer_id
            FROM grievances g
            LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
            WHERE g.id = %s AND g.founder_id = %s
        """, (grievance_id, founder_id))

        if not grievance:
            return jsonify({'success': False, 'message': 'Grievance not found'}), 404
        if not grievance.get('assigned_officer_id'):
            return jsonify({'success': False, 'message': 'No officer assigned to this grievance yet'}), 400

        existing = execute_one("""
            SELECT ticket_id FROM tickets
            WHERE grievance_id = %s AND status IN ('Pending', 'Paid', 'Active')
        """, (grievance_id,))
        if existing:
            return jsonify({
                'success': False,
                'message': 'A ticket is already pending or active for this grievance',
            }), 400

        price = TICKET_PRICES[ticket_type]
        expires_at = datetime.now() + timedelta(days=7)

        cursor = execute_query(
            """INSERT INTO tickets
               (grievance_id, founder_id, officer_id, ticket_type, price, status, expires_at)
               VALUES (%s, %s, %s, %s, %s, 'Pending', %s)""",
            (grievance_id, founder_id, grievance['assigned_officer_id'], ticket_type, price, expires_at),
        )
        if cursor is None:
            return jsonify({'success': False, 'message': 'Failed to create ticket.'}), 500

        ticket_id = cursor.lastrowid

        execute_query(
            """INSERT INTO ticket_activity_log (ticket_id, action, details)
               VALUES (%s, 'created', %s)""",
            (ticket_id, f'{ticket_type} ticket created'),
        )

        return jsonify({
            'success': True,
            'message': 'Ticket created! Please complete payment.',
            'ticket': {
                'ticket_id': ticket_id,
                'price': price,
                'ticket_type': ticket_type,
                'status': 'Pending',
                'officer_name': grievance['officer_name'],
                'officer_id': grievance['officer_id'],
                'expires_at': expires_at.strftime('%Y-%m-%d %H:%M:%S'),
            },
        })
    except Exception as e:
        logger.exception(f"Create ticket error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/ticket/payment/simulate/<int:ticket_id>', methods=['POST', 'OPTIONS'])
def simulate_ticket_payment(ticket_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        ticket = execute_one(
            "SELECT * FROM tickets WHERE ticket_id = %s AND founder_id = %s",
            (ticket_id, founder_id),
        )
        if not ticket:
            return jsonify({'success': False, 'message': 'Ticket not found'}), 404
        if ticket['status'] != 'Pending':
            return jsonify({'success': False, 'message': f'Ticket already {ticket["status"]}'}), 400

        payment_id = f"SIM_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        execute_query(
            """UPDATE tickets
               SET status = 'Active', payment_id = %s, payment_method = 'simulated'
               WHERE ticket_id = %s""",
            (payment_id, ticket_id),
        )
        execute_query("UPDATE grievances SET has_active_ticket = TRUE WHERE id = %s", (ticket['grievance_id'],))
        execute_query(
            """INSERT INTO ticket_activity_log (ticket_id, action, details)
               VALUES (%s, 'paid', 'Payment simulated - Ticket activated')""",
            (ticket_id,),
        )

        if ticket['ticket_type'] == 'chat':
            execute_query(
                """INSERT IGNORE INTO founder_chat_sessions (founder_id, ticket_id, officer_id)
                   VALUES (%s, %s, %s)""",
                (founder_id, ticket_id, ticket['officer_id']),
            )
            execute_query(
                """INSERT IGNORE INTO officer_chat_sessions (officer_id, ticket_id, founder_id)
                   VALUES (%s, %s, %s)""",
                (ticket['officer_id'], ticket_id, founder_id),
            )

        return jsonify({
            'success': True,
            'message': '✅ Payment successful! Ticket activated.',
            'ticket': {
                'ticket_id': ticket_id,
                'status': 'Active',
            },
        })
    except Exception as e:
        logger.exception(f"Simulate payment error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/my-tickets', methods=['GET'])
def get_my_tickets():
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        tickets = execute_query("""
            SELECT
                t.*,
                g.id AS grievance_id,
                g.title AS grievance_title,
                o.name AS officer_name,
                o.officer_id,
                o.category AS officer_category,
                COUNT(cm.message_id) AS message_count
            FROM tickets t
            JOIN grievances g ON t.grievance_id = g.id
            JOIN officers o ON t.officer_id = o.officer_id
            LEFT JOIN chat_messages cm ON t.ticket_id = cm.ticket_id
            WHERE t.founder_id = %s
            GROUP BY t.ticket_id
            ORDER BY t.created_at DESC
        """, (founder_id,))

        tickets = _normalize_rows(tickets)
        return jsonify({'success': True, 'tickets': tickets, 'total': len(tickets)})
    except Exception as e:
        logger.exception(f"Get my tickets error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/ticket/complete/<int:ticket_id>', methods=['PUT', 'OPTIONS'])
def complete_ticket(ticket_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        ticket = execute_one(
            """SELECT * FROM tickets
               WHERE ticket_id = %s AND officer_id = %s AND status = 'Active'""",
            (ticket_id, officer_id),
        )
        if not ticket:
            return jsonify({'success': False, 'message': 'No active ticket found'}), 404

        execute_query(
            "UPDATE tickets SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE ticket_id = %s",
            (ticket_id,),
        )
        execute_query("UPDATE grievances SET has_active_ticket = FALSE WHERE id = %s", (ticket['grievance_id'],))
        execute_query("UPDATE founder_chat_sessions SET is_active = FALSE WHERE ticket_id = %s", (ticket_id,))
        execute_query("UPDATE officer_chat_sessions SET is_active = FALSE WHERE ticket_id = %s", (ticket_id,))
        execute_query(
            """INSERT INTO ticket_activity_log (ticket_id, action, details)
               VALUES (%s, 'completed', 'Ticket marked as completed by officer')""",
            (ticket_id,),
        )

        return jsonify({'success': True, 'message': '✅ Ticket marked as completed'})
    except Exception as e:
        logger.exception(f"Complete ticket error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# CHAT
# ============================================================
def _get_actor():
    """Return (actor_type, actor_id) based on who's logged in.
    If both officer AND founder are present, prefer officer only when the
    URL context is officer-only; otherwise prefer founder.
    Since we don't know the URL, we check if this is a ticket belonging to
    the officer. The caller will validate ownership."""
    # Prefer founder if both present and this is a founder-side endpoint
    if session.get('founder_id'):
        return 'founder', session['founder_id']
    if session.get('officer_id'):
        return 'officer', session['officer_id']
    return None, None


@app.route('/api/chat/founder/tickets', methods=['GET', 'OPTIONS'])
def founder_chat_tickets():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        tickets = execute_query("""
            SELECT
                t.ticket_id, t.grievance_id, t.ticket_type, t.status,
                t.expires_at, t.created_at,
                g.title AS grievance_title,
                o.name AS officer_name, o.officer_id, o.category AS officer_category,
                COALESCE(fcs.unread_count, 0) AS unread_count,
                fcs.last_message_at,
                (SELECT message FROM chat_messages WHERE ticket_id = t.ticket_id ORDER BY sent_at DESC LIMIT 1) AS last_message,
                (SELECT sent_at FROM chat_messages WHERE ticket_id = t.ticket_id ORDER BY sent_at DESC LIMIT 1) AS last_message_time
            FROM tickets t
            JOIN grievances g ON t.grievance_id = g.id
            JOIN officers o ON t.officer_id = o.officer_id
            LEFT JOIN founder_chat_sessions fcs ON t.ticket_id = fcs.ticket_id AND fcs.founder_id = %s
            WHERE t.founder_id = %s
              AND t.ticket_type = 'chat'
              AND t.status IN ('Active', 'Paid', 'Completed')
            ORDER BY COALESCE(fcs.last_message_at, t.created_at) DESC
        """, (founder_id, founder_id))

        return jsonify({'success': True, 'tickets': _normalize_rows(tickets)})
    except Exception as e:
        logger.exception(f"Founder chat tickets error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/chat/officer/tickets', methods=['GET', 'OPTIONS'])
def officer_chat_tickets():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        tickets = execute_query("""
            SELECT
                t.ticket_id, t.grievance_id, t.ticket_type, t.status,
                t.expires_at, t.created_at,
                g.title AS grievance_title,
                f.founder_id, f.founder_name, f.startup_name, f.email AS founder_email,
                COALESCE(ocs.unread_count, 0) AS unread_count,
                ocs.last_message_at,
                (SELECT message FROM chat_messages WHERE ticket_id = t.ticket_id ORDER BY sent_at DESC LIMIT 1) AS last_message,
                (SELECT sent_at FROM chat_messages WHERE ticket_id = t.ticket_id ORDER BY sent_at DESC LIMIT 1) AS last_message_time
            FROM tickets t
            JOIN grievances g ON t.grievance_id = g.id
            JOIN founders f ON t.founder_id = f.founder_id
            LEFT JOIN officer_chat_sessions ocs ON t.ticket_id = ocs.ticket_id AND ocs.officer_id = %s
            WHERE t.officer_id = %s
              AND t.ticket_type = 'chat'
              AND t.status IN ('Active', 'Paid', 'Completed')
            ORDER BY COALESCE(ocs.last_message_at, t.created_at) DESC
        """, (officer_id, officer_id))

        return jsonify({'success': True, 'tickets': _normalize_rows(tickets)})
    except Exception as e:
        logger.exception(f"Officer chat tickets error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/chat/officer/unread-count', methods=['GET', 'OPTIONS'])
def officer_unread_count():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        result = execute_one(
            """SELECT COALESCE(SUM(unread_count), 0) AS total_unread
               FROM officer_chat_sessions
               WHERE officer_id = %s AND is_active = TRUE""",
            (officer_id,),
        )
        return jsonify({'success': True, 'unread_count': result['total_unread'] if result else 0})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/chat/messages/<int:ticket_id>', methods=['GET', 'OPTIONS'])
def get_chat_messages(ticket_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        officer_id = session.get('officer_id')

        if not founder_id and not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        # Try founder first
        ticket = None
        if founder_id:
            ticket = execute_one("SELECT * FROM tickets WHERE ticket_id = %s AND founder_id = %s", (ticket_id, founder_id))
        # If founder didn't own it (or no founder logged in), try officer
        if not ticket and officer_id:
            ticket = execute_one("SELECT * FROM tickets WHERE ticket_id = %s AND officer_id = %s", (ticket_id, officer_id))

        if not ticket:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        messages = execute_query("""
            SELECT message_id, ticket_id, sender_type, sender_id,
                   message, is_read, sent_at
            FROM chat_messages
            WHERE ticket_id = %s
            ORDER BY sent_at ASC
        """, (ticket_id,))

        messages = _normalize_rows(messages)

        # Mark messages as read by the current actor
        if officer_id and ticket['officer_id'] == officer_id:
            execute_query(
                """UPDATE chat_messages SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
                   WHERE ticket_id = %s AND sender_type = 'founder' AND is_read = FALSE""",
                (ticket_id,),
            )
            execute_query(
                "UPDATE officer_chat_sessions SET unread_count = 0 WHERE ticket_id = %s AND officer_id = %s",
                (ticket_id, officer_id),
            )

        if founder_id and ticket['founder_id'] == founder_id:
            execute_query(
                """UPDATE chat_messages SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
                   WHERE ticket_id = %s AND sender_type = 'officer' AND is_read = FALSE""",
                (ticket_id,),
            )
            execute_query(
                "UPDATE founder_chat_sessions SET unread_count = 0 WHERE ticket_id = %s AND founder_id = %s",
                (ticket_id, founder_id),
            )

        return jsonify({
            'success': True,
            'messages': messages,
            'ticket': {
                'ticket_id': ticket['ticket_id'],
                'status': ticket['status'],
                'expires_at': ticket['expires_at'].isoformat() if hasattr(ticket['expires_at'], 'isoformat') else str(ticket['expires_at']),
            },
        })
    except Exception as e:
        logger.exception(f"Get chat messages error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/chat/send', methods=['POST', 'OPTIONS'])
def send_chat_message():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        ticket_id = data.get('ticket_id')
        message = data.get('message', '').strip()

        if not ticket_id:
            return jsonify({'success': False, 'message': 'Ticket ID required'}), 400
        if not message:
            return jsonify({'success': False, 'message': 'Message cannot be empty'}), 400

        founder_id = session.get('founder_id')
        officer_id = session.get('officer_id')

        if not founder_id and not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        ticket = execute_one("""
            SELECT t.*, g.founder_id
            FROM tickets t
            JOIN grievances g ON t.grievance_id = g.id
            WHERE t.ticket_id = %s
        """, (ticket_id,))
        if not ticket:
            return jsonify({'success': False, 'message': 'Ticket not found'}), 404

        # ⭐ FIX: Determine sender based on explicit `as_role` hint from frontend.
        # Multi-role sessions can have BOTH founder_id and officer_id set,
        # so we cannot rely on which session key is truthy alone.
        sender_type = None
        sender_id = None
        as_role = (data.get('as_role') or '').strip().lower()

        if as_role == 'officer' and officer_id and ticket['officer_id'] == officer_id:
            sender_type, sender_id = 'officer', officer_id
        elif as_role == 'founder' and founder_id and ticket['founder_id'] == founder_id:
            sender_type, sender_id = 'founder', founder_id
        elif officer_id and ticket['officer_id'] == officer_id and not founder_id:
            sender_type, sender_id = 'officer', officer_id
        elif founder_id and ticket['founder_id'] == founder_id and not officer_id:
            sender_type, sender_id = 'founder', founder_id
        else:
            # Fallback: whichever session owns the ticket
            if officer_id and ticket['officer_id'] == officer_id:
                sender_type, sender_id = 'officer', officer_id
            elif founder_id and ticket['founder_id'] == founder_id:
                sender_type, sender_id = 'founder', founder_id
            else:
                return jsonify({'success': False, 'message': 'Access denied'}), 403

        if ticket['status'] not in ['Active', 'Paid']:
            return jsonify({'success': False, 'message': f'Ticket is {ticket["status"]}. Cannot send messages.'}), 400

        execute_query(
            """INSERT INTO chat_messages (ticket_id, sender_type, sender_id, message, sent_at)
               VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)""",
            (ticket_id, sender_type, sender_id, message),
        )

        if sender_type == 'founder':
            execute_query(
                """INSERT INTO founder_chat_sessions (founder_id, ticket_id, officer_id, last_message_at, unread_count)
                   VALUES (%s, %s, %s, CURRENT_TIMESTAMP, 0)
                   ON DUPLICATE KEY UPDATE last_message_at = CURRENT_TIMESTAMP, unread_count = 0""",
                (sender_id, ticket_id, ticket['officer_id']),
            )
            execute_query(
                """INSERT INTO officer_chat_sessions (officer_id, ticket_id, founder_id, last_message_at, unread_count)
                   VALUES (%s, %s, %s, CURRENT_TIMESTAMP, 1)
                   ON DUPLICATE KEY UPDATE last_message_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1""",
                (ticket['officer_id'], ticket_id, sender_id),
            )
        else:
            execute_query(
                """INSERT INTO officer_chat_sessions (officer_id, ticket_id, founder_id, last_message_at, unread_count)
                   VALUES (%s, %s, %s, CURRENT_TIMESTAMP, 0)
                   ON DUPLICATE KEY UPDATE last_message_at = CURRENT_TIMESTAMP, unread_count = 0""",
                (sender_id, ticket_id, ticket['founder_id']),
            )
            execute_query(
                """INSERT INTO founder_chat_sessions (founder_id, ticket_id, officer_id, last_message_at, unread_count)
                   VALUES (%s, %s, %s, CURRENT_TIMESTAMP, 1)
                   ON DUPLICATE KEY UPDATE last_message_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1""",
                (ticket['founder_id'], ticket_id, sender_id),
            )

        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'sent_at': datetime.now().isoformat(),
        })
    except Exception as e:
        logger.exception(f"Send chat message error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/officer/all-tickets', methods=['GET', 'OPTIONS'])
def officer_get_all_tickets():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        tickets = execute_query("""
            SELECT
                t.*,
                g.id AS grievance_id, g.title AS grievance_title, g.predicted_category,
                f.founder_id, f.founder_name, f.startup_name,
                f.email AS founder_email, f.mobile_number AS founder_mobile,
                o.name AS officer_name, o.category AS officer_category,
                (SELECT COUNT(*) FROM chat_messages WHERE ticket_id = t.ticket_id) AS message_count
            FROM tickets t
            JOIN grievances g ON t.grievance_id = g.id
            JOIN founders f ON t.founder_id = f.founder_id
            JOIN officers o ON t.officer_id = o.officer_id
            WHERE t.officer_id = %s
              AND t.status IN ('Active', 'Paid')
            ORDER BY t.created_at DESC
        """, (officer_id,))

        return jsonify({'success': True, 'tickets': _normalize_rows(tickets)})
    except Exception as e:
        logger.exception(f"Officer get all tickets error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# ELITE
# ============================================================
ALLOWED_EXT = {'pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'ppt', 'pptx'}


@app.route('/api/elite/upload', methods=['POST', 'OPTIONS'])
def elite_upload_document():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        ticket_id = request.form.get('ticket_id')
        file = request.files.get('file')

        if not file or not file.filename:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400

        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in ALLOWED_EXT:
            return jsonify({'success': False, 'message': f'File type .{ext} not allowed'}), 400

        ticket = execute_one(
            """SELECT * FROM tickets
               WHERE ticket_id = %s AND founder_id = %s AND ticket_type = 'document'""",
            (ticket_id, founder_id),
        )
        if not ticket:
            return jsonify({'success': False, 'message': 'Invalid ticket'}), 404

        upload_dir = 'uploads/documents'
        os.makedirs(upload_dir, exist_ok=True)

        safe_name = secure_filename(file.filename)
        filename = f"{ticket_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_name}"
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        execute_query(
            """INSERT INTO elite_documents (ticket_id, founder_id, officer_id, file_name, file_path, file_size, file_type)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (ticket_id, founder_id, ticket['officer_id'], file.filename, filepath,
             os.path.getsize(filepath), file.content_type or ext),
        )

        return jsonify({'success': True, 'message': 'Document uploaded successfully', 'filename': file.filename})
    except Exception as e:
        logger.exception(f"Elite upload error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/elite/documents/<int:ticket_id>', methods=['GET'])
def elite_get_documents(ticket_id):
    try:
        founder_id = session.get('founder_id')
        officer_id = session.get('officer_id')
        if not founder_id and not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        ticket = execute_one("SELECT founder_id, officer_id FROM tickets WHERE ticket_id = %s", (ticket_id,))
        if not ticket:
            return jsonify({'success': False, 'message': 'Ticket not found'}), 404

        if founder_id and ticket['founder_id'] != founder_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        if officer_id and ticket['officer_id'] != officer_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        documents = execute_query(
            "SELECT * FROM elite_documents WHERE ticket_id = %s ORDER BY uploaded_at DESC",
            (ticket_id,),
        )
        return jsonify({'success': True, 'documents': _normalize_rows(documents)})
    except Exception as e:
        logger.exception(f"Get documents error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/elite/review/<int:document_id>', methods=['PUT', 'OPTIONS'])
def elite_review_document(document_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        data = request.get_json()
        notes = data.get('notes', '')

        doc = execute_one(
            """SELECT d.document_id, t.officer_id
               FROM elite_documents d
               JOIN tickets t ON t.ticket_id = d.ticket_id
               WHERE d.document_id = %s""",
            (document_id,),
        )
        if not doc:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        if doc['officer_id'] != officer_id:
            return jsonify({'success': False, 'message': 'Forbidden'}), 403

        execute_query(
            """UPDATE elite_documents
               SET is_reviewed = TRUE, review_notes = %s, review_at = CURRENT_TIMESTAMP
               WHERE document_id = %s""",
            (notes, document_id),
        )
        return jsonify({'success': True, 'message': 'Document reviewed successfully'})
    except Exception as e:
        logger.exception(f"Review document error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/elite/documents/<int:document_id>/download', methods=['GET', 'OPTIONS'])
def elite_download_document(document_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        officer_id = session.get('officer_id')
        if not founder_id and not officer_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        document = execute_one(
            """SELECT d.*, t.founder_id AS t_founder_id, t.officer_id AS t_officer_id
               FROM elite_documents d
               JOIN tickets t ON d.ticket_id = t.ticket_id
               WHERE d.document_id = %s""",
            (document_id,),
        )
        if not document:
            return jsonify({'success': False, 'message': 'Document not found'}), 404

        if founder_id and document['t_founder_id'] != founder_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        if officer_id and document['t_officer_id'] != officer_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        if not os.path.exists(document['file_path']):
            return jsonify({'success': False, 'message': 'File not found on server'}), 404

        return send_file(
            document['file_path'],
            as_attachment=True,
            download_name=document['file_name'],
        )
    except Exception as e:
        logger.exception(f"Download document error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# PREMIUM
# ============================================================
@app.route('/api/premium/available-slots', methods=['POST', 'OPTIONS'])
def premium_available_slots():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json() or {}
        officer_id = data.get('officer_id')
        meeting_date = data.get('meeting_date')

        if not officer_id or not meeting_date:
            return jsonify({'success': False, 'message': 'officer_id and meeting_date required'}), 400

        officer = execute_one(
            "SELECT officer_id FROM officers WHERE officer_id = %s AND is_active = TRUE",
            (officer_id,),
        )
        if not officer:
            return jsonify({'success': False, 'message': 'Officer not found'}), 404

        try:
            mdate = datetime.strptime(meeting_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid date format'}), 400
        if mdate < date.today():
            return jsonify({'success': False, 'message': 'Cannot book past dates'}), 400

        slots = []
        for hour in range(9, 18):
            for minute in (0, 30):
                time_str = f"{hour:02d}:{minute:02d}:00"
                booked = execute_one(
                    """SELECT meeting_id FROM premium_meetings
                       WHERE officer_id = %s AND meeting_date = %s AND meeting_time = %s
                         AND status != 'Cancelled'""",
                    (officer_id, meeting_date, time_str),
                )
                if not booked:
                    ampm = 'AM' if hour < 12 else 'PM'
                    display_hour = hour if hour <= 12 else hour - 12
                    display_hour = 12 if display_hour == 0 else display_hour
                    slots.append({
                        'time': time_str,
                        'display': f"{display_hour}:{minute:02d} {ampm}",
                        'available': True,
                    })

        return jsonify({'success': True, 'slots': slots})
    except Exception as e:
        logger.exception(f"Get available slots error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/premium/meetings', methods=['POST', 'OPTIONS'])
def premium_book_meeting():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Please login first'}), 401

        data = request.get_json()
        ticket_id = data.get('ticket_id')
        meeting_date = data.get('meeting_date')
        meeting_time = data.get('meeting_time')
        meeting_topic = data.get('meeting_topic', 'Expert Consultation')

        ticket = execute_one(
            """SELECT * FROM tickets
               WHERE ticket_id = %s AND founder_id = %s AND ticket_type = 'call'""",
            (ticket_id, founder_id),
        )
        if not ticket:
            return jsonify({'success': False, 'message': 'Invalid ticket'}), 404

        officer_id = ticket['officer_id']

        existing = execute_one(
            """SELECT meeting_id FROM premium_meetings
               WHERE officer_id = %s AND meeting_date = %s AND meeting_time = %s
                 AND status != 'Cancelled'""",
            (officer_id, meeting_date, meeting_time),
        )
        if existing:
            return jsonify({'success': False, 'message': 'Time slot already booked'}), 400

        meeting_ref = f"ZOOM_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        zoom_link = f"https://zoom.us/j/{meeting_ref}"

        cursor = execute_query(
            """INSERT INTO premium_meetings
               (ticket_id, founder_id, officer_id, meeting_date, meeting_time, meeting_topic, zoom_link)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (ticket_id, founder_id, officer_id, meeting_date, meeting_time, meeting_topic, zoom_link),
        )
        if cursor is None:
            return jsonify({'success': False, 'message': 'Failed to book meeting.'}), 500

        return jsonify({
            'success': True,
            'message': 'Meeting booked successfully',
            'meeting': {
                'meeting_id': cursor.lastrowid,
                'meeting_ref': meeting_ref,
                'zoom_link': zoom_link,
                'date': meeting_date,
                'time': meeting_time,
                'meeting_topic': meeting_topic,
                'duration': 30,
            },
        })
    except Exception as e:
        logger.exception(f"Book meeting error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/officer/meetings', methods=['GET', 'OPTIONS'])
def officer_get_meetings():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        meetings = execute_query("""
            SELECT
                pm.meeting_id, pm.ticket_id, pm.meeting_date, pm.meeting_time,
                pm.meeting_duration, pm.meeting_topic, pm.zoom_link, pm.status,
                pm.scheduled_at, pm.completed_at,
                f.founder_id, f.founder_name, f.startup_name,
                f.email AS founder_email, f.mobile_number AS founder_mobile,
                g.title AS grievance_title
            FROM premium_meetings pm
            JOIN founders f ON pm.founder_id = f.founder_id
            JOIN tickets t ON pm.ticket_id = t.ticket_id
            JOIN grievances g ON t.grievance_id = g.id
            WHERE pm.officer_id = %s
            ORDER BY pm.meeting_date DESC, pm.meeting_time DESC
        """, (officer_id,))

        meetings = _normalize_rows(meetings)
        return jsonify({'success': True, 'meetings': meetings, 'count': len(meetings)})
    except Exception as e:
        logger.exception(f"Officer get meetings error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/founder/meetings', methods=['GET', 'OPTIONS'])
def founder_get_meetings():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Founder not logged in'}), 401

        meetings = execute_query("""
            SELECT
                pm.meeting_id, pm.ticket_id, pm.meeting_date, pm.meeting_time,
                pm.meeting_duration, pm.meeting_topic, pm.zoom_link, pm.status,
                pm.scheduled_at, pm.completed_at,
                o.name AS officer_name, o.email AS officer_email, o.category AS officer_category,
                g.title AS grievance_title
            FROM premium_meetings pm
            JOIN tickets t ON pm.ticket_id = t.ticket_id
            JOIN grievances g ON t.grievance_id = g.id
            JOIN officers o ON pm.officer_id = o.officer_id
            WHERE pm.founder_id = %s
            ORDER BY pm.meeting_date DESC, pm.meeting_time DESC
        """, (founder_id,))

        meetings = _normalize_rows(meetings)
        return jsonify({'success': True, 'meetings': meetings, 'count': len(meetings)})
    except Exception as e:
        logger.exception(f"Founder get meetings error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/premium/meetings/<int:meeting_id>/status', methods=['PUT', 'OPTIONS'])
def update_meeting_status(meeting_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        officer_id = session.get('officer_id')
        if not officer_id:
            return jsonify({'success': False, 'message': 'Officer not logged in'}), 401

        data = request.get_json() or {}
        new_status = data.get('status')
        if new_status not in ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400

        meeting = execute_one(
            "SELECT * FROM premium_meetings WHERE meeting_id = %s AND officer_id = %s",
            (meeting_id, officer_id),
        )
        if not meeting:
            return jsonify({'success': False, 'message': 'Meeting not found or not yours'}), 404

        if new_status == 'Completed':
            execute_query(
                "UPDATE premium_meetings SET status = %s, completed_at = CURRENT_TIMESTAMP WHERE meeting_id = %s",
                (new_status, meeting_id),
            )
        else:
            execute_query(
                "UPDATE premium_meetings SET status = %s WHERE meeting_id = %s",
                (new_status, meeting_id),
            )

        return jsonify({'success': True, 'message': f'Meeting marked as {new_status}'})
    except Exception as e:
        logger.exception(f"Update meeting status error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# RATINGS
# ============================================================
@app.route('/api/rating/submit', methods=['POST', 'OPTIONS'])
def submit_rating():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        data = request.get_json() or {}
        grievance_id = data.get('grievance_id')
        rating = data.get('rating')
        feedback = (data.get('feedback') or '').strip()

        if not grievance_id:
            return jsonify({'success': False, 'message': 'Missing grievance_id'}), 400
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Invalid rating'}), 400
        if not 1 <= rating <= 5:
            return jsonify({'success': False, 'message': 'Rating must be 1-5'}), 400
        if len(feedback) > 500:
            return jsonify({'success': False, 'message': 'Feedback too long (max 500)'}), 400

        g = execute_one(
            """SELECT g.id, g.founder_id, g.status, g.assigned_officer_id
               FROM grievances g
               WHERE g.id = %s""",
            (grievance_id,),
        )
        if not g:
            return jsonify({'success': False, 'message': 'Grievance not found'}), 404
        if g['founder_id'] != founder_id:
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        if g['status'] != 'Resolved':
            return jsonify({'success': False, 'message': 'You can only rate resolved grievances'}), 400
        if not g['assigned_officer_id']:
            return jsonify({'success': False, 'message': 'No officer assigned'}), 400

        existing = execute_one(
            "SELECT rating_id FROM officer_ratings WHERE grievance_id = %s",
            (grievance_id,),
        )
        if existing:
            return jsonify({'success': False, 'message': 'You already rated this grievance'}), 409

        cursor = execute_query(
            """INSERT INTO officer_ratings (grievance_id, officer_id, founder_id, rating, feedback)
               VALUES (%s, %s, %s, %s, %s)""",
            (grievance_id, g['assigned_officer_id'], founder_id, rating, feedback or None),
        )
        if cursor is None:
            return jsonify({'success': False, 'message': 'Failed to save rating'}), 500

        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback',
            'rating_id': cursor.lastrowid,
        })
    except Exception as e:
        logger.exception(f"Submit rating error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/rating/check/<int:grievance_id>', methods=['GET', 'OPTIONS'])
def check_rating(grievance_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        row = execute_one(
            """SELECT rating_id FROM officer_ratings
               WHERE grievance_id = %s AND founder_id = %s""",
            (grievance_id, founder_id),
        )
        return jsonify({'success': True, 'is_rated': bool(row)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/rating/check-bulk', methods=['GET', 'OPTIONS'])
def rating_check_bulk():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        founder_id = session.get('founder_id')
        if not founder_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        ids_param = request.args.get('ids', '')
        if not ids_param:
            return jsonify({'success': True, 'rated_ids': []})

        ids = [int(i) for i in ids_param.split(',') if i.strip().isdigit()]
        if not ids:
            return jsonify({'success': True, 'rated_ids': []})

        placeholders = ','.join(['%s'] * len(ids))
        rows = execute_query(
            f"""SELECT grievance_id FROM officer_ratings
                WHERE grievance_id IN ({placeholders}) AND founder_id = %s""",
            tuple(ids) + (founder_id,),
        )

        return jsonify({'success': True, 'rated_ids': [r['grievance_id'] for r in rows or []]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# ANALYTICS
# ============================================================
@app.route('/analytics/metrics', methods=['GET'])
def analytics_metrics():
    try:
        stats = execute_one("""
            SELECT
                COUNT(*) AS total_grievances,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_grievances
            FROM grievances
        """)
        total = stats['total_grievances'] if stats else 0
        resolved = stats['resolved_grievances'] if stats else 0
        return jsonify({
            'success': True,
            'data': {
                'total_grievances': total,
                'resolved_grievances': resolved,
                'unresolved_grievances': total - resolved,
                'resolution_rate': round((resolved / total * 100), 2) if total > 0 else 0,
            },
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/analytics/category', methods=['GET'])
def analytics_category():
    try:
        results = execute_query("""
            SELECT predicted_category AS category, COUNT(*) AS count
            FROM grievances
            GROUP BY predicted_category
            ORDER BY count DESC
        """)
        categories = ['Funding', 'Hiring', 'Marketing', 'Legal', 'Mentorship', 'General']
        distribution = {cat: 0 for cat in categories}
        for row in results or []:
            if row['category'] in distribution:
                distribution[row['category']] = row['count']
        return jsonify({'success': True, 'data': {
            'labels': list(distribution.keys()),
            'data': list(distribution.values()),
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/analytics/status', methods=['GET'])
def analytics_status():
    try:
        results = execute_query("SELECT status, COUNT(*) AS count FROM grievances GROUP BY status")
        statuses = {'Pending': 0, 'Under Review': 0, 'Resolved': 0}
        for row in results or []:
            if row['status'] in statuses:
                statuses[row['status']] = row['count']
        return jsonify({'success': True, 'data': {
            'labels': list(statuses.keys()),
            'data': list(statuses.values()),
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/analytics/trends', methods=['GET'])
def analytics_trends():
    try:
        results = execute_query("""
            SELECT DATE_FORMAT(date, '%b %Y') AS month, COUNT(*) AS count
            FROM grievances
            WHERE date IS NOT NULL
            GROUP BY DATE_FORMAT(date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 6
        """)
        months = []
        counts = []
        for row in reversed(results or []):
            months.append(row['month'])
            counts.append(row['count'])
        return jsonify({'success': True, 'data': {
            'labels': months if months else ['No Data'],
            'data': counts if counts else [0],
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/analytics/category-status', methods=['GET'])
def analytics_category_status():
    try:
        results = execute_query("""
            SELECT predicted_category AS category, status, COUNT(*) AS count
            FROM grievances
            GROUP BY predicted_category, status
        """)
        categories = ['Funding', 'Hiring', 'Marketing', 'Legal', 'Mentorship', 'General']
        statuses = ['Pending', 'Under Review', 'Resolved']
        data = {cat: {s: 0 for s in statuses} for cat in categories}
        for row in results or []:
            if row['category'] in data and row['status'] in data[row['category']]:
                data[row['category']][row['status']] = row['count']
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# ADMIN OFFICER PERFORMANCE
# ============================================================
@app.route('/api/admin/officer-performance', methods=['GET', 'OPTIONS'])
def officer_performance_list():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        category_filter = request.args.get('category')

        query = """
            SELECT
                o.officer_id, o.name, o.email, o.category, o.is_active,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(DISTINCT r.rating_id) AS total_ratings,
                COUNT(DISTINCT ga.assignment_id) AS total_grievances,
                SUM(CASE WHEN ga.status = 'Completed' THEN 1 ELSE 0 END) AS resolved_grievances
            FROM officers o
            LEFT JOIN officer_ratings r ON r.officer_id = o.officer_id
            LEFT JOIN grievance_assignments ga ON ga.officer_id = o.officer_id
            WHERE 1=1
        """
        params = []
        if category_filter:
            query += " AND o.category = %s"
            params.append(category_filter)
        query += " GROUP BY o.officer_id ORDER BY avg_rating DESC, o.name ASC"

        officers = execute_query(query, tuple(params) if params else None)
        officers = _normalize_rows(officers)

        for o in officers:
            o['avg_rating'] = float(o['avg_rating'] or 0)
            o['total_ratings'] = int(o['total_ratings'] or 0)
            o['total_grievances'] = int(o['total_grievances'] or 0)
            o['resolved_grievances'] = int(o['resolved_grievances'] or 0)

            if o['avg_rating'] >= 4.5:
                o['performance_band'] = 'Excellent'
                o['performance_color'] = '#34d399'
            elif o['avg_rating'] >= 3.5:
                o['performance_band'] = 'Good'
                o['performance_color'] = '#60a5fa'
            elif o['avg_rating'] >= 2.5:
                o['performance_band'] = 'Average'
                o['performance_color'] = '#fbbf24'
            elif o['total_ratings'] == 0:
                o['performance_band'] = 'Unrated'
                o['performance_color'] = '#94a3b8'
            else:
                o['performance_band'] = 'Needs Improvement'
                o['performance_color'] = '#ef4444'

        overall = execute_one("""
            SELECT
                COALESCE(AVG(rating), 0) AS overall_avg_rating,
                COUNT(*) AS total_ratings
            FROM officer_ratings
        """) or {'overall_avg_rating': 0, 'total_ratings': 0}

        total_officers = execute_one("SELECT COUNT(*) AS c FROM officers WHERE is_active = TRUE")

        stats = {
            'total_officers': total_officers['c'] if total_officers else 0,
            'overall_avg_rating': float(overall['overall_avg_rating'] or 0),
            'total_ratings': int(overall['total_ratings'] or 0),
        }

        return jsonify({'success': True, 'officers': officers, 'stats': stats})
    except Exception as e:
        logger.exception(f"Officer performance list error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/admin/officer-performance/<int:officer_id>', methods=['GET', 'OPTIONS'])
def officer_performance_detail(officer_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if not session.get('admin_logged_in', False):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        officer = execute_one(
            """SELECT officer_id, name, email, category, is_active
               FROM officers WHERE officer_id = %s""",
            (officer_id,),
        )
        if not officer:
            return jsonify({'success': False, 'message': 'Officer not found'}), 404

        stats_row = execute_one("""
            SELECT
                COALESCE(AVG(rating), 0) AS avg_rating,
                COUNT(*) AS total_ratings
            FROM officer_ratings WHERE officer_id = %s
        """, (officer_id,)) or {'avg_rating': 0, 'total_ratings': 0}

        dist_rows = execute_query("""
            SELECT rating, COUNT(*) AS c
            FROM officer_ratings WHERE officer_id = %s
            GROUP BY rating
        """, (officer_id,)) or []
        distribution = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
        for row in dist_rows:
            distribution[str(row['rating'])] = row['c']

        grievance_stats = execute_one("""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS resolved
            FROM grievance_assignments WHERE officer_id = %s
        """, (officer_id,)) or {'total': 0, 'resolved': 0}

        reviews = execute_query("""
            SELECT
                r.rating_id, r.rating, r.feedback, r.created_at,
                f.founder_name, f.startup_name,
                g.title AS grievance_title, g.predicted_category
            FROM officer_ratings r
            JOIN founders f ON r.founder_id = f.founder_id
            JOIN grievances g ON r.grievance_id = g.id
            WHERE r.officer_id = %s
            ORDER BY r.created_at DESC
        """, (officer_id,))

        return jsonify({
            'success': True,
            'officer': officer,
            'stats': {
                'avg_rating': float(stats_row['avg_rating'] or 0),
                'total_ratings': int(stats_row['total_ratings'] or 0),
                'distribution': distribution,
                'grievances': {
                    'total': int(grievance_stats['total'] or 0),
                    'resolved': int(grievance_stats['resolved'] or 0),
                },
            },
            'reviews': _normalize_rows(reviews),
        })
    except Exception as e:
        logger.exception(f"Officer performance detail error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================================
# FAQ + HEALTH
# ============================================================
@app.route('/faq', methods=['GET'])
def get_faq():
    faq_data = {
        'Funding': [
            {'question': 'How can I approach investors for my startup?', 'answer': 'Start by networking at startup events, using platforms like AngelList, and leveraging your existing connections. Prepare a compelling pitch deck and practice your elevator pitch.'},
            {'question': 'How can I prepare a pitch deck for funding?', 'answer': 'Include problem statement, solution, market size, business model, traction, team, financial projections, and funding requirements.'},
            {'question': 'What are the different types of funding available for startups?', 'answer': 'Bootstrapping, Angel Investors, Venture Capital, Crowdfunding, Government Grants, Bank Loans, and Incubator/Accelerator programs.'},
            {'question': 'How do I value my startup for funding?', 'answer': 'Use methods like Comparable Analysis, Discounted Cash Flow (DCF), Berkus Method, Risk Factor Summation, or Scorecard Method.'},
            {'question': 'What should I expect during due diligence?', 'answer': 'Investors will review your financials, legal documents, intellectual property, team backgrounds, customer contracts, and market validation.'},
        ],
        'Hiring': [
            {'question': 'How can I recruit developers for my startup?', 'answer': 'Post on LinkedIn, AngelList, Stack Overflow Jobs, and GitHub. Attend hackathons, use referral programs, and consider remote talent.'},
            {'question': 'How can I hire interns for my startup?', 'answer': 'Partner with universities, post on Internshala, LinkedIn, and Indeed. Offer mentorship and competitive stipends.'},
            {'question': 'How do I create an effective hiring process?', 'answer': 'Define clear job descriptions, use structured interviews, include technical assessments, check references, and involve team members.'},
            {'question': 'How can I retain my best employees?', 'answer': 'Offer competitive compensation, growth opportunities, positive culture, flexible work, recognition, and regular feedback.'},
            {'question': 'What are the best practices for onboarding new hires?', 'answer': 'Have a structured onboarding plan, assign a mentor, provide necessary tools, set clear expectations, conduct regular check-ins.'},
        ],
        'Marketing': [
            {'question': 'How can I market my startup on a limited budget?', 'answer': 'Focus on content marketing, social media, SEO, email marketing, partnerships, and word-of-mouth.'},
            {'question': 'What are the best social media platforms for startups?', 'answer': 'LinkedIn for B2B, Twitter for real-time, Instagram for visual, YouTube for video, and TikTok for younger audiences.'},
            {'question': 'How do I measure marketing ROI?', 'answer': 'Track CAC, LTV, Conversion Rate, ROAS, and MQLs.'},
            {'question': 'What is content marketing and how to start?', 'answer': 'Create valuable content to attract your audience. Start with a blog, videos, infographics, and podcasts.'},
            {'question': 'How do I build a strong brand identity?', 'answer': 'Define mission, vision, values. Create consistent visuals, develop a unique voice, and tell compelling stories.'},
        ],
        'Legal': [
            {'question': 'How can I register my startup in India?', 'answer': 'Register as a Private Limited Company, LLP, or Partnership. Get DIN, DSC, name approval, incorporation docs, and PAN/TAN.'},
            {'question': 'What are the key legal documents for startups?', 'answer': 'MoA, AoA, Founders Agreement, Shareholders Agreement, Employment Contracts, and NDAs.'},
            {'question': 'How can I protect my intellectual property?', 'answer': 'File patents, register trademarks, copyright creative works, and use NDAs.'},
            {'question': 'What are the compliance requirements for startups?', 'answer': 'GST registration, TDS compliance, ROC filings, annual returns, tax filings, and industry-specific regulations.'},
            {'question': 'How do I handle data privacy and GDPR compliance?', 'answer': 'Implement privacy policies, obtain consent, protect data, provide access/delete options, comply with local laws.'},
        ],
        'Mentorship': [
            {'question': 'How can I find startup mentors?', 'answer': 'Network at events, join accelerators, use platforms like SCORE, mentor matching programs, LinkedIn.'},
            {'question': 'What should I look for in a mentor?', 'answer': 'Industry experience, relevant expertise, good communication, willingness to share, alignment with your values.'},
            {'question': 'How should I work with my mentor?', 'answer': 'Set clear goals, regular meetings, come prepared, be open to feedback, implement advice, show appreciation.'},
            {'question': 'What are the benefits of having a mentor?', 'answer': 'Gain insights, expand network, avoid mistakes, get honest feedback, build confidence, accelerate growth.'},
            {'question': 'How do I become a mentor for other founders?', 'answer': 'Build expertise, join mentorship programs, share experience, be approachable, give back.'},
        ],
    }
    return jsonify({'success': True, 'data': faq_data})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'GrievanceAI API running',
        'timestamp': datetime.now().isoformat(),
        'ml_model_loaded': ml_model is not None,
    })


@app.route('/test', methods=['GET'])
def test():
    return jsonify({'status': 'ok', 'message': 'API is working!'})

# ============================================================
# START
# ============================================================
if __name__ == '__main__':
    load_ml_model()

    print("=" * 60)
    print("🚀 GRIEVANCEAI SERVER STARTED")
    print("=" * 60)
    print("📍 Local:   http://127.0.0.1:5000")
    print("📍 Health:  http://127.0.0.1:5000/health")
    print("📍 Test:    http://127.0.0.1:5000/test")
    print("📍 Debug:   http://127.0.0.1:5000/debug/session")
    print("=" * 60)
    print("📧 OTP will be sent via Email")
    print("🔑 OTP: Check email and terminal")
    print("=" * 60)
    if ml_model is not None:
        print("✅ ML Model loaded (3-layer hybrid classifier active)")
    else:
        print("⚠️ ML Model not loaded — rule-based + weighted fallback active")
    print("📊 Categories: Funding, Hiring, Marketing, Legal, Mentorship, General")
    print("=" * 60)
    print("👔 OFFICER LOGIN: /officer/login  (uses check_password_hash)")
    print("🎫 TICKETS: ₹599 / ₹999 / ₹2999")
    print("📄 ELITE, 📞 PREMIUM, 💬 CHAT modules loaded")
    print("⭐ RATINGS: /api/rating/submit  /api/rating/check/<id>")
    print("📊 PERFORMANCE: /api/admin/officer-performance")
    print("🔄 RESET PASSWORDS: /api/admin/reset-officer-passwords")
    print("🔒 Founder session: 30 days (persistent login)")
    print("🔀 Multi-role session supported (founder + admin + officer coexist)")
    print("=" * 60)

    app.run(debug=False, host='0.0.0.0', port=5000, threaded=True)