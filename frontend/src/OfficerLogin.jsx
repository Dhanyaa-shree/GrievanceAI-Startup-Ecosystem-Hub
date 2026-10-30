import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const OfficerLogin = ({ onOfficerLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);        // 1 = landing, 2 = form
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [existingOfficer, setExistingOfficer] = useState(null);

  // Always ask backend if an officer session is alive
  useEffect(() => {
    fetch('/officer/check-auth', {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.is_logged_in && data.officer) {
          setExistingOfficer(data.officer);
        }
      })
      .catch(() => {});
  }, []);

  const handleContinue = () => {
    if (!existingOfficer) return;

    // Hydrate sessionStorage so the rest of the app works
    sessionStorage.setItem('officerId', existingOfficer.id);
    sessionStorage.setItem('officerName', existingOfficer.name);
    sessionStorage.setItem('officerCategory', existingOfficer.category || '');
    sessionStorage.setItem('officerEmail', existingOfficer.email || '');
    sessionStorage.setItem('officerLoggedIn', 'true');

    onOfficerLogin(existingOfficer);
    navigate('/officer-dashboard');
  };

  const handleLogoutExisting = async () => {
    await fetch('/officer/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    ['officerId', 'officerName', 'officerCategory', 'officerEmail', 'officerLoggedIn']
      .forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    setExistingOfficer(null);
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Welcome ${data.officer.name}!`);
        sessionStorage.setItem('officerId', data.officer.id);
        sessionStorage.setItem('officerName', data.officer.name);
        sessionStorage.setItem('officerCategory', data.officer.category);
        sessionStorage.setItem('officerEmail', data.officer.email);
        sessionStorage.setItem('officerLoggedIn', 'true');
        onOfficerLogin(data.officer);
        navigate('/officer-dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch {
      toast.error('Network error. Make sure backend is running.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <span className="auth-icon">👨‍💼</span>
          <h2>
            {step === 1 ? 'Officer Login' : 'Sign in as Officer'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {step === 1
              ? 'Continue with your existing session or log in'
              : 'Sign in to manage your assigned grievances'}
          </p>
        </div>

        {/* ── STEP 1: Landing ─────────────────────────────── */}
        {step === 1 && (
          <div>
            {existingOfficer && (
              <>
                <div className="continue-session-card">
                  <button
                    className="btn btn-success btn-full"
                    onClick={handleContinue}
                    style={{ flexDirection: 'column', padding: '14px 20px', gap: 2 }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>
                      ✅ Continue as {existingOfficer.name}
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500 }}>
                      Officer — {existingOfficer.category}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutExisting}
                    className="session-switch-link"
                  >
                    Log in as a different officer →
                  </button>
                </div>
                <div className="auth-divider">
                  <span>or</span>
                </div>
              </>
            )}

            <button
              className="btn btn-primary btn-full"
              onClick={() => setStep(2)}
            >
              Login
            </button>
          </div>
        )}

        {/* ── STEP 2: Officer form ────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>📧 Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
              />
              <small className="form-hint">Use your official email (e.g., placement1@clg.edu)</small>
            </div>
            <div className="form-group">
              <label>🔑 Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
              <small className="form-hint">Default password: officer123</small>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Officer'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => setStep(1)}
              style={{ marginTop: '10px' }}
            >
              Back
            </button>
          </form>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            ← Back to Home
          </Link>
          <span style={{ color: 'var(--text-muted)', margin: '0 10px' }}>|</span>
          <Link to="/admin-login" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            🔒 Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfficerLogin;