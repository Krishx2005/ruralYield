import React, { useState, useEffect } from 'react';
import {
  Loader2,
  DollarSign,
  BarChart3,
  Users,
  Shield,
} from 'lucide-react';
import { getAnalytics } from '../api';

const STATUS_COLORS = {
  APPROVED: 'var(--accent-green)',
  FUNDED: 'var(--accent-blue)',
  REJECTED: 'var(--accent-red)',
  PENDING: 'var(--accent-amber)',
};

const CROP_COLORS = ['#2d6a2d', '#2471a3', '#b8860b', '#c0392b', '#5b8c5a', '#7fb069', '#3e8e41'];

function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getAnalytics();
        setData(result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amt || 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '96px 0' }}>
        <Loader2 style={{ width: 40, height: 40, color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Source Sans 3', sans-serif" }}>
        <BarChart3 style={{ width: 48, height: 48, margin: '0 auto 12px' }} />
        <p style={{ fontSize: 18 }}>Unable to load analytics</p>
      </div>
    );
  }

  const statusEntries = Object.entries(data.bonds_by_status || {});
  const totalStatusBonds = statusEntries.reduce((s, [, v]) => s + v, 0) || 1;

  const cropEntries = Object.entries(data.bonds_by_crop || {});
  const totalCropBonds = cropEntries.reduce((s, [, v]) => s + v, 0) || 1;

  const riskData = data.bonds_by_risk || {};
  const totalRiskBonds = Object.values(riskData).reduce((s, v) => s + v, 0) || 1;

  // Line chart data
  const funding = data.funding_over_time || [];
  const maxFunding = Math.max(...funding.map((f) => f.amount_raised), 1);

  // Build SVG path for line chart
  const chartW = 700;
  const chartH = 200;
  const points = funding.map((f, i) => {
    const x = (i / Math.max(funding.length - 1, 1)) * chartW;
    const y = chartH - (f.amount_raised / maxFunding) * (chartH - 20);
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${chartW},${chartH} L0,${chartH} Z`;

  // Donut chart
  const donutR = 70;
  const donutStroke = 28;
  const donutCirc = 2 * Math.PI * donutR;
  let donutOffset = 0;

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: 24,
    fontFamily: "'Source Sans 3', sans-serif",
  };

  const thStyle = {
    paddingBottom: 12,
    paddingRight: 16,
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  };

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
      {/* Page Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '32px 0',
          marginBottom: 32,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Analytics
          </h1>
          <p style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            Platform-wide performance metrics and insights
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        {/* Hero Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Capital Raised', value: formatCurrency(data.total_raised), icon: DollarSign, color: 'var(--accent-green)' },
            { label: 'Active Bonds', value: data.total_bonds, icon: BarChart3, color: 'var(--text-primary)' },
            { label: 'Total Investors', value: data.total_investors, icon: Users, color: 'var(--accent-blue)' },
            { label: 'Avg Compliance', value: `${data.avg_compliance_score}%`, icon: Shield, color: 'var(--accent-green)' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{ ...cardStyle, padding: 24, animation: 'fadeUp 0.4s ease forwards', animationDelay: `${i * 80}ms` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <stat.icon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                <p style={{ ...sectionLabel, margin: 0, marginBottom: 0, fontSize: 11 }}>{stat.label}</p>
              </div>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: stat.color,
                  margin: 0,
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row 1: Status Bars + Donut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Bonds by Status - Horizontal Bar */}
          <div style={{ ...cardStyle, animation: 'fadeUp 0.4s ease forwards', animationDelay: '200ms' }}>
            <h2 style={sectionLabel}>Bonds by Status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {statusEntries.map(([status, count]) => {
                const pct = Math.round((count / totalStatusBonds) * 100);
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {status}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, backgroundColor: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 999,
                          width: `${pct}%`,
                          backgroundColor: STATUS_COLORS[status] || 'var(--text-muted)',
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bonds by Crop - Donut */}
          <div style={{ ...cardStyle, animation: 'fadeUp 0.4s ease forwards', animationDelay: '280ms' }}>
            <h2 style={sectionLabel}>Bonds by Crop Type</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <svg width="180" height="180" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
                {cropEntries.map(([crop, count], i) => {
                  const pct = count / totalCropBonds;
                  const dash = donutCirc * pct;
                  const gap = donutCirc - dash;
                  const rotation = (donutOffset / totalCropBonds) * 360;
                  donutOffset += count;
                  return (
                    <circle
                      key={crop}
                      cx="100"
                      cy="100"
                      r={donutR}
                      fill="none"
                      stroke={CROP_COLORS[i % CROP_COLORS.length]}
                      strokeWidth={donutStroke}
                      strokeDasharray={`${dash} ${gap}`}
                      transform={`rotate(${rotation - 90} 100 100)`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  );
                })}
                <text x="100" y="95" textAnchor="middle" fill="var(--text-primary)" fontFamily="'Playfair Display', serif" fontSize="28" fontWeight="700">
                  {totalCropBonds}
                </text>
                <text x="100" y="115" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="'Source Sans 3', sans-serif">
                  bonds
                </text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {cropEntries.map(([crop, count], i) => (
                  <div key={crop} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        flexShrink: 0,
                        backgroundColor: CROP_COLORS[i % CROP_COLORS.length],
                      }}
                    />
                    <span style={{ fontSize: 14, flex: 1, color: 'var(--text-secondary)' }}>
                      {crop}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24, animation: 'fadeUp 0.4s ease forwards', animationDelay: '360ms' }}>
          {[
            { level: 'LOW', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', borderColor: 'var(--accent-green)' },
            { level: 'MEDIUM', color: 'var(--accent-amber)', bg: 'rgba(184,134,11,0.12)', borderColor: 'var(--accent-amber)' },
            { level: 'HIGH', color: 'var(--accent-red)', bg: 'rgba(192,57,43,0.08)', borderColor: 'var(--accent-red)' },
          ].map(({ level, color, bg, borderColor }) => {
            const count = riskData[level] || 0;
            const pct = Math.round((count / totalRiskBonds) * 100);
            return (
              <div
                key={level}
                style={{
                  ...cardStyle,
                  padding: 24,
                  textAlign: 'center',
                  borderTop: `3px solid ${borderColor}`,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    borderRadius: 999,
                    padding: '4px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: bg,
                    color: color,
                    marginBottom: 12,
                  }}
                >
                  {level} RISK
                </span>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 48,
                    fontWeight: 700,
                    color: color,
                    margin: 0,
                  }}
                >
                  {count}
                </p>
                <p style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>
                  {pct}% of bonds
                </p>
              </div>
            );
          })}
        </div>

        {/* Top Counties Table */}
        <div style={{ ...cardStyle, marginBottom: 24, animation: 'fadeUp 0.4s ease forwards', animationDelay: '440ms' }}>
          <h2 style={sectionLabel}>Top Counties</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Rank', 'County', 'Bonds', 'Total Raised'].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.top_counties || []).map((c, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px 12px 0' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          width: 24,
                          height: 24,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'var(--accent-green-dim)',
                          color: 'var(--accent-green)',
                        }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px 12px 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {c.county}
                    </td>
                    <td style={{ padding: '12px 16px 12px 0', color: 'var(--text-secondary)' }}>
                      {c.bond_count}
                    </td>
                    <td style={{ padding: '12px 16px 12px 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-green)' }}>
                      {formatCurrency(c.total_raised)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funding Over Time - Line Chart with Hover Tooltips */}
        <div style={{ ...cardStyle, animation: 'fadeUp 0.4s ease forwards', animationDelay: '520ms' }}>
          <h2 style={sectionLabel}>Funding Over Time (Last 30 Days)</h2>
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <svg
              viewBox={`-40 -10 ${chartW + 60} ${chartH + 40}`}
              style={{ width: '100%', minWidth: 500 }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Y-axis labels & grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = chartH - frac * (chartH - 20);
                const val = Math.round(frac * maxFunding);
                return (
                  <g key={frac}>
                    <line x1="0" y1={y} x2={chartW} y2={y} stroke="var(--border)" strokeWidth="0.5" />
                    <text x="-8" y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="'Source Sans 3', sans-serif">
                      ${val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                    </text>
                  </g>
                );
              })}
              {/* X-axis labels (every 5 days) */}
              {funding.filter((_, i) => i % 5 === 0).map((f, i) => {
                const x = ((i * 5) / Math.max(funding.length - 1, 1)) * chartW;
                return (
                  <text key={i} x={x} y={chartH + 20} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="'Source Sans 3', sans-serif">
                    {f.date.slice(5)}
                  </text>
                );
              })}
              {/* Area fill */}
              <path d={areaPath} fill="var(--accent-green)" opacity="0.06" />
              {/* Line */}
              <path d={linePath} fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Dot on last point (always visible) */}
              {points.length > 0 && hoveredPoint === null && (
                <circle
                  cx={points[points.length - 1].x}
                  cy={points[points.length - 1].y}
                  r="4"
                  fill="var(--accent-green)"
                />
              )}
              {/* Hover vertical gridline */}
              {hoveredPoint !== null && points[hoveredPoint] && (
                <line
                  x1={points[hoveredPoint].x}
                  y1={0}
                  x2={points[hoveredPoint].x}
                  y2={chartH}
                  stroke="var(--accent-green)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.4"
                />
              )}
              {/* Hover visible dot */}
              {hoveredPoint !== null && points[hoveredPoint] && (
                <circle
                  cx={points[hoveredPoint].x}
                  cy={points[hoveredPoint].y}
                  r="6"
                  fill="var(--accent-green)"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              {/* Invisible hit areas for each data point */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="20"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
              {/* SVG tooltip */}
              {hoveredPoint !== null && points[hoveredPoint] && funding[hoveredPoint] && (() => {
                const pt = points[hoveredPoint];
                const d = funding[hoveredPoint];
                const tooltipW = 120;
                const tooltipH = 52;
                const pointerH = 6;
                const nearRightEdge = pt.x > chartW - tooltipW;
                const tooltipX = nearRightEdge
                  ? pt.x - tooltipW + 20
                  : pt.x - tooltipW / 2;
                const tooltipY = pt.y - tooltipH - pointerH - 10;
                const pointerX = pt.x;
                return (
                  <g style={{ pointerEvents: 'none', opacity: 1, transition: 'opacity 150ms ease' }}>
                    {/* Tooltip background */}
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipW}
                      height={tooltipH}
                      rx="8"
                      ry="8"
                      fill="#ffffff"
                      stroke="var(--border)"
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 16px rgba(45,106,45,0.12))"
                    />
                    {/* Pointer triangle */}
                    <polygon
                      points={`${pointerX - 5},${tooltipY + tooltipH} ${pointerX + 5},${tooltipY + tooltipH} ${pointerX},${tooltipY + tooltipH + pointerH}`}
                      fill="#ffffff"
                      stroke="var(--border)"
                      strokeWidth="1"
                    />
                    {/* Cover the triangle's top stroke so it blends with rect */}
                    <line
                      x1={pointerX - 6}
                      y1={tooltipY + tooltipH}
                      x2={pointerX + 6}
                      y2={tooltipY + tooltipH}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Date text */}
                    <text
                      x={tooltipX + tooltipW / 2}
                      y={tooltipY + 18}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="11"
                      fontFamily="'Source Sans 3', sans-serif"
                    >
                      {d.date}
                    </text>
                    {/* Amount text */}
                    <text
                      x={tooltipX + tooltipW / 2}
                      y={tooltipY + 40}
                      textAnchor="middle"
                      fill="var(--accent-green)"
                      fontSize="16"
                      fontWeight="700"
                      fontFamily="'Playfair Display', serif"
                    >
                      {formatCurrency(d.amount_raised)}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
