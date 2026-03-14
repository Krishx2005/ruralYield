import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TOTAL = 8;
const BG_DARK = '#0d1f0d';
const BG_MID = '#112211';
const GREEN = '#00d4aa';
const TEXT_DIM = '#a0c8a0';
const TEXT_MUTED = '#557755';

const pill = (text) => (
  <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${GREEN}40`, color: GREEN, letterSpacing: '0.08em' }}>
    {text}
  </span>
);

const sectionLabel = (text) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GREEN, marginBottom: 16 }}>{text}</div>
);

const headline = (text, size = 56) => (
  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: size, fontWeight: 700, color: '#ffffff', lineHeight: 1.1, margin: '0 0 20px' }}>{text}</h1>
);

const body = (text) => (
  <p style={{ fontSize: 18, color: TEXT_DIM, lineHeight: 1.7, maxWidth: 600, margin: 0 }}>{text}</p>
);

const sponsorBadges = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
    {['AWS', 'ElevenLabs', 'Featherless.AI', 'Jaseci'].map((s) => (
      <span key={s} style={{ padding: '5px 16px', borderRadius: 999, fontSize: 12, fontWeight: 500, border: '1px solid #ffffff30', color: '#ffffffcc' }}>{s}</span>
    ))}
  </div>
);

/* ── SVG Icons ── */
const svgProps = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: GREEN, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IconMic = () => <svg {...svgProps}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IconBrain = () => <svg {...svgProps}><path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-3 3.87V12a4 4 0 0 0 2.5 3.7V18a4 4 0 0 0 4.5 3.96A4 4 0 0 0 16.5 18v-2.3A4 4 0 0 0 19 12v-1.13A4 4 0 0 0 16 7V6a4 4 0 0 0-4-4z"/><path d="M12 2v20"/></svg>;
const IconGraph = () => <svg {...svgProps}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconCloud = () => <svg {...svgProps}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
const IconWave = () => <svg {...svgProps}><path d="M2 12s3-4 5-4 4 8 6 8 5-4 5-4"/><circle cx="20" cy="12" r="1"/></svg>;
const IconLlama = () => <svg {...svgProps}><path d="M4 19V9l4-5h4l4 5v10"/><path d="M8 4v4"/><path d="M12 4v4"/><circle cx="9" cy="11" r="1"/><path d="M16 19v-6l3-2"/></svg>;
const IconBot = () => <svg {...svgProps}><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8V5"/><circle cx="12" cy="3" r="2"/><circle cx="8" cy="14" r="1.5" fill={GREEN}/><circle cx="16" cy="14" r="1.5" fill={GREEN}/></svg>;

/* ── Tooltip ── */
function Tooltip({ text, visible }) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: '50%', transform: `translateX(-50%) translateY(${visible ? '-8px' : '-4px'})`,
      opacity: visible ? 1 : 0, pointerEvents: 'none', zIndex: 100,
      background: '#1a3a1a', border: `1px solid ${GREEN}`, borderRadius: 8,
      padding: '10px 14px', maxWidth: 220, fontSize: 13, color: '#ffffff',
      fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.5, textAlign: 'center',
      transition: 'opacity 200ms ease, transform 200ms ease', whiteSpace: 'normal',
    }}>
      {text}
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
        borderTop: `6px solid ${GREEN}`,
      }} />
    </div>
  );
}

/* ── Slide Components ── */

function Slide1() {
  return (
    <div style={{ background: BG_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', width: 3, height: 3, borderRadius: '50%', backgroundColor: GREEN,
          left: `${5 + (i * 47) % 90}%`, bottom: -10, opacity: 0.15 + (i % 5) * 0.08,
          animation: `floatUp ${6 + (i % 4) * 2}s linear infinite`, animationDelay: `${(i * 0.7) % 5}s`,
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {pill('Toledo Hackathon 2026')}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 80, fontWeight: 700, color: '#ffffff', margin: '24px 0 12px', lineHeight: 1 }}>RuralYield FinOps</h1>
        <p style={{ fontSize: 24, color: TEXT_DIM, marginBottom: 48, fontFamily: "'Source Sans 3', sans-serif" }}>Autonomous micro-investment bonds for rural farmers</p>
        {sponsorBadges()}
      </div>
    </div>
  );
}

function Slide2() {
  const stats = [['47M', 'Rural Americans underserved by traditional banking'], ['$2.1T', 'Annual rural financing gap'], ['1 in 3', 'Rural entrepreneurs rejected for standard loans']];
  return (
    <div style={{ background: BG_DARK, display: 'flex', alignItems: 'center', padding: '0 8%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: 280, fontFamily: "'Playfair Display', serif", fontWeight: 800, color: '#ffffff06', lineHeight: 1 }}>01</div>
      <div style={{ flex: '0 0 58%', position: 'relative', zIndex: 1 }}>
        {sectionLabel('THE PROBLEM')}
        {headline('Good ideas die in rural America.')}
        {body('A farmer in Franklin County has a breakthrough corn innovation. He needs $15,000. The bank says no — too small, too risky, wrong zip code.')}
        <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: 20, marginTop: 32 }}>
          <p style={{ fontSize: 16, color: TEXT_DIM, fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"35% of rural small businesses cite lack of capital access as their #1 barrier to growth."</p>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}>— USDA Rural Development Report</p>
        </div>
      </div>
      <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 48 }}>
        {stats.map(([num, label]) => (
          <div key={num} style={{ padding: 24, borderRadius: 12, border: '1px solid #ffffff15', background: '#ffffff08' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, color: GREEN, fontWeight: 700 }}>{num}</div>
            <div style={{ fontSize: 14, color: TEXT_DIM, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide3() {
  const steps = [
    { icon: <IconMic />, title: 'Farmer Speaks', desc: 'Voice-first bond proposal via ElevenLabs' },
    { icon: <IconBrain />, title: 'AI Decides', desc: '8-step agent reviews risk + compliance' },
    { icon: <IconGraph />, title: 'Community Funds', desc: 'Bond goes live on the marketplace' },
  ];
  return (
    <div style={{ background: BG_MID, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {sectionLabel('THE SOLUTION')}
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 700, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.1 }}>Local Innovation Bonds</h1>
      <p style={{ fontSize: 20, color: TEXT_DIM, maxWidth: 650, marginBottom: 56 }}>AI-powered micro-investment instruments that connect rural farmers directly with community investors.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ width: 220, padding: 28, borderRadius: 12, border: '1px solid #ffffff15', background: '#ffffff08', textAlign: 'center' }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#ffffff', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: TEXT_DIM }}>{s.desc}</div>
            </div>
            {i < 2 && <div style={{ fontSize: 28, color: GREEN, animation: 'pulse 2s ease-in-out infinite' }}>→</div>}
          </React.Fragment>
        ))}
      </div>
      <p style={{ marginTop: 40, fontSize: 16, color: GREEN, fontStyle: 'italic' }}>The entire process takes under 5 minutes.</p>
    </div>
  );
}

function Slide4({ visible }) {
  const [hovered, setHovered] = useState(null);
  const STEP_TIPS = {
    1: "Receives farmer's voice proposal",
    2: "Pulls real USDA crop yield data for the county",
    3: "Llama 3 via Featherless.AI checks regulatory compliance",
    4: "AWS Bedrock scores investment risk 0-100",
    5: "Agent autonomously approves, requests info, or rejects",
    6: "Bond record written to AWS DynamoDB",
    7: "AWS Lambda triggers ledger entry",
    8: "ElevenLabs speaks decision back to farmer",
  };
  const left = [
    { n: 1, label: 'Receives bond proposal' },
    { n: 2, label: 'Fetches USDA crop data' },
    { n: 3, label: 'Compliance check via Llama 3' },
    { n: 4, label: 'Risk scoring via AWS Bedrock' },
  ];
  const right = [
    { n: 5, label: 'Autonomous approval decision' },
    { n: 6, label: 'Writes to DynamoDB' },
    { n: 7, label: 'Triggers Lambda ledger' },
    { n: 8, label: 'Voice response via ElevenLabs' },
  ];
  const renderStep = (s, delay) => (
    <div
      key={s.n}
      style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-20px)', transition: `all 0.4s ease ${delay}ms`, position: 'relative', cursor: 'default' }}
      onMouseEnter={() => setHovered(s.n)}
      onMouseLeave={() => setHovered(null)}
    >
      <Tooltip text={STEP_TIPS[s.n]} visible={hovered === s.n} />
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: BG_DARK, flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>{s.n}</div>
      <span style={{ fontSize: 17, color: '#ffffff' }}>{s.label}</span>
    </div>
  );
  return (
    <div style={{ background: BG_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {sectionLabel('JASECI AUTONOMOUS AGENT')}
      {headline('8 Steps. Fully Autonomous.', 48)}
      <div style={{ display: 'flex', gap: 80, marginTop: 32 }}>
        <div>{left.map((s) => renderStep(s, (s.n - 1) * 200))}</div>
        <div>{right.map((s) => renderStep(s, (s.n - 1) * 200))}</div>
      </div>
    </div>
  );
}

function Slide5() {
  const [hovered, setHovered] = useState(null);
  const SPONSOR_TIPS = {
    AWS: '4 services integrated — Bedrock, DynamoDB, Lambda, S3',
    ElevenLabs: 'Voice-first UX — farmers never need to type',
    'Featherless.AI': 'Open-weight model — transparent + cost effective',
    Jaseci: '8-step walker agent — fully auditable decision trail',
  };
  const sponsors = [
    { name: 'AWS', icon: <IconCloud />, desc: 'Bedrock powers our AI risk scoring. DynamoDB + Lambda handle the bond ledger and real-time updates.', detail: 'Bedrock • DynamoDB • Lambda • S3' },
    { name: 'ElevenLabs', icon: <IconWave />, desc: 'Farmers submit bond proposals entirely by voice. The agent responds with spoken decisions in real time.', detail: 'STT • TTS • Voice Portfolio Management' },
    { name: 'Featherless.AI', icon: <IconLlama />, desc: 'Llama 3 runs structured compliance checks on every bond proposal, flagging regulatory risks before listing.', detail: 'meta-llama/Llama-3.1-8B-Instruct' },
    { name: 'Jaseci', icon: <IconBot />, desc: 'The orchestration layer that runs our 8-step autonomous agent — from intake to voice response — without human intervention.', detail: 'Walker Agent • Tool Calling • Decision Logic' },
  ];
  return (
    <div style={{ background: BG_MID, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {sectionLabel('4 SPONSOR INTEGRATIONS')}
      {headline('Built on Best-in-Class Infrastructure', 44)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900, marginTop: 20 }}>
        {sponsors.map((s) => (
          <div
            key={s.name}
            style={{ padding: 28, borderRadius: 12, border: '1px solid #ffffff15', background: '#ffffff08', position: 'relative', cursor: 'default' }}
            onMouseEnter={() => setHovered(s.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <Tooltip text={SPONSOR_TIPS[s.name]} visible={hovered === s.name} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ display: 'flex' }}>{s.icon}</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#ffffff' }}>{s.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 10px', borderRadius: 999, background: `${GREEN}25`, color: GREEN, fontWeight: 600, letterSpacing: '0.05em' }}>CORE</span>
            </div>
            <p style={{ fontSize: 15, color: TEXT_DIM, lineHeight: 1.6, margin: '0 0 12px' }}>{s.desc}</p>
            <p style={{ fontSize: 12, color: TEXT_MUTED, margin: 0 }}>{s.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide6() {
  return (
    <div style={{ background: BG_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {sectionLabel('LIVE DEMO')}
      {headline('Watch the Agent Work.')}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginTop: 32, width: '100%', maxWidth: 400 }}>
        {/* Primary CTA with pulse ring */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{ position: 'absolute', inset: -12, borderRadius: 14, background: GREEN, opacity: 0.06, animation: 'pulse 2s ease-in-out infinite' }} />
          <Link
            to="/farmer"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '18px 32px', borderRadius: 10,
              background: GREEN, color: BG_DARK, fontSize: 18, fontWeight: 700,
              textDecoration: 'none', fontFamily: "'Source Sans 3', sans-serif", letterSpacing: '0.03em',
            }}
          >
            Open Farmer Dashboard →
          </Link>
        </div>

        {/* Secondary CTA */}
        <Link
          to="/investor"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '14px 32px', borderRadius: 10,
            border: `1.5px solid ${GREEN}`, color: GREEN, fontSize: 15, fontWeight: 600,
            textDecoration: 'none', fontFamily: "'Source Sans 3', sans-serif", background: 'transparent',
          }}
        >
          Open Investor View →
        </Link>
      </div>

      {/* Demo script */}
      <p style={{ marginTop: 56, fontSize: 14, color: TEXT_MUTED, maxWidth: 560, lineHeight: 1.6 }}>
        1. Speak bond proposal → 2. Watch 8 steps → 3. Switch to investor → 4. Click Invest
      </p>
    </div>
  );
}

function Slide7() {
  const [hovered, setHovered] = useState(null);
  const METRIC_TIPS = {
    '$50M': 'Based on 1% penetration of Ohio rural financing gap',
    '10,000': 'Estimated addressable farmers in Ohio alone',
    '250,000': 'Average 25 acres per funded innovation',
    '500,000': '5 investors per bond on average',
  };
  const metrics = [['$50M', 'Rural capital deployed annually'], ['10,000', 'Farmers funded across Ohio'], ['250,000', 'Acres of innovation funded'], ['500,000', 'Community investors engaged']];
  return (
    <div style={{ background: BG_MID, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {sectionLabel('PROJECTED IMPACT AT SCALE')}
      {headline('What This Looks Like in 5 Years', 48)}
      <div style={{ padding: '8px 20px', borderRadius: 8, background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#f59e0b', fontSize: 13, marginBottom: 40, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Projections based on market research — current data is from demo environment
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, maxWidth: 960 }}>
        {metrics.map(([num, label]) => (
          <div
            key={num}
            style={{ position: 'relative', cursor: 'default' }}
            onMouseEnter={() => setHovered(num)}
            onMouseLeave={() => setHovered(null)}
          >
            <Tooltip text={METRIC_TIPS[num]} visible={hovered === num} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, color: GREEN, fontWeight: 700 }}>{num}</div>
            <div style={{ fontSize: 15, color: '#ffffff', marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 48, fontSize: 18, color: TEXT_DIM }}>Starting with Ohio. Scaling nationally.</p>
    </div>
  );
}

function Slide8() {
  return (
    <div style={{ background: BG_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', width: 2, height: 2, borderRadius: '50%', backgroundColor: GREEN,
          left: `${10 + (i * 53) % 80}%`, bottom: -5, opacity: 0.12 + (i % 4) * 0.06,
          animation: `floatUp ${7 + (i % 3) * 2}s linear infinite`, animationDelay: `${(i * 0.9) % 6}s`,
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 72, fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.1 }}>Fund Rural Innovation.</h1>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 72, fontWeight: 700, color: GREEN, margin: '4px 0 32px', lineHeight: 1.1 }}>Build Local Futures.</h1>
        <p style={{ fontSize: 18, color: TEXT_DIM, marginBottom: 24 }}>Built at Toledo Hackathon 2026</p>
        <a href="https://rural-yield.vercel.app" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 999, border: `1px solid ${GREEN}60`, color: GREEN, fontSize: 14, fontWeight: 500, textDecoration: 'none', marginBottom: 32 }}>
          rural-yield.vercel.app
        </a>
        <div style={{ marginBottom: 40 }}>{sponsorBadges()}</div>
        <p style={{ fontSize: 14, color: TEXT_MUTED }}>Thank you</p>
      </div>
    </div>
  );
}

/* ── Main Pitch Deck ── */

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8];

function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const go = useCallback((dir) => {
    setCurrent((prev) => Math.max(0, Math.min(TOTAL - 1, prev + dir)));
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [go, navigate]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: BG_DARK, fontFamily: "'Source Sans 3', sans-serif", overflow: 'hidden', cursor: 'pointer' }} onClick={() => go(1)}>
      {/* CSS animations */}
      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-100vh); opacity: 0; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.08; } 50% { transform: scale(1.15); opacity: 0.15; } }
      `}</style>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10, background: '#ffffff10' }}>
        <div style={{ height: '100%', background: GREEN, width: `${((current + 1) / TOTAL) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* Exit button */}
      <button onClick={(e) => { e.stopPropagation(); navigate('/'); }} style={{ position: 'absolute', top: 16, right: 20, zIndex: 10, background: 'none', border: '1px solid #ffffff20', borderRadius: 6, padding: '6px 14px', color: '#ffffff60', fontSize: 12, cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif" }}>
        Exit Presentation
      </button>

      {/* Slide counter */}
      <div style={{ position: 'absolute', bottom: 20, right: 24, zIndex: 10, fontSize: 13, color: '#ffffff40', fontFamily: "'Source Sans 3', sans-serif" }}>
        {current + 1} / {TOTAL}
      </div>

      {/* Nav arrows (click zones) */}
      <div onClick={(e) => { e.stopPropagation(); go(-1); }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '15%', zIndex: 5, cursor: current > 0 ? 'w-resize' : 'default' }} />
      <div onClick={(e) => { e.stopPropagation(); go(1); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '15%', zIndex: 5, cursor: current < TOTAL - 1 ? 'e-resize' : 'default' }} />

      {/* Slides */}
      {SLIDES.map((SlideComp, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', inset: 0,
            opacity: current === i ? 1 : 0,
            transform: current === i ? 'translateY(0)' : current > i ? 'translateY(-30px)' : 'translateY(30px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            pointerEvents: current === i ? 'auto' : 'none',
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%' }}>
            <SlideComp visible={current === i} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PitchDeck;
