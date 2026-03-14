import React, { useState, useEffect } from 'react';
import { Loader2, Info } from 'lucide-react';
import { getCountyAnalytics } from '../api';

const COUNTIES = ['Franklin', 'Delaware', 'Licking', 'Pickaway', 'Madison', 'Union', 'Knox', 'Ross', 'Clark', 'Wayne', 'Holmes', 'Miami', 'Darke', 'Mercer', 'Putnam', 'Fairfield', 'Marion', 'Logan', 'Hamilton', 'Montgomery', 'Cuyahoga', 'Summit', 'Stark', 'Lucas'];

const TREND_DISPLAY = {
  UP: { arrow: '\u2191', color: 'var(--accent-green)', label: 'Trending Up' },
  DOWN: { arrow: '\u2193', color: 'var(--accent-red)', label: 'Trending Down' },
  STABLE: { arrow: '\u2192', color: 'var(--accent-amber)', label: 'Stable' },
};

function MiniYieldChart({ yearsData, color }) {
  if (!yearsData || yearsData.length === 0) return null;
  const values = yearsData.map((d) => d.yield || 0);
  const minV = Math.min(...values) * 0.95;
  const maxV = Math.max(...values) * 1.05;
  const range = maxV - minV || 1;
  const w = 120;
  const h = 40;
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * w;
    const y = h - ((v - minV) / range) * (h - 4);
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={areaPath} fill={color} opacity="0.1" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {yearsData.map((d, i) => (
        <text key={i} x={points[i].x} y={h - 1} textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontFamily="'Source Sans 3', sans-serif">
          {String(d.year).slice(2)}
        </text>
      ))}
    </svg>
  );
}

function TrendBadge({ trend }) {
  const t = TREND_DISPLAY[trend] || TREND_DISPLAY.STABLE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      backgroundColor: `${t.color}15`, color: t.color,
    }}>
      <span style={{ fontSize: 14 }}>{t.arrow}</span> {t.label}
    </span>
  );
}

function CropYieldCard({ label, data, color }) {
  if (!data) return null;
  return (
    <div style={{
      padding: 14, borderRadius: 8, backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <TrendBadge trend={data.trend} />
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--accent-green)', marginBottom: 4 }}>
        {data.avg_yield} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>bu/acre avg</span>
      </div>
      {data.best_year > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Best: {data.best_yield} bu/acre ({data.best_year})
        </div>
      )}
      <MiniYieldChart yearsData={data.years_data} color={color} />
    </div>
  );
}

function CountyCompare() {
  const [countyA, setCountyA] = useState('Franklin');
  const [countyB, setCountyB] = useState('Delaware');
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [a, b] = await Promise.all([getCountyAnalytics(countyA), getCountyAnalytics(countyB)]);
        setDataA(a);
        setDataB(b);
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [countyA, countyB]);

  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v || 0);

  const metrics = [
    { label: 'Active Bonds', key: 'bond_count', higher: true },
    { label: 'Total Raised', key: 'total_raised', higher: true, format: fmt },
    { label: 'Avg Compliance', key: 'avg_compliance', higher: true, suffix: '%' },
    { label: 'Avg Risk', key: 'avg_risk', higher: false },
    { label: 'Top Crop', key: 'top_crop' },
    { label: 'USDA Corn Yield', key: 'usda_yield', higher: true, suffix: ' bu/acre' },
  ];

  const selectStyle = {
    padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
    fontSize: 16, fontFamily: "'Source Sans 3', sans-serif", width: '100%', outline: 'none',
  };

  const source = dataA?.source || dataB?.source || 'USDA NASS 2024 Ohio Annual Crop Summary';
  const isLive = source === 'USDA NASS';
  const lastUpdated = dataA?.last_updated || dataB?.last_updated;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Page Header */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px 0', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Compare Counties
              </h1>
              <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                Side-by-side county performance comparison
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {/* Source badge + info tooltip */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  backgroundColor: 'var(--accent-green-dim)',
                  color: 'var(--accent-green)',
                  border: '1px solid var(--accent-green)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-green)' }} />
                  Source: {isLive ? 'USDA NASS \u2014 Live Data' : source}
                </span>
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }}
                >
                  <Info size={14} />
                </button>
                {showTooltip && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 14px', width: 260, zIndex: 20,
                    boxShadow: 'var(--shadow-md)', fontSize: 12, lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}>
                    2024 county-level estimates based on USDA NASS Ohio Annual Crop Summary. 2025 county data publishes mid-2026.
                  </div>
                )}
              </div>
              {lastUpdated && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Updated: {new Date(lastUpdated).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        {/* County Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 32 }}>
          <select value={countyA} onChange={(e) => setCountyA(e.target.value)} style={selectStyle}>
            {COUNTIES.map((c) => <option key={c} value={c}>{c} County</option>)}
          </select>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--text-muted)' }}>vs</span>
          <select value={countyB} onChange={(e) => setCountyB(e.target.value)} style={selectStyle}>
            {COUNTIES.map((c) => <option key={c} value={c}>{c} County</option>)}
          </select>
        </div>

        {/* State context note */}
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 24,
          backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Ohio 2024:</strong> Avg 177 bu/acre corn, 50 bu/acre soybeans. Yields down statewide due to abnormally dry growing season.
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={32} style={{ color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : dataA && dataB ? (
          <div>
            {/* Metrics comparison rows */}
            {metrics.map((m) => {
              const vA = dataA[m.key];
              const vB = dataB[m.key];
              const winA = m.higher !== undefined ? (m.higher ? vA > vB : vA < vB) : false;
              const winB = m.higher !== undefined ? (m.higher ? vB > vA : vB < vA) : false;
              const displayA = m.format ? m.format(vA) : `${vA}${m.suffix || ''}`;
              const displayB = m.format ? m.format(vB) : `${vB}${m.suffix || ''}`;
              return (
                <div key={m.key} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    padding: 16, borderRadius: 8,
                    border: `2px solid ${winA ? 'var(--accent-green)' : 'var(--border)'}`,
                    backgroundColor: 'var(--bg-card)', textAlign: 'right',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: winA ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {displayA}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {m.label}
                  </div>
                  <div style={{
                    padding: 16, borderRadius: 8,
                    border: `2px solid ${winB ? 'var(--accent-green)' : 'var(--border)'}`,
                    backgroundColor: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: winB ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {displayB}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* USDA Yield Detail Cards */}
            <div style={{ marginTop: 32 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 22,
                color: 'var(--text-primary)', marginBottom: 20,
              }}>
                USDA Crop Yield Data
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* County A */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {countyA} County
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CropYieldCard label="Corn" data={dataA.corn} color="var(--accent-green)" />
                    <CropYieldCard label="Soybeans" data={dataA.soybeans} color="var(--accent-blue)" />
                  </div>
                </div>
                {/* County B */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {countyB} County
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CropYieldCard label="Corn" data={dataB.corn} color="var(--accent-green)" />
                    <CropYieldCard label="Soybeans" data={dataB.soybeans} color="var(--accent-blue)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CountyCompare;
