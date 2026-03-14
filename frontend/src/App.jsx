import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import FarmerDashboard from './pages/FarmerDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import BondDetail from './pages/BondDetail';
import InvestorProfile from './pages/InvestorProfile';
import FarmerOnboarding from './pages/FarmerOnboarding';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DemoPage from './pages/DemoPage';
import CountyCompare from './pages/CountyCompare';
import ImpactDashboard from './pages/ImpactDashboard';
import FarmProfile from './pages/FarmProfile';
import SecondaryMarket from './pages/SecondaryMarket';
import PitchDeck from './pages/PitchDeck';

/* ─── Inline Landing Page ─── */
function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: 'var(--bg-secondary)',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '60px 24px',
        }}
      >
        {/* Subtle wheat pattern background */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.04,
          }}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="wheat" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 10 Q45 25 40 40 Q35 25 40 10Z" fill="#2d6a2d" />
              <path d="M40 40 Q45 55 40 70 Q35 55 40 40Z" fill="#2d6a2d" />
              <path d="M10 40 Q25 35 40 40 Q25 45 10 40Z" fill="#2d6a2d" />
              <path d="M40 40 Q55 35 70 40 Q55 45 40 40Z" fill="#2d6a2d" />
              <circle cx="40" cy="40" r="2" fill="#2d6a2d" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wheat)" />
        </svg>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              marginBottom: 24,
            }}
          >
            Fund Rural Innovation.
            <br />
            Build Local Futures.
          </h1>
          <p
            className="font-sans"
            style={{
              fontSize: 20,
              color: 'var(--text-secondary)',
              maxWidth: 550,
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            RuralYield connects rural farmers with community investors through AI-powered Local Innovation Bonds.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/farmer" className="btn-primary" style={{ height: 48 }}>
              I'm a Farmer
            </Link>
            <Link to="/investor" className="btn-secondary" style={{ height: 48 }}>
              I'm an Investor
            </Link>
          </div>
          <p
            style={{
              marginTop: 32,
              fontSize: 13,
              color: 'var(--text-muted)',
              letterSpacing: '0.02em',
            }}
          >
            Powered by AWS &middot; ElevenLabs &middot; Featherless AI &middot; Jaseci
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        style={{
          backgroundColor: 'var(--bg-elevated)',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 896,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
            textAlign: 'center',
          }}
        >
          {[
            { value: '$2.4M', label: 'Facilitated' },
            { value: '127', label: 'Bonds Funded' },
            { value: '94%', label: 'Approval Rate' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display" style={{ fontSize: 40, color: 'var(--accent-green)', marginBottom: 4 }}>
                {stat.value}
              </div>
              <div className="font-sans" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>
            HOW IT WORKS
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: 36,
              color: 'var(--text-primary)',
              marginBottom: 56,
            }}
          >
            From Field to Funded in Minutes
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 32,
            }}
          >
            {[
              {
                num: '01',
                title: 'Speak Your Proposal',
                desc: 'Describe your farming project via voice — no paperwork, no jargon.',
              },
              {
                num: '02',
                title: 'AI Reviews Everything',
                desc: 'Our 8-step AI agent scores risk, checks compliance, and structures your bond.',
              },
              {
                num: '03',
                title: 'Community Invests',
                desc: 'Your bond goes live for local investors to browse, fund, and track.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="card"
                style={{ textAlign: 'left', padding: 32 }}
              >
                <div
                  className="font-display"
                  style={{
                    fontSize: 48,
                    color: 'var(--accent-green)',
                    lineHeight: 1,
                    marginBottom: 16,
                    opacity: 0.8,
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="font-display"
                  style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}
                >
                  {step.title}
                </h3>
                <p className="font-sans" style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section
        style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h2
            className="font-display"
            style={{ fontSize: 36, color: 'var(--text-primary)', marginBottom: 56 }}
          >
            Built for Rural Entrepreneurs
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {[
              {
                title: 'Voice-First',
                desc: 'Submit proposals by speaking naturally — no forms, no friction.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                ),
              },
              {
                title: 'AI Risk Scoring',
                desc: 'Multi-agent system evaluates viability, risk, and market conditions.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
              },
              {
                title: 'Compliance Checked',
                desc: 'Every bond is reviewed against agricultural and financial regulations.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                ),
              },
              {
                title: 'Real-Time Funding',
                desc: 'Track investments as they come in with a live, transparent dashboard.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card"
                style={{ textAlign: 'left', padding: 28 }}
              >
                <div style={{ marginBottom: 14 }}>{feature.icon}</div>
                <h3
                  className="font-display"
                  style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 6 }}
                >
                  {feature.title}
                </h3>
                <p className="font-sans" style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'var(--accent-green)',
          color: '#ffffff',
          padding: '48px 24px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 32,
            paddingBottom: 32,
            borderBottom: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Left — Logo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8c.7-1 1-2.2 1-3.5C18 2.5 16.6 1 15 1c-2 0-3.3 1.5-3 4 0 0-3-1-5.5 1S4 10 4 10s3-.5 5 0c-1.5 1-2.5 3-2.5 3s2-.5 4-1c-.5 1.5-1 3.5-1 3.5s1.5-1 3-2.5c0 2 .5 4 .5 4s1-2 1.5-4c1 1 2.5 2 2.5 2s-.5-2-1-3.5c1.5.5 3.5 1 3.5 1s-1.5-2-3-3c1.5-.5 3.5-1 3.5-1" />
              </svg>
              <span className="font-display" style={{ fontSize: 20 }}>RuralYield</span>
            </div>
            <p style={{ fontSize: 14, opacity: 0.85, maxWidth: 240 }}>
              Empowering rural communities through accessible innovation financing.
            </p>
          </div>

          {/* Center — Links */}
          <div style={{ display: 'flex', gap: 24, fontSize: 14, flexWrap: 'wrap' }}>
            <Link to="/farmer" style={{ color: '#ffffff', opacity: 0.85, textDecoration: 'none' }}>For Farmers</Link>
            <Link to="/investor" style={{ color: '#ffffff', opacity: 0.85, textDecoration: 'none' }}>For Investors</Link>
            <Link to="/analytics" style={{ color: '#ffffff', opacity: 0.85, textDecoration: 'none' }}>Analytics</Link>
          </div>
        </div>

        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            paddingTop: 20,
            fontSize: 13,
            opacity: 0.7,
            textAlign: 'center',
          }}
        >
          &copy; 2026 RuralYield &middot; Powered by AWS
          <span style={{ margin: '0 8px' }}>&middot;</span>
          <Link to="/pitch" style={{ color: '#ffffff', opacity: 0.7, textDecoration: 'none' }}>Presentation Mode</Link>
        </div>
      </footer>
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasInvestorProfile, setHasInvestorProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const farmerProfile = localStorage.getItem('farmer_profile');
    if (!farmerProfile) setShowOnboarding(true);
    const investorId = localStorage.getItem('investor_id');
    if (investorId) setHasInvestorProfile(true);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    padding: '20px 0',
    borderBottom: isActive ? '2px solid var(--accent-green)' : '2px solid transparent',
    transition: 'color 200ms ease, border-color 200ms ease',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', overflowX: 'hidden', overflowY: 'auto' }}>
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          height: 64,
        }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-full" style={{ maxWidth: 1200 }}>
          <div className="flex h-full items-center justify-between">
            {/* Left: Logo */}
            <NavLink to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 8c.7-1 1-2.2 1-3.5C18 2.5 16.6 1 15 1c-2 0-3.3 1.5-3 4 0 0-3-1-5.5 1S4 10 4 10s3-.5 5 0c-1.5 1-2.5 3-2.5 3s2-.5 4-1c-.5 1.5-1 3.5-1 3.5s1.5-1 3-2.5c0 2 .5 4 .5 4s1-2 1.5-4c1 1 2.5 2 2.5 2s-.5-2-1-3.5c1.5.5 3.5 1 3.5 1s-1.5-2-3-3c1.5-.5 3.5-1 3.5-1" />
              </svg>
              <span
                className="font-display"
                style={{ fontSize: 22, color: 'var(--accent-green)' }}
              >
                RuralYield
              </span>
            </NavLink>

            {/* Center: Plain text nav links */}
            <div className="flex items-center" style={{ gap: 32 }}>
              <NavLink to="/farmer" style={navLinkStyle}>
                For Farmers
              </NavLink>
              <NavLink to="/investor" style={navLinkStyle}>
                For Investors
              </NavLink>
              <NavLink to="/analytics" style={navLinkStyle}>
                Analytics
              </NavLink>
              <NavLink to="/compare" style={navLinkStyle}>
                Compare
              </NavLink>
              <NavLink to="/impact" style={navLinkStyle}>
                Impact
              </NavLink>
              {hasInvestorProfile && (
                <NavLink to="/portfolio" style={navLinkStyle}>
                  Portfolio
                </NavLink>
              )}
              <NavLink to="/" end style={navLinkStyle}>
                How It Works
              </NavLink>
            </div>

            {/* Dark/Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 200ms ease',
              }}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {/* Right: CTA Button */}
            <Link
              to="/farmer"
              className="btn-primary"
              style={{
                height: 36,
                fontSize: 13,
                padding: '0 20px',
                borderRadius: 6,
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                {showOnboarding ? (
                  <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <FarmerOnboarding onComplete={handleOnboardingComplete} />
                  </main>
                ) : (
                  <HomePage />
                )}
              </PageTransition>
            }
          />
          <Route
            path="/farmer"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <FarmerDashboard />
                </main>
              </PageTransition>
            }
          />
          <Route
            path="/investor"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <InvestorDashboard />
                </main>
              </PageTransition>
            }
          />
          <Route
            path="/bond/:id"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <BondDetail />
                </main>
              </PageTransition>
            }
          />
          <Route
            path="/portfolio"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <InvestorProfile />
                </main>
              </PageTransition>
            }
          />
          <Route
            path="/analytics"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <AnalyticsDashboard />
                </main>
              </PageTransition>
            }
          />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/pitch" element={<PitchDeck />} />
          <Route
            path="/compare"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <CountyCompare />
                </main>
              </PageTransition>
            }
          />
          <Route
            path="/impact"
            element={
              <PageTransition>
                <ImpactDashboard />
              </PageTransition>
            }
          />
          <Route
            path="/farm/:farmer_id"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <FarmProfile />
                </main>
              </PageTransition>
            }
          />
          <Route
            path="/market"
            element={
              <PageTransition>
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <SecondaryMarket />
                </main>
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
