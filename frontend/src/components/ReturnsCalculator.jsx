import React, { useState, useMemo } from 'react';

const TERMS = [6, 12, 24];

function ReturnsCalculator({ bond, onInvestAmount }) {
  const maxAmount = Math.max((bond.funding_goal || bond.amount || 50000) - (bond.amount_raised || 0), 500);
  const [amount, setAmount] = useState(Math.min(5000, maxAmount));
  const [term, setTerm] = useState(12);
  const rate = (bond.risk_score || 50) < 40 ? 0.1 : (bond.risk_score || 50) < 70 ? 0.08 : 0.06;

  const calc = useMemo(() => {
    const monthlyReturn = (amount * rate) / 12;
    const totalReturn = amount + (amount * rate * (term / 12));
    const totalEarned = totalReturn - amount;
    const roi = ((totalEarned / amount) * 100);
    return { monthlyReturn, totalReturn, totalEarned, roi };
  }, [amount, term, rate]);

  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

  return (
    <div style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Investment Amount</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-green)', fontFamily: "'Playfair Display', serif" }}>{fmt(amount)}</span>
        </div>
        <input type="range" min={500} max={maxAmount} step={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-green)' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TERMS.map((t) => (
          <button key={t} onClick={() => setTerm(t)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${term === t ? 'var(--accent-green)' : 'var(--border)'}`,
              backgroundColor: term === t ? 'var(--accent-green)' : '#fff',
              color: term === t ? '#fff' : 'var(--text-secondary)',
              fontFamily: "'Source Sans 3', sans-serif",
            }}>
            {t}mo
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'var(--bg-elevated)', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Monthly Return</p>
          <p style={{ fontSize: 20, fontFamily: "'Playfair Display', serif", color: 'var(--accent-green)', margin: '4px 0 0' }}>{fmt(calc.monthlyReturn)}</p>
        </div>
        <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'var(--bg-elevated)', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Total Return</p>
          <p style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", color: 'var(--accent-green)', margin: '4px 0 0', fontWeight: 700 }}>{fmt(calc.totalReturn)}</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interest earned: <strong style={{ color: 'var(--accent-green)' }}>{fmt(calc.totalEarned)}</strong></span>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
          {calc.roi.toFixed(1)}% ROI
        </span>
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>Returns are estimates. Not financial advice.</p>
      {onInvestAmount && (
        <button onClick={() => onInvestAmount(amount)}
          style={{
            width: '100%', padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            backgroundColor: 'var(--accent-green)', color: '#fff', fontSize: 12, fontWeight: 600,
            fontFamily: "'Source Sans 3', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
          Invest {fmt(amount)}
        </button>
      )}
    </div>
  );
}

export default ReturnsCalculator;
