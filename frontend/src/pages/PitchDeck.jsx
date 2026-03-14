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
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    {['AWS', 'ElevenLabs', 'Featherless.AI', 'Jaseci'].map((s) => (
      <span key={s} style={{ padding: '5px 16px', borderRadius: 999, fontSize: 12, fontWeight: 500, border: '1px solid #ffffff30', color: '#ffffffcc' }}>{s}</span>
    ))}
  </div>
);

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
        {body('A farmer in Franklin County has a breakthrough corn innovation. He needs $15,000. The bank says no \u2014 too small, too risky, wrong zip code.')}
        <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: 20, marginTop: 32 }}>
          <p style={{ fontSize: 16, color: TEXT_DIM, fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"35% of rural small businesses cite lack of capital access as their #1 barrier to growth."</p>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}>\u2014 USDA Rural Development Report</p>
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
    { icon: '\ud83c\udf99\ufe0f', title: 'Farmer Speaks', desc: 'Voice-first bond proposal via ElevenLabs' },
    { icon: '\ud83e\udd16', title: 'AI Decides', desc: '8-step agent reviews risk + compliance' },
    { icon: '\ud83d\udcb0', title: 'Community Funds', desc: 'Bond goes live on the marketplace' },
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
              <div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#ffffff', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: TEXT_DIM }}>{s.desc}</div>
            </div>
            {i < 2 && <div style={{ fontSize: 28, color: GREEN, animation: 'pulse 2s ease-in-out infinite' }}>\u2192</div>}
          </React.Fragment>
        ))}
      </div>
      <p style={{ marginTop: 40, fontSize: 16, color: GREEN, fontStyle: 'italic' }}>The entire process takes under 5 minutes.</p>
    </div>
  );
}

function Slide4({ visible }) {
  const left = [
    { n: 1, icon: '\ud83d\udce5', label: 'Receives bond proposal' },
    { n: 2, icon: '\ud83c\udf3e', label: 'Fetches USDA crop data' },
    { n: 3, icon: '\u2696\ufe0f', label: 'Compliance check via Llama 3' },
    { n: 4, icon: '\ud83d\udcca', label: 'Risk scoring via AWS Bedrock' },
  ];
  const right = [
    { n: 5, icon: '\ud83e\udde0', label: 'Autonomous approval decision' },
    { n: 6, icon: '\ud83d\udcbe', label: 'Writes to DynamoDB' },
    { n: 7, icon: '\u26a1', label: 'Triggers Lambda ledger' },
    { n: 8, icon: '\ud83d\udd0a', label: 'Voice response via ElevenLabs' },
  ];
  const renderStep = (s, delay) => (
    <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-20px)', transition: `all 0.4s ease ${delay}ms` }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: BG_DARK, flexShrink: 0 }}>{s.n}</div>
      <div>
        <span style={{ fontSize: 22, marginRight: 10 }}>{s.icon}</span>
        <span style={{ fontSize: 17, color: '#ffffff' }}>{s.label}</span>
      </div>
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
  const sponsors = [
    { name: 'AWS', icon: '\u2601\ufe0f', desc: 'Bedrock powers our AI risk scoring. DynamoDB + Lambda handle the bond ledger and real-time updates.', detail: 'Bedrock \u2022 DynamoDB \u2022 Lambda \u2022 S3' },
    { name: 'ElevenLabs', icon: '\ud83c\udf99\ufe0f', desc: 'Farmers submit bond proposals entirely by voice. The agent responds with spoken decisions in real time.', detail: 'STT \u2022 TTS \u2022 Voice Portfolio Management' },
    { name: 'Featherless.AI', icon: '\ud83e\udd99', desc: 'Llama 3 runs structured compliance checks on every bond proposal, flagging regulatory risks before listing.', detail: 'meta-llama/Llama-3.1-8B-Instruct' },
    { name: 'Jaseci', icon: '\ud83e\udd16', desc: 'The orchestration layer that runs our 8-step autonomous agent \u2014 from intake to voice response \u2014 without human intervention.', detail: 'Walker Agent \u2022 Tool Calling \u2022 Decision Logic' },
  ];
  return (
    <div style={{ background: BG_MID, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {sectionLabel('4 SPONSOR INTEGRATIONS')}
      {headline('Built on Best-in-Class Infrastructure', 44)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900, marginTop: 20 }}>
        {sponsors.map((s) => (
          <div key={s.name} style={{ padding: 28, borderRadius: 12, border: '1px solid #ffffff15', background: '#ffffff08' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
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
    <div style={{ background: BG_DARK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
      {sectionLabel('LIVE DEMO')}
      {headline('Watch the Agent Work.')}
      <div style={{ position: 'relative', marginTop: 20, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: GREEN, opacity: 0.08, animation: 'pulse 2s ease-in-out infinite' }} />
        <Link to="/farmer" target="_blank" rel="noopener noreferrer" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 40px', borderRadius: 10, background: GREEN, color: BG_DARK, fontSize: 18, fontWeight: 700, textDecoration: 'none', fontFamily: "'Source Sans 3', sans-serif", letterSpacing: '0.03em' }}>
          Open Farmer Dashboard \u2192
        </Link>
      </div>
      <Link to="/investor" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 10, border: `1.5px solid ${GREEN}`, color: GREEN, fontSize: 15, fontWeight: 600, textDecoration: 'none', fontFamily: "'Source Sans 3', sans-serif" }}>
        Open Investor View \u2192
      </Link>
      <p style={{ position: 'absolute', bottom: 48, fontSize: 14, color: TEXT_MUTED, maxWidth: 600 }}>
        1. Speak bond proposal \u2192 2. Watch 8 steps \u2192 3. Switch to investor \u2192 4. Click Invest
      </p>
    </div>
  );
}

function Slide7() {
  const metrics = [['$50M', 'Rural capital deployed annually'], ['10,000', 'Farmers funded across Ohio'], ['250,000', 'Acres of innovation funded'], ['500,000', 'Community investors engaged']];
  return (
    <div style={{ background: BG_MID, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {sectionLabel('PROJECTED IMPACT AT SCALE')}
      {headline('What This Looks Like in 5 Years', 48)}
      <div style={{ padding: '8px 20px', borderRadius: 8, background: '#f59e0b20', border: '1px solid #f59e0b40', color: '#f59e0b', fontSize: 13, marginBottom: 40 }}>
        \u26a0\ufe0f Projections based on market research \u2014 current data is from demo environment
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, maxWidth: 960 }}>
        {metrics.map(([num, label]) => (
          <div key={num}>
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
