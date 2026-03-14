import React, { useState, useMemo } from 'react';

const REPAYMENT_RATES = [
  { label: 'On Time', factor: 1.0, key: 'ontime' },
  { label: 'Delayed', factor: 0.85, key: 'delayed' },
  { label: 'Partial Default', factor: 0.5, key: 'partial' },
  { label: 'Full Default', factor: 0.0, key: 'default' },
];

function RepaymentSimulator({ bond }) {
  const bondAmount = bond?.amount || 10000;
  const riskScore = bond?.risk_score || bond?.risk_assessment?.risk_score || 50;

  const [investment, setInvestment] = useState(Math.min(1000, bondAmount));
  const [rateIndex, setRateIndex] = useState(0);
  const [earlyRepayment, setEarlyRepayment] = useState(false);
  const [reinvestment, setReinvestment] = useState(false);

  const scenarios = useMemo(() => {
    const rate = REPAYMENT_RATES[rateIndex];
    const baseReturn = 1 + (0.08 * rate.factor); // 8% annual return scaled by repayment factor
    const riskMult = 1 - (riskScore / 1000); // higher risk = lower expected
    const earlyBonus = earlyRepayment ? 0.02 : 0;
    const reinvestBonus = reinvestment ? 0.03 : 0;

    const best = {
      label: 'Best Case',
      color: 'var(--accent-green)',
      multiplier: baseReturn + 0.04 + earlyBonus + reinvestBonus,
    };
    const expected = {
      label: 'Expected',
      color: 'var(--accent-blue, #3b82f6)',
      multiplier: (baseReturn + earlyBonus + reinvestBonus) * riskMult,
    };
    const worst = {
      label: 'Worst Case',
      color: 'var(--accent-red, #ef4444)',
      multiplier: Math.max(baseReturn * riskMult - 0.06, rate.factor === 0 ? 0 : 0.7),
    };

    return [best, expected, worst].map((s) => {
      const totalReturned = investment * s.multiplier;
      const netGain = totalReturned - investment;
      const roi = ((netGain / investment) * 100);
      return { ...s, totalReturned, netGain, roi };
    });
  }, [investment, rateIndex, earlyRepayment, reinvestment, riskScore]);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amt);

  // SVG chart
  const chartW = 500;
  const chartH = 180;
  const pad = 40;
  const months = [0, 3, 6, 9, 12];
  const stepX = (chartW - pad * 2) / (months.length - 1);

  const explanations = {
    ontime: 'The farmer repays on schedule. This is the most common outcome for bonds with good compliance scores.',
    delayed: 'Repayment arrives late but in full. Returns are slightly reduced due to time value of money.',
    partial: 'The farmer can only repay a portion. Recovery depends on collateral and insurance.',
    default: 'Full default with no repayment. Loss is limited to your original investment.',
  };

  return (
    <div
      style={{
        fontFamily: 'Source Sans 3, sans-serif',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 28,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h3
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 22,
          color: 'var(--text-primary)',
          marginBottom: 20,
        }}
      >
        Repayment Simulator
      </h3>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
        {/* Investment slider */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            Investment Amount: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(investment)}</strong>
          </label>
          <input
            type="range"
            min={100}
            max={bondAmount}
            step={100}
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-green)' }}
          />
        </div>

        {/* Repayment rate */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            Repayment Scenario
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {REPAYMENT_RATES.map((rate, i) => (
              <button
                key={rate.key}
                onClick={() => setRateIndex(i)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: i === rateIndex ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                  backgroundColor: i === rateIndex ? 'var(--accent-green-dim)' : 'transparent',
                  color: i === rateIndex ? 'var(--accent-green)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'Source Sans 3, sans-serif',
                }}
              >
                {rate.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: '1 1 200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={earlyRepayment}
              onChange={(e) => setEarlyRepayment(e.target.checked)}
              style={{ accentColor: 'var(--accent-green)' }}
            />
            Early Repayment
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={reinvestment}
              onChange={(e) => setReinvestment(e.target.checked)}
              style={{ accentColor: 'var(--accent-green)' }}
            />
            Reinvestment
          </label>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ marginBottom: 24, overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', maxWidth: chartW }}>
          {/* Grid */}
          {[0, 0.5, 1].map((frac) => {
            const y = chartH - pad - frac * (chartH - pad * 2);
            return (
              <line key={frac} x1={pad} y1={y} x2={chartW - pad} y2={y} stroke="var(--border)" strokeWidth="1" />
            );
          })}
          {/* Month labels */}
          {months.map((m, i) => (
            <text
              key={m}
              x={pad + i * stepX}
              y={chartH - 10}
              textAnchor="middle"
              style={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Mo {m}
            </text>
          ))}
          {/* Lines */}
          {scenarios.map((sc) => {
            const maxVal = Math.max(...scenarios.map((s) => s.totalReturned), investment * 1.2);
            const points = months.map((m, i) => {
              const x = pad + i * stepX;
              const progress = m / 12;
              const val = investment + (sc.totalReturned - investment) * progress;
              const y = chartH - pad - ((val / maxVal) * (chartH - pad * 2));
              return `${x},${y}`;
            });
            return (
              <polyline
                key={sc.label}
                points={points.join(' ')}
                fill="none"
                stroke={sc.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {/* Legend */}
          {scenarios.map((sc, i) => (
            <g key={sc.label}>
              <line x1={pad} y1={12 + i * 14} x2={pad + 16} y2={12 + i * 14} stroke={sc.color} strokeWidth="2.5" />
              <text x={pad + 20} y={16 + i * 14} style={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Source Sans 3, sans-serif' }}>
                {sc.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Summary table */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Scenario</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Returned</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Net Gain/Loss</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>ROI</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((sc) => (
              <tr key={sc.label} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px', color: sc.color, fontWeight: 600 }}>{sc.label}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                  {formatCurrency(sc.totalReturned)}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: sc.netGain >= 0 ? 'var(--accent-green)' : 'var(--accent-red, #ef4444)',
                    fontWeight: 500,
                  }}
                >
                  {sc.netGain >= 0 ? '+' : ''}{formatCurrency(sc.netGain)}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    color: sc.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red, #ef4444)',
                    fontWeight: 500,
                  }}
                >
                  {sc.roi >= 0 ? '+' : ''}{sc.roi.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanation */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: '14px 18px',
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>
          {REPAYMENT_RATES[rateIndex].label} Scenario:
        </strong>{' '}
        {explanations[REPAYMENT_RATES[rateIndex].key]}
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
        Disclaimer: These projections are for illustrative purposes only. Actual returns may vary based on
        market conditions, crop yields, and borrower circumstances. Past performance does not guarantee future results.
        Agricultural investments carry inherent risk including potential loss of principal.
      </p>
    </div>
  );
}

export default RepaymentSimulator;
