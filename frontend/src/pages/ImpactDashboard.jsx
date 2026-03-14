import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getImpact } from '../api';

function ImpactDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getImpact()
      .then((res) => setData(res))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load impact data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-green)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)', fontFamily: 'Source Sans 3, sans-serif' }}>
        <p>{error}</p>
      </div>
    );
  }

  const impact = data || {};
  const acresFunded = impact.acres_funded || 1240;
  const farmersSupported = impact.farmers_supported || 89;
  const foodProduced = impact.food_produced_lbs || 2480000;
  const co2Saved = impact.co2_saved_tons || 312;
  const cropBreakdown = impact.crop_breakdown || [
    { crop: 'Corn', acres: 420 },
    { crop: 'Soybeans', acres: 350 },
    { crop: 'Wheat', acres: 280 },
    { crop: 'Rice', acres: 190 },
  ];
  const countyData = impact.county_data || [
    { county: 'Hardin County', farmers: 12, acres: 280, bonds: 18 },
    { county: 'Story County', farmers: 9, acres: 210, bonds: 14 },
    { county: 'Polk County', farmers: 7, acres: 160, bonds: 11 },
  ];
  const monthlyProgress = impact.monthly_progress || [
    { month: 'Sep', value: 120 },
    { month: 'Oct', value: 210 },
    { month: 'Nov', value: 340 },
    { month: 'Dec', value: 480 },
    { month: 'Jan', value: 620 },
    { month: 'Feb', value: 780 },
    { month: 'Mar', value: 920 },
  ];

  const maxCropAcres = Math.max(...cropBreakdown.map((c) => c.acres));
  const maxMonthly = Math.max(...monthlyProgress.map((m) => m.value));
  const chartW = 600;
  const chartH = 200;
  const padding = 40;
  const stepX = (chartW - padding * 2) / (monthlyProgress.length - 1);

  const linePath = monthlyProgress
    .map((pt, i) => {
      const x = padding + i * stepX;
      const y = chartH - padding - ((pt.value / maxMonthly) * (chartH - padding * 2));
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const statCards = [
    { label: 'Acres Funded', value: acresFunded.toLocaleString(), emoji: '\uD83C\uDF3E' },
    { label: 'Farmers Supported', value: farmersSupported.toLocaleString(), emoji: '\uD83D\uDC68\u200D\uD83C\uDF3E' },
    { label: 'Food Produced (lbs)', value: foodProduced.toLocaleString(), emoji: '\uD83C\uDF3D' },
    { label: 'CO2 Saved (tons)', value: co2Saved.toLocaleString(), emoji: '\uD83C\uDF0D' },
  ];

  return (
    <div style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
      {/* Hero */}
      <section
        style={{
          backgroundColor: 'var(--accent-green)',
          color: '#ffffff',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 48,
            lineHeight: 1.2,
            marginBottom: 16,
            maxWidth: 700,
            margin: '0 auto 16px',
          }}
        >
          Growing Communities, Feeding the Future
        </h1>
        <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 560, margin: '0 auto' }}>
          See the real-world impact of community-funded agricultural bonds across rural America.
        </p>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 24px', backgroundColor: 'var(--bg-primary)' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
          }}
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.emoji}</div>
              <div
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 40,
                  color: 'var(--accent-green)',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact by Crop */}
      <section style={{ padding: '60px 24px', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 28,
              color: 'var(--text-primary)',
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            Impact by Crop
          </h2>
          {cropBreakdown.map((crop) => (
            <div key={crop.crop} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {crop.crop}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {crop.acres} acres
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(crop.acres / maxCropAcres) * 100}%`,
                    backgroundColor: 'var(--accent-green)',
                    borderRadius: 6,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact by County */}
      <section style={{ padding: '60px 24px', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 28,
              color: 'var(--text-primary)',
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            Impact by County
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {countyData.map((county) => (
              <div
                key={county.county}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '16px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                  {county.county}
                </span>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>{county.farmers} farmers</span>
                  <span>{county.acres} acres</span>
                  <span>{county.bonds} bonds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Progress */}
      <section style={{ padding: '60px 24px', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 28,
              color: 'var(--text-primary)',
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            Monthly Progress
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', maxWidth: chartW }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = chartH - padding - frac * (chartH - padding * 2);
                return (
                  <line
                    key={frac}
                    x1={padding}
                    y1={y}
                    x2={chartW - padding}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Line */}
              <path d={linePath} fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Dots */}
              {monthlyProgress.map((pt, i) => {
                const x = padding + i * stepX;
                const y = chartH - padding - ((pt.value / maxMonthly) * (chartH - padding * 2));
                return (
                  <circle key={i} cx={x} cy={y} r={5} fill="var(--accent-green)" stroke="#ffffff" strokeWidth="2" />
                );
              })}
              {/* Labels */}
              {monthlyProgress.map((pt, i) => {
                const x = padding + i * stepX;
                return (
                  <text
                    key={i}
                    x={x}
                    y={chartH - 10}
                    textAnchor="middle"
                    style={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    {pt.month}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section
        style={{
          backgroundColor: 'var(--accent-green)',
          color: '#ffffff',
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 32,
            marginBottom: 16,
          }}
        >
          Join the Movement
        </h2>
        <p style={{ fontSize: 16, opacity: 0.9, maxWidth: 500, margin: '0 auto 24px' }}>
          Invest in rural communities and see your impact grow with every bond funded.
        </p>
        <Link
          to="/investor"
          style={{
            display: 'inline-block',
            backgroundColor: '#ffffff',
            color: 'var(--accent-green)',
            padding: '12px 32px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
            transition: 'opacity 200ms',
          }}
        >
          Start Investing
        </Link>
      </section>
    </div>
  );
}

export default ImpactDashboard;
