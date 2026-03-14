import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { createBond, getActivity, getBonds } from '../api';

function DemoPage() {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [lastBond, setLastBond] = useState(null);
  const [logs, setLogs] = useState({ elevenlabs: [], featherless: [], bedrock: [], jaseci: [] });

  const fetchData = useCallback(async () => {
    try {
      const [actRes, bondRes] = await Promise.all([getActivity(10), getBonds()]);
      setEvents(actRes.events || []);
      const bonds = bondRes.bonds || [];
      if (bonds.length > 0) setLastBond(bonds[0]);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const runDemo = async () => {
    setRunning(true);
    setLogs({ elevenlabs: ['Starting voice synthesis...'], featherless: ['Initializing compliance check...'], bedrock: ['Connecting to risk model...'], jaseci: ['Agent pipeline starting...'] });
    try {
      const result = await createBond({
        title: 'Demo Corn Innovation Bond',
        amount: 15000,
        crop_type: 'CORN',
        county: 'Franklin County',
        description: 'Precision agriculture demo for hackathon judges. Testing all 4 sponsor APIs in real time.',
        farmer_name: 'Demo Farmer',
      });
      setLogs({
        elevenlabs: ['STT: Transcription complete', `TTS: Voice response generated for "${result.decision}"`],
        featherless: ['Llama 3 compliance check complete', `Score: ${result.compliance_score}/100`],
        bedrock: ['Claude Sonnet risk analysis complete', `Risk: ${result.risk_level} (${result.risk_score}/100)`],
        jaseci: (result.audit_trail || []).map((s) => `[${s.step}] ${s.detail?.status || 'done'}`),
      });
      await fetchData();
    } catch (err) {
      setLogs((prev) => ({ ...prev, jaseci: [...prev.jaseci, `Error: ${err.message}`] }));
    } finally {
      setRunning(false);
    }
  };

  const panelStyle = { backgroundColor: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' };
  const labelStyle = { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 };
  const logStyle = { fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#8888aa', lineHeight: 1.8 };
  const panels = [
    { key: 'elevenlabs', label: 'ElevenLabs Voice API', color: '#00d4aa' },
    { key: 'featherless', label: 'Featherless.AI \u2014 Llama 3 Compliance', color: '#f59e0b' },
    { key: 'bedrock', label: 'AWS Bedrock \u2014 Claude Sonnet Risk Model', color: '#3b82f6' },
    { key: 'jaseci', label: 'Jaseci Autonomous Agent', color: '#ef4444' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#f0f0f5', fontFamily: "'Source Sans 3', sans-serif" }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#00d4aa' }}>RuralYield</span>
          <span style={{ fontSize: 13, color: '#8888aa' }}>\u2014 Live System Demo</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#555570' }}>
          <span>AWS</span><span>ElevenLabs</span><span>Featherless AI</span><span>Jaseci</span>
        </div>
      </div>
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 1200, margin: '0 auto' }}>
        {panels.map((p) => (
          <div key={p.key} style={panelStyle}>
            <div style={{ ...labelStyle, color: p.color }}>{p.label}</div>
            <div style={{ flex: 1, ...logStyle }}>
              {(logs[p.key] || []).map((line, i) => <div key={i} style={{ marginBottom: 4 }}><span style={{ color: '#555570' }}>[{new Date().toLocaleTimeString()}]</span> {line}</div>)}
              {logs[p.key]?.length === 0 && <span style={{ color: '#555570' }}>Waiting for demo...</span>}
            </div>
            {p.key === 'featherless' && lastBond && <div style={{ marginTop: 8, fontSize: 28, fontFamily: "'Playfair Display', serif", color: p.color }}>{lastBond.compliance_score || 0}/100</div>}
            {p.key === 'bedrock' && lastBond && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: lastBond.risk_level === 'LOW' ? 'rgba(0,212,170,0.2)' : lastBond.risk_level === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: lastBond.risk_level === 'LOW' ? '#00d4aa' : lastBond.risk_level === 'HIGH' ? '#ef4444' : '#f59e0b' }}>{lastBond.risk_level || 'N/A'}</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: p.color }}>{lastBond.risk_score || 0}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '24px 0 48px' }}>
        <button onClick={runDemo} disabled={running}
          style={{
            padding: '14px 48px', borderRadius: 8, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
            backgroundColor: '#00d4aa', color: '#0a0a0f', fontSize: 15, fontWeight: 700,
            fontFamily: "'Source Sans 3', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase',
            opacity: running ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
          {running ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Running Demo...</> : 'Run Live Demo'}
        </button>
      </div>
    </div>
  );
}

export default DemoPage;
