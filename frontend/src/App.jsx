import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Import all existing components
import AdminDashboard from './AdminDashboard';
import MyTickets from './MyTickets';
import PaymentPage from './PaymentPage';
import FounderChat from './FounderChat';
import OfficerChat from './OfficerChat';
import OfficerLogin from './OfficerLogin';
import OfficerDashboard from './OfficerDashboard';
import OfficerGrievances from './OfficerGrievances';
import MyGrievances from './MyGrievances';

// Elite & Premium Imports
import EliteChat from './EliteChat';
import PremiumBooking from './PremiumBooking';
import MyMeetings from './MyMeetings';

// Officer Module - Elite & Premium
import OfficerEliteReview from './OfficerEliteReview';
import OfficerMeetings from './OfficerMeetings';

// ⭐ Rating Module
import OfficerPerformance from './OfficerPerformance';
import OfficerDetail from './OfficerDetail';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// ============================================================
// HOME PAGE — Enterprise SaaS Redesign with background image
// ============================================================
const Home = () => {
  return (
    <div className="home-page ent-home">

      {/* ═══ NAVIGATION ═══ */}
      <nav className="ent-nav">
        <div className="ent-nav-inner">
          <Link to="/" className="ent-brand">
            <div className="ent-brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
                      stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
                <path d="M12 22V12M3 7l9 5 9-5"
                      stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="ent-brand-text">GrievanceAI</span>
          </Link>

          <div className="ent-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Testimonials</a>
          </div>

          <div className="ent-nav-actions">
            <Link to="/register" className="ent-nav-signin">Sign in</Link>
            <Link to="/register" className="ent-nav-cta">
              Get Started <span className="ent-arrow">→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO (background image applied via CSS) ═══ */}
      <section className="ent-hero">
        <div className="ent-hero-inner">
          <h1 className="ent-hero-h1">
            Grievance<span className="ent-hero-accent">AI</span>
          </h1>

          <p className="ent-hero-tagline">Startup Ecosystem Intelligence Hub</p>

          <p className="ent-hero-subtitle">
            Streamline founder grievances with AI-powered classification,
            intelligent routing, and seamless resolution.
          </p>

          <div className="ent-hero-actions">
            <Link to="/register" className="ent-btn-primary">
              Get Started Now <span className="ent-arrow">→</span>
            </Link>
            <a href="#how" className="ent-btn-secondary">
              See how it works
            </a>
          </div>

          {/* Floating stats card */}
          <div className="ent-hero-card">
            <div className="ent-hero-tiles">
              <div className="ent-tile ent-tile-pink">
                <div className="ent-tile-num">248</div>
                <div className="ent-tile-label">Grievances Handled</div>
                <div className="ent-tile-progress">
                  <div className="ent-tile-progress-fill" style={{ width: '78%' }} />
                </div>
                <div className="ent-tile-delta ent-delta-up">+12% this month</div>
              </div>

              <div className="ent-tile ent-tile-green">
                <div className="ent-tile-num">87%</div>
                <div className="ent-tile-label">Resolution Rate</div>
                <div className="ent-tile-progress">
                  <div className="ent-tile-progress-fill" style={{ width: '87%' }} />
                </div>
                <div className="ent-tile-delta">across all categories</div>
              </div>

              <div className="ent-tile ent-tile-blue">
                <div className="ent-tile-num">2.4h</div>
                <div className="ent-tile-label">Avg Response</div>
                <div className="ent-tile-sparkline">
                  <svg viewBox="0 0 100 24" preserveAspectRatio="none">
                    <polyline
                      points="0,18 15,14 30,16 45,10 60,6 75,9 90,4 100,8"
                      fill="none" stroke="#3B82F6" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="ent-tile-delta ent-delta-down">-18% faster</div>
              </div>
            </div>

            <div className="ent-hero-divider" />

            <div className="ent-chart">
              <div className="ent-chart-title">Category Distribution</div>
              <div className="ent-chart-bars">
                <div className="ent-bar">
                  <div className="ent-bar-fill" style={{ height: '80%', background: 'linear-gradient(180deg,#7C3AED,#A78BFA)' }} />
                  <span>Funding</span>
                </div>
                <div className="ent-bar">
                  <div className="ent-bar-fill" style={{ height: '55%', background: 'linear-gradient(180deg,#EC4899,#F472B6)' }} />
                  <span>Hiring</span>
                </div>
                <div className="ent-bar">
                  <div className="ent-bar-fill" style={{ height: '92%', background: 'linear-gradient(180deg,#10B981,#34D399)' }} />
                  <span>Marketing</span>
                </div>
                <div className="ent-bar">
                  <div className="ent-bar-fill" style={{ height: '48%', background: 'linear-gradient(180deg,#F59E0B,#FBBF24)' }} />
                  <span>Legal</span>
                </div>
                <div className="ent-bar">
                  <div className="ent-bar-fill" style={{ height: '35%', background: 'linear-gradient(180deg,#3B82F6,#60A5FA)' }} />
                  <span>Mentorship</span>
                </div>
                <div className="ent-bar">
                  <div className="ent-bar-fill" style={{ height: '62%', background: 'linear-gradient(180deg,#8B5CF6,#C4B5FD)' }} />
                  <span>General</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUSTED BY — with attractive SVG logos ═══ */}
      <section className="ent-trusted">
        <p className="ent-trusted-caption">Trusted by founders across India</p>
        <div className="ent-trusted-logos">

          {/* T-Hub */}
          <div className="ent-logo-mark" title="T-Hub">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="4" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M12 14h16M20 14v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="ent-logo-text">T-Hub</span>
          </div>

          {/* Startup India */}
          <div className="ent-logo-mark" title="Startup India">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M20 8l2.5 6.5L29 17l-6.5 2.5L20 26l-2.5-6.5L11 17l6.5-2.5L20 8z"
                    fill="currentColor" opacity="0.85"/>
            </svg>
            <span className="ent-logo-text">Startup India</span>
          </div>

          {/* NASSCOM */}
          <div className="ent-logo-mark" title="NASSCOM">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <path d="M8 30V10l24 20V10" stroke="currentColor" strokeWidth="3"
                    strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
            <span className="ent-logo-text">NASSCOM</span>
          </div>

          {/* Sequoia */}
          <div className="ent-logo-mark" title="Sequoia">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="20" cy="20" r="4" fill="currentColor"/>
              <path d="M20 6v6M20 28v6M6 20h6M28 20h6"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="ent-logo-text">Sequoia</span>
          </div>

          {/* Accel */}
          <div className="ent-logo-mark" title="Accel">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <path d="M20 8L32 32H8L20 8z" stroke="currentColor" strokeWidth="2.5"
                    strokeLinejoin="round"/>
              <path d="M14 24h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="ent-logo-text">Accel</span>
          </div>

          {/* Y Combinator */}
          <div className="ent-logo-mark" title="Y Combinator">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="6" width="28" height="28" rx="4" fill="currentColor"/>
              <path d="M14 14l6 8v6M26 14l-6 8"
                    stroke="#FFFFFF" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ent-logo-text">Y Combinator</span>
          </div>

        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="ent-features" id="features">
        <div className="ent-section-inner">
          <h2 className="ent-section-title">Everything you need to resolve grievances</h2>
          <p className="ent-section-sub">
            From submission to resolution — one connected platform for founders, officers, and admins.
          </p>

          <div className="ent-features-grid">
            <div className="ent-feature-card">
              <div className="ent-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4z"
                        stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="ent-feature-title">AI Classification</h3>
              <p className="ent-feature-desc">
                XGBoost model with 92% F1-score across 6 domains — Funding, Hiring, Marketing, Legal, Mentorship, General.
              </p>
            </div>

            <div className="ent-feature-card">
              <div className="ent-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#7C3AED" strokeWidth="2"/>
                  <path d="M12 7v5l3 3" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="ent-feature-title">Smart Routing</h3>
              <p className="ent-feature-desc">
                Auto-assign each grievance to the right specialist based on category and availability.
              </p>
            </div>

            <div className="ent-feature-card">
              <div className="ent-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                        stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="ent-feature-title">Real-time Chat</h3>
              <p className="ent-feature-desc">
                Direct founder ↔ officer messaging with document sharing and read receipts.
              </p>
            </div>

            <div className="ent-feature-card">
              <div className="ent-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2"
                        stroke="#7C3AED" strokeWidth="2"/>
                  <path d="M3 10h18M8 4v3M16 4v3"
                        stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="ent-feature-title">Tiered Service</h3>
              <p className="ent-feature-desc">
                Standard, Elite, or Premium — each tier unlocks a deeper level of expert support.
              </p>
            </div>

            <div className="ent-feature-card">
              <div className="ent-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20V10M10 20V4M16 20v-8M22 20h-20"
                        stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="ent-feature-title">Analytics</h3>
              <p className="ent-feature-desc">
                Interactive dashboards with category, status, and monthly trend insights.
              </p>
            </div>

            <div className="ent-feature-card">
              <div className="ent-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"
                        stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="ent-feature-title">Rating System</h3>
              <p className="ent-feature-desc">
                Founders rate officers after resolution — driving accountability and quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="ent-how" id="how">
        <div className="ent-section-inner">
          <h2 className="ent-section-title">How GrievanceAI works</h2>
          <p className="ent-section-sub">
            Three steps from problem to resolution.
          </p>

          <div className="ent-how-grid">
            <div className="ent-how-step">
              <div className="ent-how-num">1</div>
              <h3 className="ent-how-title">Submit</h3>
              <p className="ent-how-desc">
                Describe your grievance. Our AI classifies it in seconds across 6 domains.
              </p>
            </div>

            <div className="ent-how-connector" />

            <div className="ent-how-step">
              <div className="ent-how-num">2</div>
              <h3 className="ent-how-title">Connect</h3>
              <p className="ent-how-desc">
                Get matched with the right specialist based on category and availability.
              </p>
            </div>

            <div className="ent-how-connector" />

            <div className="ent-how-step">
              <div className="ent-how-num">3</div>
              <h3 className="ent-how-title">Resolve</h3>
              <p className="ent-how-desc">
                Chat, share documents, or book a video call. Track progress end-to-end.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="ent-pricing" id="pricing">
        <div className="ent-section-inner">
          <h2 className="ent-section-title">Simple pricing, zero surprises</h2>
          <p className="ent-section-sub">
            Choose a service tier and get matched with the right expert.
          </p>

          <div className="ent-pricing-grid">
            <div className="ent-price-card">
              <div className="ent-price-name">Standard</div>
              <div className="ent-price-desc">For founders who need quick expert chat.</div>
              <div className="ent-price-amount-row">
                <span className="ent-price-currency">₹</span>
                <span className="ent-price-amount">599</span>
                <span className="ent-price-period">/service</span>
              </div>
              <div className="ent-price-divider" />
              <ul className="ent-price-features">
                <li><span className="ent-check">✓</span> Unlimited AI chat</li>
                <li><span className="ent-check">✓</span> Valid for 7 days</li>
                <li><span className="ent-check">✓</span> Response within 24h</li>
                <li><span className="ent-check">✓</span> Track grievance status</li>
              </ul>
              <Link to="/register" className="ent-price-btn-outline">Get Started</Link>
            </div>

            <div className="ent-price-card ent-price-featured">
              <div className="ent-price-badge">★ MOST POPULAR</div>
              <div className="ent-price-name ent-on-violet">Elite</div>
              <div className="ent-price-desc ent-on-violet-soft">
                For founders who need deep document review.
              </div>
              <div className="ent-price-amount-row">
                <span className="ent-price-currency ent-on-violet">₹</span>
                <span className="ent-price-amount ent-on-violet">999</span>
                <span className="ent-price-period ent-on-violet-soft">/service</span>
              </div>
              <div className="ent-price-divider ent-price-divider-featured" />
              <ul className="ent-price-features">
                <li className="ent-on-violet"><span className="ent-check ent-check-featured">✓</span> Everything in Standard</li>
                <li className="ent-on-violet"><span className="ent-check ent-check-featured">✓</span> Document review</li>
                <li className="ent-on-violet"><span className="ent-check ent-check-featured">✓</span> Priority response</li>
                <li className="ent-on-violet"><span className="ent-check ent-check-featured">✓</span> Enhanced chat tools</li>
              </ul>
              <Link to="/register" className="ent-price-btn-featured">Get Started</Link>
            </div>

            <div className="ent-price-card">
              <div className="ent-price-name">Premium</div>
              <div className="ent-price-desc">For founders who need a live expert call.</div>
              <div className="ent-price-amount-row">
                <span className="ent-price-currency">₹</span>
                <span className="ent-price-amount">2,999</span>
                <span className="ent-price-period">/service</span>
              </div>
              <div className="ent-price-divider" />
              <ul className="ent-price-features">
                <li><span className="ent-check">✓</span> Everything in Elite</li>
                <li><span className="ent-check">✓</span> 30-minute video call</li>
                <li><span className="ent-check">✓</span> Zoom meeting link</li>
                <li><span className="ent-check">✓</span> Personalized guidance</li>
              </ul>
              <Link to="/register" className="ent-price-btn-outline">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="ent-testimonials" id="testimonials">
        <div className="ent-section-inner">
          <h2 className="ent-section-title">Loved by founders across India</h2>

          <div className="ent-testimonials-grid">
            {[
              { stars: 5, quote: 'The AI is incredibly accurate. My grievance was routed to the right specialist within minutes.', initials: 'PR', name: 'Priya Reddy', company: 'CloudNova' },
              { stars: 5, quote: 'Fast match to the right expert. Saved us days of email back-and-forth.', initials: 'RS', name: 'Rahul Sharma', company: 'HealthCareAI' },
              { stars: 5, quote: 'Worth every rupee for the document review tier. Got specific, actionable feedback.', initials: 'AK', name: 'Aisha Khan', company: 'FinFlow' },
              { stars: 5, quote: 'Beautiful interface, fast flow. Feels like a premium product, not a college project.', initials: 'VS', name: 'Vikram Singh', company: 'LogisticsPro' },
              { stars: 5, quote: 'Real experts who deliver real value. The Premium call was genuinely helpful.', initials: 'SP', name: 'Sneha Patel', company: 'EdTech Labs' },
              { stars: 5, quote: 'Standard tier alone is enough for most founders. Great value.', initials: 'AM', name: 'Arjun Mehta', company: 'GreenEnergy' },
            ].map((t, i) => (
              <div className="ent-testimonial-card" key={i}>
                <div className="ent-stars">
                  {[...Array(t.stars)].map((_, j) => (
                    <span key={j} className="ent-star">★</span>
                  ))}
                </div>
                <p className="ent-quote">"{t.quote}"</p>
                <div className="ent-author">
                  <div className="ent-avatar">{t.initials}</div>
                  <div className="ent-author-info">
                    <div className="ent-author-name">{t.name}</div>
                    <div className="ent-author-company">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="ent-final-cta">
        <div className="ent-final-inner">
          <h2 className="ent-final-title">Ready to transform your startup journey?</h2>
          <p className="ent-final-sub">
            Join founders across the T-Hub ecosystem using GrievanceAI.
          </p>
          <Link to="/register" className="ent-btn-primary ent-btn-lg">
            Get Started Now <span className="ent-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="ent-footer">
        <div className="ent-footer-inner">
          <div className="ent-footer-brand-col">
            <div className="ent-footer-brand">
              <div className="ent-footer-mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
                        stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
                  <path d="M12 22V12M3 7l9 5 9-5"
                        stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="ent-footer-brand-text">GrievanceAI</span>
            </div>
            <p className="ent-footer-tagline">
              Startup support platform built for founders in the T-Hub ecosystem.
            </p>
          </div>

          <div className="ent-footer-links">
            <div className="ent-footer-col">
              <div className="ent-footer-col-title">Product</div>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <Link to="/faq">FAQ</Link>
              <a href="#how">How it works</a>
            </div>

            <div className="ent-footer-col">
              <div className="ent-footer-col-title">Company</div>
              <a href="#about">About</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="ent-footer-col">
              <div className="ent-footer-col-title">Legal</div>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
              <a href="#status">Status</a>
            </div>
          </div>
        </div>

        <div className="ent-footer-bottom">
          <span>© 2026 GrievanceAI. All rights reserved.</span>
          <div className="ent-footer-socials">
            <a href="#twitter" aria-label="Twitter">𝕏</a>
            <a href="#linkedin" aria-label="LinkedIn">in</a>
            <a href="#github" aria-label="GitHub">gh</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

// ============================================================
// REGISTER/LOGIN PAGE  (founder — with "Continue as" feature)
// ============================================================
const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);           // 1 = landing, 2 = form, 3 = OTP
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [existingFounder, setExistingFounder] = useState(null);

  // Always ask backend if a founder session is alive — independent of localStorage
  useEffect(() => {
    fetch('/check-auth', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.is_logged_in) {
          setExistingFounder({
            id: data.founder_id,
            name: data.founder_name,
            startup: data.startup_name,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleContinue = () => {
    if (!existingFounder) return;
    onLogin(existingFounder.id, existingFounder.name);
    navigate('/dashboard');
  };

  const handleLogoutExisting = async () => {
    await fetch('/founder-logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    localStorage.removeItem('founderId');
    localStorage.removeItem('founderName');
    setExistingFounder(null);
    setStep(1);
  };

  const handleSendOTP = async () => {
    if (!mobile || mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobile_number: mobile, email }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('✅ OTP sent to your email!');
        setStep(3);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error. Make sure backend is running.');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobile_number: mobile, otp, email }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Login successful!');
        onLogin(data.founder_id, data.founder_name);
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Invalid OTP');
        setOtp('');
      }
    } catch {
      toast.error('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <span className="auth-icon">🔐</span>
          <h2>
            {step === 1 && 'Login to GrievanceAI'}
            {step === 2 && 'Enter your details'}
            {step === 3 && 'Verify OTP'}
          </h2>
        </div>

        {/* STEP 1 — landing */}
        {step === 1 && (
          <div>
            {existingFounder && (
              <>
                <div className="continue-session-card">
                  <button
                    className="btn btn-success btn-full"
                    onClick={handleContinue}
                    style={{ flexDirection: 'column', padding: '14px 20px', gap: 2 }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>
                      ✅ Continue as {existingFounder.name}
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500 }}>
                      {existingFounder.startup || 'Founder'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutExisting}
                    className="session-switch-link"
                  >
                    Log in as a different founder →
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

        {/* STEP 2 — details */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label>📧 Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
              <small className="form-hint">OTP will be sent to this email</small>
            </div>
            <div className="form-group">
              <label>📱 Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
                required
              />
              <small className="form-hint">Only whitelisted numbers can login</small>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleSendOTP}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setStep(1)}
              style={{ marginTop: '10px' }}
            >
              Back
            </button>
          </div>
        )}

        {/* STEP 3 — OTP */}
        {step === 3 && (
          <div>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
              />
              <small className="form-hint">Check your email for OTP</small>
            </div>
            <button
              className="btn btn-success btn-full"
              onClick={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP & Login'}
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => {
                setStep(2);
                setOtp('');
              }}
              style={{ marginTop: '10px' }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// SIDEBAR LAYOUT
// ============================================================
const SidebarLayout = ({ children, userType, userName, userEmail, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/my-tickets', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      }
      setLoading(false);
    };

    if (userType === 'founder') {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [userType, location.pathname]);

  const hasStandardTicket = tickets.some(t => t.ticket_type === 'chat' && t.status === 'Active');
  const hasEliteTicket = tickets.some(t => t.ticket_type === 'document' && t.status === 'Active');
  const hasPremiumTicket = tickets.some(t => t.ticket_type === 'call' && t.status === 'Active');

  const founderMenu = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { id: 'submit', icon: '📩', label: 'Submit Grievance', path: '/submit-grievance' },
    { id: 'mygrievances', icon: '📋', label: 'My Grievances', path: '/my-grievances' },
    { id: 'tickets', icon: '🎫', label: 'My Tickets', path: '/my-tickets' },

    ...(hasStandardTicket ? [{ id: 'chat', icon: '💬', label: 'Chat', path: '/founder-chat' }] : []),
    ...(hasEliteTicket ? [{ id: 'elite', icon: '🥈', label: 'Elite Chat', path: '/elite-chat' }] : []),
    ...(hasPremiumTicket ? [
      { id: 'premium', icon: '🥇', label: 'Premium Booking', path: '/premium-booking' },
      { id: 'meetings', icon: '📅', label: 'My Meetings', path: '/my-meetings' }
    ] : []),

    { id: 'faq', icon: '📚', label: 'FAQ', path: '/faq' },
  ];

  const adminMenu = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/admin' },
    { id: 'analytics', icon: '📈', label: 'Analytics', path: '/analytics' },
    { id: 'performance', icon: '👥', label: 'Officer Performance', path: '/admin/officer-performance' },
  ];

  const officerMenu = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/officer-dashboard' },
    { id: 'grievances', icon: '📋', label: 'My Grievances', path: '/officer-grievances' },
    { id: 'standard', icon: '🥉', label: 'STANDARD', path: '/officer-chat' },
    { id: 'elite', icon: '🥈', label: 'ELITE', path: '/officer-elite-review' },
    { id: 'premium', icon: '🥇', label: 'PREMIUM', path: '/officer-meetings' },
  ];

  const getMenuItems = () => {
    if (userType === 'admin') return adminMenu;
    if (userType === 'officer') return officerMenu;
    return founderMenu;
  };

  const menuItems = getMenuItems();

  const isActivePath = (path) => {
    if (location.pathname === path) return true;
    if (path !== '/admin' && location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  const handleLogout = async () => {
    if (userType === 'admin') {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminName');
      await fetch('/admin-logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      toast.success('Logged out successfully');
      navigate('/');
      onLogout();
    } else if (userType === 'officer') {
      localStorage.removeItem('officerId');
      localStorage.removeItem('officerName');
      localStorage.removeItem('officerCategory');
      localStorage.removeItem('officerEmail');
      localStorage.removeItem('officerLoggedIn');
      sessionStorage.removeItem('officerId');
      sessionStorage.removeItem('officerName');
      sessionStorage.removeItem('officerCategory');
      sessionStorage.removeItem('officerEmail');
      sessionStorage.removeItem('officerLoggedIn');
      await fetch('/officer/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      toast.success('Logged out successfully');
      navigate('/');
      onLogout();
    } else {
      await fetch('/founder-logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      localStorage.removeItem('founderId');
      localStorage.removeItem('founderName');
      toast.success('Logged out successfully');
      navigate('/');
      onLogout();
    }
  };

  if (loading && userType === 'founder') {
    return (
      <div className="layout-container">
        <div className="sidebar" style={{ width: '260px', minHeight: '100vh' }}>
          <div className="sidebar-logo">
            <div className="brand-mark brand-mark-sm">G</div>
            <span className="sidebar-logo-text" style={{ marginLeft: '10px' }}>GrievanceAI</span>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>Loading...</p>
          </div>
        </div>
        <div className="main-content">{children}</div>
      </div>
    );
  }

  return (
    <div className="layout-container">
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <Link to="/" className="sidebar-logo-link">
            <div className="brand-mark brand-mark-sm">G</div>
            <span className="sidebar-logo-text">GrievanceAI</span>
          </Link>
          <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{userName || 'User'}</div>
            <div className="sidebar-userrole">
              {userType === 'admin' ? '👑 Admin' :
               userType === 'officer' ? '👨‍💼 Officer' : '👤 Founder'}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-nav-item ${isActivePath(item.path) ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {isActivePath(item.path) && <span className="sidebar-nav-indicator" />}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

// ============================================================
// FOUNDER DASHBOARD
// ============================================================
const FounderDashboard = ({ founderId }) => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [founder, setFounder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!founderId) {
      navigate('/register');
      return;
    }
    fetchGrievances();
  }, [founderId]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/my-grievances/${founderId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setGrievances(data.grievances || []);
        setFounder(data.founder);
      }
    } catch (error) {
      toast.error('Failed to load grievances');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Welcome back, {founder?.founder_name || 'Founder'}! 👋</h1>
        <p>Here's what's happening with your startup grievances</p>
      </div>

      {founder && (
        <div className="profile-card glass-card">
          <div className="profile-row">
            <div>
              <h3>👤 {founder.founder_name}</h3>
              <p className="text-secondary">Startup: {founder.startup_name}</p>
              <p className="text-muted">📱 {founder.mobile_number}</p>
              <p className="text-muted">📧 {founder.email}</p>
            </div>
            <div className="profile-stats">
              <div className="stat-badge">
                <span className="stat-number">{grievances.length}</span>
                <span className="stat-label">Total Grievances</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <Link to="/submit-grievance" className="quick-action glass-card">
          <span className="action-icon">📩</span>
          <h3>Submit Grievance</h3>
          <p>Describe your challenge and get AI classification</p>
        </Link>
        <Link to="/my-grievances" className="quick-action glass-card">
          <span className="action-icon">📋</span>
          <h3>View Grievances</h3>
          <p>Track all your submitted grievances</p>
        </Link>
        <Link to="/faq" className="quick-action glass-card">
          <span className="action-icon">📚</span>
          <h3>FAQ</h3>
          <p>Find answers to common startup challenges</p>
        </Link>
      </div>

      <div className="recent-section">
        <h2>Recent Grievances</h2>
        {grievances.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No grievances submitted yet.</p>
            <Link to="/submit-grievance" className="btn btn-primary">Submit Your First Grievance</Link>
          </div>
        ) : (
          <div className="table-container glass-card">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {grievances.slice(0, 5).map((g) => (
                  <tr key={g.id}>
                    <td><strong>{g.title}</strong></td>
                    <td><span className="badge-category">{g.predicted_category}</span></td>
                    <td><span className={`badge status-${g.status.toLowerCase().replace(' ', '-')}`}>{g.status}</span></td>
                    <td>{new Date(g.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// SUBMIT GRIEVANCE
// ============================================================
const SubmitGrievance = ({ founderId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    if (!founderId) {
      navigate('/register');
    }
  }, [founderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    setPrediction(null);
    try {
      const response = await fetch('/submit-grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ founder_id: parseInt(founderId), ...formData })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('✅ Grievance submitted successfully!');
        setPrediction({
          category: data.predicted_category,
          confidence: Math.round(data.category_confidence * 100),
          accuracy: data.model_accuracy || '98.5%'
        });
        setFormData({ title: '', description: '' });
        setTimeout(() => navigate('/my-grievances'), 2000);
      } else {
        toast.error(data.message || 'Failed to submit');
      }
    } catch (error) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>📩 Submit Grievance</h1>
        <p>Describe your challenge and get AI-powered category classification</p>
      </div>

      <div className="card glass-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Grievance Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title of your grievance"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your grievance in detail..."
              required
              rows="6"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </form>

        {prediction && (
          <div className="prediction-result">
            <h3>🤖 AI Prediction</h3>
            <div className="prediction-grid">
              <div className="prediction-item">
                <span className="prediction-label">Category</span>
                <span className="prediction-value">{prediction.category}</span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Confidence</span>
                <span className="prediction-value">{prediction.confidence}%</span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Model Accuracy</span>
                <span className="prediction-value">{prediction.accuracy}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// FAQ PAGE
// ============================================================
const FAQPage = () => {
  const [faqData, setFaqData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Funding');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await fetch('/faq', { credentials: 'include' });
        const data = await response.json();
        if (data.success) setFaqData(data.data);
      } catch (error) {
        toast.error('Failed to load FAQ');
      }
      setLoading(false);
    };
    fetchFAQ();
  }, []);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const categories = ['Funding', 'Hiring', 'Marketing', 'Legal', 'Mentorship'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>📚 Frequently Asked Questions</h1>
        <p>Find answers to common startup challenges</p>
      </div>

      <div className="card glass-card">
        <div className="faq-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              onClick={() => { setSelectedCategory(cat); setExpandedIndex(null); }}
            >
              {cat}
            </button>
          ))}
        </div>

        {faqData && faqData[selectedCategory] && (
          <div className="faq-list">
            {faqData[selectedCategory].map((item, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  className={`faq-item ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(index)}
                >
                  <div className="faq-question">
                    <h4>Q{index + 1}: {item.question}</h4>
                    <span className="faq-toggle">{isExpanded ? '−' : '+'}</span>
                  </div>
                  {isExpanded && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ADMIN LOGIN
// ============================================================
const AdminLogin = ({ onAdminLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Admin login successful!');
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminName', 'Admin');
        onAdminLogin();
        setTimeout(() => navigate('/admin'), 500);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <span className="auth-icon">🛡️</span>
          <h2>Admin Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter admin email"
              required
            />
            <small className="form-hint">Use: thubadmin@gmail.com</small>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// ANALYTICS PAGE
// ============================================================
const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    total_grievances: 0,
    resolved_grievances: 0,
    unresolved_grievances: 0,
    resolution_rate: 0
  });
  const [categoryData, setCategoryData] = useState({ labels: [], data: [] });
  const [statusData, setStatusData] = useState({ labels: [], data: [] });
  const [trendsData, setTrendsData] = useState({ labels: [], data: [] });
  const [allGrievances, setAllGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdmin) {
      toast.error('Please login as admin to view analytics');
      navigate('/admin-login');
      return;
    }
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const grievancesRes = await fetch('/all-grievances', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (grievancesRes.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('adminLoggedIn');
        navigate('/admin-login');
        return;
      }

      const grievancesData = await grievancesRes.json();
      if (grievancesData.success) {
        setAllGrievances(grievancesData.grievances || []);
      }

      const endpoints = [
        '/analytics/metrics',
        '/analytics/category',
        '/analytics/status',
        '/analytics/trends'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint =>
          fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          })
        )
      );

      for (const response of responses) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('adminLoggedIn');
          navigate('/admin-login');
          return;
        }
      }

      const data = await Promise.all(responses.map(r => r.json()));

      if (data[0]?.success && data[0]?.data) {
        setMetrics(data[0].data);
      }
      if (data[1]?.success && data[1]?.data) {
        setCategoryData(data[1].data);
      }
      if (data[2]?.success && data[2]?.data) {
        setStatusData(data[2].data);
      }
      if (data[3]?.success && data[3]?.data) {
        setTrendsData(data[3].data);
      }

    } catch (error) {
      setError('Failed to load analytics data. Please check your connection.');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>📈 Analytics Dashboard</h1>
          <p>Real-time insights and trends</p>
        </div>
        <div className="card glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Failed to Load Analytics</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchAllAnalytics} style={{ marginTop: '20px' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  const hasData = metrics.total_grievances > 0 ||
                  (categoryData.data && categoryData.data.some(d => d > 0));

  if (!hasData) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>📈 Analytics Dashboard</h1>
          <p>Real-time insights and trends</p>
        </div>
        <div className="card glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ marginBottom: '8px' }}>No Data Available</h3>
          <p style={{ color: 'var(--text-secondary)' }}>There are no grievances in the system yet.</p>
          <Link to="/submit-grievance" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Submit Grievance
          </Link>
        </div>
      </div>
    );
  }

  const categoryColors = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
  const statusColors = ['#fbbf24', '#60a5fa', '#34d399'];

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.8)',
          font: { size: 12, weight: '500' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.8)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            let value = context.parsed || 0;
            let total = context.dataset.data.reduce((a, b) => a + b, 0);
            let percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return label + ': ' + value + ' (' + percentage + '%)';
          }
        }
      }
    },
    cutout: '65%',
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.8)',
          font: { size: 12, weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.8)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          stepSize: 1,
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(255,255,255,0.05)',
          drawBorder: false,
        }
      },
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          font: { size: 11 }
        },
        grid: {
          display: false,
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
      },
      point: {
        radius: 4,
        hoverRadius: 7,
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    },
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>📈 Analytics Dashboard</h1>
        <p>Real-time insights and trends</p>
        <button className="btn btn-secondary btn-sm" onClick={fetchAllAnalytics} style={{ marginTop: '8px' }}>
          🔄 Refresh Data
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-value">{metrics.total_grievances}</div>
          <div className="stat-label">Total Grievances</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #34d399' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>{metrics.resolved_grievances}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #f87171' }}>
          <div className="stat-value" style={{ color: '#f87171' }}>{metrics.unresolved_grievances}</div>
          <div className="stat-label">Unresolved</div>
        </div>
        <div className="stat-card glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{metrics.resolution_rate}%</div>
          <div className="stat-label">Resolution Rate</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container glass-card">
          <h3>📊 Category Distribution</h3>
          <div style={{ height: '250px' }}>
            {categoryData.labels && categoryData.labels.length > 0 &&
             categoryData.data && categoryData.data.some(d => d > 0) ? (
              <Doughnut
                data={{
                  labels: categoryData.labels,
                  datasets: [{
                    data: categoryData.data,
                    backgroundColor: categoryColors.slice(0, categoryData.labels.length),
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 2,
                    hoverOffset: 10,
                  }]
                }}
                options={donutOptions}
              />
            ) : (
              <div className="no-data" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No category data available
              </div>
            )}
          </div>
        </div>

        <div className="chart-container glass-card">
          <h3>📈 Status Distribution</h3>
          <div style={{ height: '250px' }}>
            {statusData.labels && statusData.labels.length > 0 &&
             statusData.data && statusData.data.some(d => d > 0) ? (
              <Doughnut
                data={{
                  labels: statusData.labels,
                  datasets: [{
                    data: statusData.data,
                    backgroundColor: statusColors,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 2,
                    hoverOffset: 10,
                  }]
                }}
                options={donutOptions}
              />
            ) : (
              <div className="no-data" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No status data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-container glass-card full-width">
        <h3>📅 Monthly Trends</h3>
        <div style={{ height: '250px' }}>
          {trendsData.labels && trendsData.labels.length > 0 &&
           trendsData.labels[0] !== 'No Data' &&
           trendsData.data && trendsData.data.some(d => d > 0) ? (
            <Line
              data={{
                labels: trendsData.labels,
                datasets: [{
                  label: 'Grievances Submitted',
                  data: trendsData.data,
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#667eea',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 8,
                }]
              }}
              options={lineOptions}
            />
          ) : (
            <div className="no-data" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No trend data available
            </div>
          )}
        </div>
      </div>

      <div className="chart-container glass-card full-width">
        <h3>📊 Category vs Status Breakdown</h3>
        <div style={{ height: '250px' }}>
          {allGrievances && allGrievances.length > 0 ? (
            <Bar
              data={{
                labels: ['Funding', 'Hiring', 'Marketing', 'Legal', 'Mentorship', 'General'],
                datasets: [
                  {
                    label: 'Pending',
                    data: [
                      allGrievances.filter(g => g.predicted_category === 'Funding'    && g.status === 'Pending').length,
                      allGrievances.filter(g => g.predicted_category === 'Hiring'     && g.status === 'Pending').length,
                      allGrievances.filter(g => g.predicted_category === 'Marketing'  && g.status === 'Pending').length,
                      allGrievances.filter(g => g.predicted_category === 'Legal'      && g.status === 'Pending').length,
                      allGrievances.filter(g => g.predicted_category === 'Mentorship' && g.status === 'Pending').length,
                      allGrievances.filter(g => g.predicted_category === 'General'    && g.status === 'Pending').length,
                    ],
                    backgroundColor: 'rgba(251, 191, 36, 0.8)',
                    borderColor: '#fbbf24',
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: 'Under Review',
                    data: [
                      allGrievances.filter(g => g.predicted_category === 'Funding'    && g.status === 'Under Review').length,
                      allGrievances.filter(g => g.predicted_category === 'Hiring'     && g.status === 'Under Review').length,
                      allGrievances.filter(g => g.predicted_category === 'Marketing'  && g.status === 'Under Review').length,
                      allGrievances.filter(g => g.predicted_category === 'Legal'      && g.status === 'Under Review').length,
                      allGrievances.filter(g => g.predicted_category === 'Mentorship' && g.status === 'Under Review').length,
                      allGrievances.filter(g => g.predicted_category === 'General'    && g.status === 'Under Review').length,
                    ],
                    backgroundColor: 'rgba(96, 165, 250, 0.8)',
                    borderColor: '#60a5fa',
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: 'Resolved',
                    data: [
                      allGrievances.filter(g => g.predicted_category === 'Funding'    && g.status === 'Resolved').length,
                      allGrievances.filter(g => g.predicted_category === 'Hiring'     && g.status === 'Resolved').length,
                      allGrievances.filter(g => g.predicted_category === 'Marketing'  && g.status === 'Resolved').length,
                      allGrievances.filter(g => g.predicted_category === 'Legal'      && g.status === 'Resolved').length,
                      allGrievances.filter(g => g.predicted_category === 'Mentorship' && g.status === 'Resolved').length,
                      allGrievances.filter(g => g.predicted_category === 'General'    && g.status === 'Resolved').length,
                    ],
                    backgroundColor: 'rgba(52, 211, 153, 0.8)',
                    borderColor: '#34d399',
                    borderWidth: 1,
                    borderRadius: 4,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: 'rgba(255,255,255,0.8)',
                      font: { size: 11, weight: '500' },
                      usePointStyle: true,
                      pointStyle: 'circle',
                      padding: 15,
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15,12,41,0.9)',
                    titleColor: '#ffffff',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: 'rgba(255,255,255,0.5)',
                      font: { size: 11 }
                    },
                    grid: { display: false }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: 'rgba(255,255,255,0.5)',
                      stepSize: 1,
                      font: { size: 11 }
                    },
                    grid: {
                      color: 'rgba(255,255,255,0.05)',
                      drawBorder: false,
                    }
                  }
                },
                borderRadius: 6,
              }}
            />
          ) : (
            <div className="no-data" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// NAVBAR — hidden on / and all dashboard routes
// ============================================================
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation().pathname;

  const hiddenPaths = [
    '/dashboard', '/submit-grievance', '/my-grievances',
    '/admin', '/analytics', '/my-tickets',
    '/founder-chat', '/officer-chat', '/officer-dashboard',
    '/officer-grievances', '/elite-chat', '/premium-booking',
    '/my-meetings', '/payment', '/officer-elite-review',
    '/officer-meetings',
    '/admin/officer-performance'
  ];

  const isHidden = location === '/' ||
                   hiddenPaths.some(p => location === p || location.startsWith(p + '/'));

  if (isHidden) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-mark">G</div>
          <span className="navbar-brand-text">GrievanceAI</span>
        </Link>
        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>☰</button>
        <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
          <Link to="/">Home</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Login</Link>
          <Link to="/admin-login" className="btn btn-secondary btn-sm">Admin Login</Link>
          <Link to="/officer-login" className="btn btn-secondary btn-sm">Officer Login</Link>
        </div>
      </div>
    </nav>
  );
};

// ============================================================
// FOOTER — hidden on / and dashboard routes
// ============================================================
const Footer = () => {
  const location = useLocation().pathname;

  const hiddenPaths = [
    '/dashboard', '/submit-grievance', '/my-grievances',
    '/admin', '/analytics', '/my-tickets',
    '/founder-chat', '/officer-chat', '/officer-dashboard',
    '/officer-grievances', '/elite-chat', '/premium-booking',
    '/my-meetings', '/payment', '/officer-elite-review',
    '/officer-meetings',
    '/admin/officer-performance'
  ];

  const isHidden = location === '/' ||
                   hiddenPaths.some(p => location === p || location.startsWith(p + '/'));

  if (isHidden) return null;

  return (
    <div className="footer">
      <p className="footer-text">© 2026 GrievanceAI. All rights reserved. Made with ❤️ for founders.</p>
    </div>
  );
};

// ============================================================
// ELITE CHAT WRAPPER
// ============================================================
const EliteChatWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = location.state;
    if (state && state.ticket) {
      setTicketData(state.ticket);
      localStorage.setItem('eliteTicket', JSON.stringify(state.ticket));
      setLoading(false);
      return;
    }

    const savedTicket = localStorage.getItem('eliteTicket');
    if (savedTicket) {
      try {
        const parsed = JSON.parse(savedTicket);
        setTicketData(parsed);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse:', e);
      }
    }

    const fetchTicketFromAPI = async () => {
      try {
        const response = await fetch('/api/my-tickets', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          const eliteTicket = data.tickets.find(t =>
            t.ticket_type === 'document' && t.status === 'Active'
          );
          if (eliteTicket) {
            const ticketData = {
              ticket_id: eliteTicket.ticket_id,
              ticket_type: eliteTicket.ticket_type,
              officer_name: eliteTicket.officer_name,
              officer_id: eliteTicket.officer_id,
              grievance_title: eliteTicket.grievance_title
            };
            setTicketData(ticketData);
            localStorage.setItem('eliteTicket', JSON.stringify(ticketData));
            setLoading(false);
            return;
          }
        }
        toast.error('No active Elite ticket found. Please purchase a ticket first.');
        navigate('/my-grievances');
      } catch (error) {
        toast.error('Unable to load ticket. Please try again.');
        navigate('/my-grievances');
      }
    };

    fetchTicketFromAPI();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading ticket details...</p>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>No ticket data available</p>
      </div>
    );
  }

  return (
    <EliteChat
      ticketId={ticketData.ticket_id}
      founderId={localStorage.getItem('founderId')}
      officerName={ticketData.officer_name || 'Officer'}
      officerId={ticketData.officer_id}
    />
  );
};

// ============================================================
// PREMIUM BOOKING WRAPPER
// ============================================================
const PremiumBookingWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = location.state;

    if (state && state.ticket) {
      setTicketData(state.ticket);
      localStorage.setItem('premiumTicket', JSON.stringify(state.ticket));
      setLoading(false);
      return;
    }

    const savedTicket = localStorage.getItem('premiumTicket');
    if (savedTicket) {
      try {
        const parsed = JSON.parse(savedTicket);
        setTicketData(parsed);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse:', e);
      }
    }

    toast.error('No ticket selected');
    navigate('/my-grievances');
  }, [location, navigate]);

  if (loading || !ticketData) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading ticket details...</p>
      </div>
    );
  }

  return (
    <PremiumBooking
      ticketId={ticketData.ticket_id}
      founderId={localStorage.getItem('founderId')}
      officerName={ticketData.officer_name}
      officerId={ticketData.officer_id}
      grievanceTitle={ticketData.grievance_title}
    />
  );
};

// ============================================================
// MAIN APP
// ============================================================
function App() {
  const [founderId, setFounderId] = useState(localStorage.getItem('founderId') || null);
  const [founderName, setFounderName] = useState(localStorage.getItem('founderName') || null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('adminLoggedIn') === 'true');
  const [isOfficer, setIsOfficer] = useState(
    localStorage.getItem('officerLoggedIn') === 'true' ||
    sessionStorage.getItem('officerLoggedIn') === 'true'
  );
  const [officerName, setOfficerName] = useState(
    localStorage.getItem('officerName') || sessionStorage.getItem('officerName') || ''
  );

  useEffect(() => {
    const verifyFounderSession = async () => {
      const savedFounderId = localStorage.getItem('founderId');
      if (!savedFounderId) return;

      try {
        const response = await fetch('/check-auth', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success && data.is_logged_in) {
          setFounderId(data.founder_id);
          setFounderName(data.founder_name);
          localStorage.setItem('founderId', data.founder_id);
          localStorage.setItem('founderName', data.founder_name);
        }
      } catch (error) {
        console.error('Session verification failed:', error);
      }
    };

    verifyFounderSession();
    window.addEventListener('focus', verifyFounderSession);
    return () => window.removeEventListener('focus', verifyFounderSession);
  }, []);

  const handleFounderLogin = (id, name) => {
    setFounderId(id);
    setFounderName(name);
    localStorage.setItem('founderId', id);
    localStorage.setItem('founderName', name);
  };

  const handleFounderLogout = async () => {
    try {
      await fetch('/founder-logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Founder logout request failed:', e);
    }
    setFounderId(null);
    setFounderName(null);
    localStorage.removeItem('founderId');
    localStorage.removeItem('founderName');
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('adminLoggedIn', 'true');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminName');
  };

  const handleOfficerLogin = (officerData) => {
    setIsOfficer(true);
    setOfficerName(officerData.name);
    sessionStorage.setItem('officerLoggedIn', 'true');
    sessionStorage.setItem('officerName', officerData.name);
    sessionStorage.setItem('officerId', officerData.id);
    sessionStorage.setItem('officerCategory', officerData.category || '');
    sessionStorage.setItem('officerEmail', officerData.email || '');
  };

  const handleOfficerLogout = () => {
    setIsOfficer(false);
    setOfficerName('');
    ['officerId', 'officerName', 'officerCategory', 'officerEmail', 'officerLoggedIn']
      .forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
  };

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(30, 30, 60, 0.95)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px 20px',
            }
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/register" element={<Register onLogin={handleFounderLogin} />} />
          <Route path="/admin-login" element={<AdminLogin onAdminLogin={handleAdminLogin} />} />
          <Route path="/officer-login" element={<OfficerLogin onOfficerLogin={handleOfficerLogin} />} />

          {/* Payment Route */}
          <Route path="/payment" element={<PaymentPage />} />

          {/* Elite & Premium Routes (Founder) */}
          <Route path="/elite-chat" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <EliteChatWrapper />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          <Route path="/premium-booking" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <PremiumBookingWrapper />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          <Route path="/my-meetings" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <MyMeetings founderId={founderId} />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          {/* Existing Founder Routes */}
          <Route path="/dashboard" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <FounderDashboard founderId={founderId} />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          <Route path="/submit-grievance" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <SubmitGrievance founderId={founderId} />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          <Route path="/my-grievances" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <MyGrievances founderId={founderId} />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          <Route path="/my-tickets" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <MyTickets />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          <Route path="/founder-chat" element={
            founderId ? (
              <SidebarLayout
                userType="founder"
                userName={founderName || 'Founder'}
                onLogout={handleFounderLogout}
              >
                <FounderChat />
              </SidebarLayout>
            ) : (
              <Navigate to="/register" />
            )
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            isAdmin ? (
              <SidebarLayout
                userType="admin"
                userName="Admin"
                onLogout={handleAdminLogout}
              >
                <AdminDashboard />
              </SidebarLayout>
            ) : (
              <Navigate to="/admin-login" />
            )
          } />

          <Route path="/analytics" element={
            isAdmin ? (
              <SidebarLayout
                userType="admin"
                userName="Admin"
                onLogout={handleAdminLogout}
              >
                <AnalyticsPage />
              </SidebarLayout>
            ) : (
              <Navigate to="/admin-login" />
            )
          } />

          <Route path="/admin/officer-performance" element={
            isAdmin ? (
              <SidebarLayout
                userType="admin"
                userName="Admin"
                onLogout={handleAdminLogout}
              >
                <OfficerPerformance />
              </SidebarLayout>
            ) : (
              <Navigate to="/admin-login" />
            )
          } />

          <Route path="/admin/officer-performance/:officerId" element={
            isAdmin ? (
              <SidebarLayout
                userType="admin"
                userName="Admin"
                onLogout={handleAdminLogout}
              >
                <OfficerDetail />
              </SidebarLayout>
            ) : (
              <Navigate to="/admin-login" />
            )
          } />

          {/* Officer Routes */}
          <Route path="/officer-dashboard" element={
            isOfficer ? (
              <SidebarLayout
                userType="officer"
                userName={officerName || 'Officer'}
                onLogout={handleOfficerLogout}
              >
                <OfficerDashboard />
              </SidebarLayout>
            ) : (
              <Navigate to="/officer-login" />
            )
          } />

          <Route path="/officer-grievances" element={
            isOfficer ? (
              <SidebarLayout
                userType="officer"
                userName={officerName || 'Officer'}
                onLogout={handleOfficerLogout}
              >
                <OfficerGrievances />
              </SidebarLayout>
            ) : (
              <Navigate to="/officer-login" />
            )
          } />

          <Route path="/officer-chat" element={
            isOfficer ? (
              <SidebarLayout
                userType="officer"
                userName={officerName || 'Officer'}
                onLogout={handleOfficerLogout}
              >
                <OfficerChat />
              </SidebarLayout>
            ) : (
              <Navigate to="/officer-login" />
            )
          } />

          <Route path="/officer-elite-review" element={
            isOfficer ? (
              <SidebarLayout
                userType="officer"
                userName={officerName || 'Officer'}
                onLogout={handleOfficerLogout}
              >
                <OfficerEliteReview />
              </SidebarLayout>
            ) : (
              <Navigate to="/officer-login" />
            )
          } />

          <Route path="/officer-meetings" element={
            isOfficer ? (
              <SidebarLayout
                userType="officer"
                userName={officerName || 'Officer'}
                onLogout={handleOfficerLogout}
              >
                <OfficerMeetings />
              </SidebarLayout>
            ) : (
              <Navigate to="/officer-login" />
            )
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;