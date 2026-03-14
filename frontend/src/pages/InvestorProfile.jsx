import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import { getInvestor, getPortfolio } from '../api';

const RISK_STYLES = {
  LOW: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' },
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' },
};

const STATUS_STYLES = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' },
  APPROVED: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
  FUNDED: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' },
};

function InvestorProfile() {
  const [investor, setInvestor] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalInvested: 0, activeBonds: 0, avgRisk: 0, estReturns: 0 });

  useEffect(() => {
    const investorId = localStorage.getItem('investor_id');
    if (!investorId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [invRes, portRes] = await Promise.all([
          getInvestor(investorId).catch(() => null),
          getPortfolio(investorId).catch(() => ({ portfolio: [] })),
        ]);
        if (invRes?.investor) setInvestor(invRes.investor);
        const items = portRes?.portfolio || [];
        setPortfolio(items);
        const totalInvested = items.reduce((s, p) => s + (p.amount_invested || 0), 0);
        const avgRisk = items.length > 0
          ? Math.round(items.reduce((s, p) => s + (p.risk_score || 50), 0) / items.length)
          : 0;
        const estReturns = items.reduce((s, p) => s + (p.returns_estimate || 0), 0);
        setStats({ totalInvested, activeBonds: items.length, avgRisk, estReturns });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amt || 0);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '96px 0' }}>
        <Loader2 style={{ width: 40, height: 40, color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!investor) {
    return (
      <div style={{ maxWidth: 500, margin: '64px auto', textAlign: 'center', padding: '0 24px', fontFamily: "'Source Sans 3', sans-serif" }}>
        <Briefcase style={{ width: 48, height: 48, color: 'var(--accent-green)', margin: '0 auto 16px', opacity: 0.5 }} />
        <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
          No investor profile found
        </p>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
          Visit the Investor Dashboard to create your profile.
        </p>
        <Link
          to="/investor"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 24,
            padding: '10px 20px',
            borderRadius: 8,
            backgroundColor: 'var(--accent-green)',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: "'Source Sans 3', sans-serif",
          }}
        >
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        <Link to="/investor" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
        {' > '}
        <Link to="/investor" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Marketplace</Link>
        {' > '}
        <span style={{ color: 'var(--text-secondary)' }}>Portfolio</span>
      </p>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {investor.name}
        </h1>
        <p style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)' }}>Portfolio Overview</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Invested', value: formatCurrency(stats.totalInvested), color: 'var(--text-primary)' },
          { label: 'Active Bonds', value: stats.activeBonds, color: 'var(--accent-green)' },
          { label: 'Avg Risk Score', value: stats.avgRisk, color: 'var(--text-primary)' },
          { label: 'Est. Returns', value: formatCurrency(stats.estReturns), color: 'var(--accent-green)' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                margin: 0,
                fontFamily: "'Source Sans 3', sans-serif",
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30,
                fontWeight: 700,
                color: stat.color,
                margin: '8px 0 0',
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Portfolio Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 20,
            fontFamily: "'Source Sans 3', sans-serif",
          }}
        >
          Portfolio
        </h2>
        {portfolio.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Bond', 'Invested', 'Status', 'Risk', 'Date'].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map((p, i) => {
                  const ss = STATUS_STYLES[p.bond_status] || STATUS_STYLES.PENDING;
                  const rs = RISK_STYLES[p.risk_level] || RISK_STYLES.MEDIUM;
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <Link
                          to={`/bond/${p.bond_id}`}
                          style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}
                        >
                          {p.bond_title}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-green)' }}>
                        {formatCurrency(p.amount_invested)}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: ss.bg,
                            color: ss.color,
                          }}
                        >
                          {p.bond_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: rs.bg,
                            color: rs.color,
                          }}
                        >
                          {p.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>
                        {formatDate(p.date_invested)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Briefcase style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--accent-green)', opacity: 0.4 }} />
            <p>No investments yet</p>
            <p style={{ marginTop: 4, fontSize: 14 }}>Browse the marketplace to find bonds to invest in.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvestorProfile;
