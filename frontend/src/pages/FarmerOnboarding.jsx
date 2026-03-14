import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Shield, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';

const CROP_OPTIONS = ['Corn', 'Soybeans', 'Wheat', 'Vegetables', 'Livestock', 'Other'];

function FarmerOnboarding({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    county: '',
    state: '',
    phone: '',
    crop_type: 'Corn',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinish = () => {
    localStorage.setItem('farmer_profile', JSON.stringify(profile));
    if (onComplete) onComplete(profile);
    navigate('/');
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: 6,
    fontFamily: "'Source Sans 3', sans-serif",
  };

  const inputFieldStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    backgroundColor: '#ffffff',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: "'Source Sans 3', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  };

  const btnPrimary = {
    flex: 1,
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'var(--accent-green)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: "'Source Sans 3', sans-serif",
    transition: 'background-color 0.15s',
  };

  const btnSecondary = {
    flex: 1,
    padding: '12px 24px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    backgroundColor: '#ffffff',
    color: 'var(--text-secondary)',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: "'Source Sans 3', sans-serif",
    transition: 'all 0.15s',
  };

  const steps = [
    // Step 1: Welcome
    <div key="welcome" style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ maxWidth: 256, margin: '0 auto 40px' }}>
        <svg viewBox="0 0 320 160" style={{ width: '100%', height: 'auto' }} fill="none">
          <rect x="0" y="120" width="320" height="40" rx="4" fill="var(--bg-elevated)" />
          {[40, 80, 120, 160, 200, 240].map((x, i) => (
            <rect key={i} x={x} y={60 + Math.sin(i) * 10} width="16" height={60 - Math.sin(i) * 10} rx="2" fill="#2d6a2d" opacity={0.3 + i * 0.1} />
          ))}
          <polyline points="30,100 80,70 130,80 180,50 230,60 280,30" stroke="#2d6a2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="280" cy="30" r="4" fill="#2d6a2d" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 48,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}
      >
        Welcome to RuralYield
      </h1>
      <p
        style={{
          fontSize: 18,
          maxWidth: 500,
          margin: '0 auto',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          fontFamily: "'Source Sans 3', sans-serif",
        }}
      >
        Local Innovation Bonds let you raise funding from community investors
        for your agricultural innovations. Speak your proposal, get it reviewed
        by our AI agent, and connect with investors — all in minutes.
      </p>
      <button
        onClick={() => setStep(1)}
        style={{ ...btnPrimary, flex: 'none', padding: '14px 32px', marginTop: 32, display: 'inline-flex' }}
      >
        Get Started <ChevronRight style={{ width: 16, height: 16 }} />
      </button>
    </div>,

    // Step 2: Profile
    <div key="profile" style={{ maxWidth: 448, margin: '0 auto', animation: 'fadeUp 0.4s ease forwards' }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Your Profile
      </h2>
      <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text-secondary)', fontFamily: "'Source Sans 3', sans-serif" }}>
        Tell us a bit about yourself and your farm.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text" name="name" value={profile.name} onChange={handleChange}
            placeholder="John Farmer" style={inputFieldStyle}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>County</label>
            <input
              type="text" name="county" value={profile.county} onChange={handleChange}
              placeholder="Franklin County" style={inputFieldStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <input
              type="text" name="state" value={profile.state} onChange={handleChange}
              placeholder="Ohio" style={inputFieldStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input
            type="tel" name="phone" value={profile.phone} onChange={handleChange}
            placeholder="(555) 123-4567" style={inputFieldStyle}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Primary Crop</label>
          <select
            name="crop_type" value={profile.crop_type} onChange={handleChange}
            style={inputFieldStyle}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          >
            {CROP_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={() => setStep(0)} style={btnSecondary}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back
        </button>
        <button onClick={() => setStep(2)} disabled={!profile.name} style={{ ...btnPrimary, opacity: !profile.name ? 0.6 : 1, cursor: !profile.name ? 'not-allowed' : 'pointer' }}>
          Continue <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>,

    // Step 3: How it Works
    <div key="howItWorks" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        How It Works
      </h2>
      <p style={{ textAlign: 'center', marginBottom: 40, color: 'var(--text-secondary)', fontFamily: "'Source Sans 3', sans-serif" }}>
        Three simple steps to fund your innovation.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          {
            icon: <Mic style={{ width: 32, height: 32 }} />,
            title: 'Speak Your Proposal',
            desc: 'Tap the microphone and describe your bond. Our system transcribes and fills the form for you.',
          },
          {
            icon: <Shield style={{ width: 32, height: 32 }} />,
            title: 'Agent Reviews It',
            desc: 'Our AI agent checks compliance, scores risk with USDA data, and makes an autonomous decision.',
          },
          {
            icon: <DollarSign style={{ width: 32, height: 32 }} />,
            title: 'Get Funded',
            desc: 'Approved bonds are listed on the marketplace. Investors browse, invest, and you get funded.',
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
              animationDelay: `${i * 100}ms`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: 'var(--accent-green-dim)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {item.icon}
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {item.title}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.5 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 40, maxWidth: 448, margin: '40px auto 0' }}>
        <button onClick={() => setStep(1)} style={btnSecondary}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back
        </button>
        <button onClick={handleFinish} style={btnPrimary}>
          Create My First Bond <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>,
  ];

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: 'var(--bg-secondary)',
        fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif",
      }}
    >
      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            style={{
              borderRadius: 999,
              height: 8,
              width: step === s ? 24 : 8,
              backgroundColor: step === s ? 'var(--accent-green)' : 'var(--border)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
      {steps[step]}
    </div>
  );
}

export default FarmerOnboarding;
