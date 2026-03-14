import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  MapPin,
  User,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Volume2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import ComplianceReport, { ScoreGauge } from '../components/ComplianceReport';
import AgentExplainer from '../components/AgentExplainer';
import PrintableBondAudit from '../components/PrintableBondAudit';
import { getBond, synthesizeSpeech, getRepaymentSchedule } from '../api';

const STATUS_STYLES = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', border: 'var(--accent-amber)' },
  APPROVED: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)', border: 'var(--accent-green)' },
  FUNDED: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: 'var(--accent-blue)' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: 'var(--accent-red)' },
};

const RISK_STYLES = {
  LOW: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' },
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' },
};

const STEP_LABELS = {
  receive: 'Receive Bond Application',
  transcribe: 'Transcribe Voice Input',
  validate: 'Validate Bond Data',
  usda: 'Fetch USDA Yield Data',
  compliance: 'Run Compliance Check',
  risk: 'Score Risk Assessment',
  decision: 'Agent Decision',
  ledger: 'Record to Ledger',
};

function BondDetail() {
  const { id } = useParams();
  const [bond, setBond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [repayment, setRepayment] = useState(null);
  const [repaymentRate, setRepaymentRate] = useState(8);
  const [repaymentTerm, setRepaymentTerm] = useState(12);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    async function fetchBond() {
      setLoading(true);
      setError('');
      try {
        const data = await getBond(id);
        const bondData = data.bond || data;
        console.log('Bond fetched:', bondData);
        setBond(bondData);
      } catch (err) {
        console.error('Bond fetch error:', err);
        setError(
          err.response?.data?.detail || 'Failed to load bond details.'
        );
      } finally {
        setLoading(false);
      }
    }
    fetchBond();
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [id]);

  const handleReadAloud = async () => {
    if (!bond) return;
    setSpeaking(true);
    try {
      const text = `Bond details for ${bond.title}. Amount: ${formatCurrency(
        bond.amount
      )}. Status: ${bond.status}. Crop type: ${bond.crop_type}. County: ${
        bond.county
      }. ${bond.risk_assessment?.reasoning || ''}`;
      const audioBlob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  };

  const fetchRepayment = async () => {
    if (!bond) return;
    try {
      const data = await getRepaymentSchedule(id, { interest_rate: repaymentRate, term_months: repaymentTerm });
      setRepayment(data);
    } catch {}
  };

  useEffect(() => {
    if (bond && (bond.status === 'FUNDED')) fetchRepayment();
  }, [bond, repaymentRate, repaymentTerm]);

  const handleExportAudit = () => {
    setShowPrint(true);
    setTimeout(() => { window.print(); setTimeout(() => setShowPrint(false), 500); }, 100);
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amt || 0);

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '96px 0' }}>
        <Loader2
          style={{ width: 40, height: 40, color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '64px auto', textAlign: 'center', padding: '0 24px' }}>
        <AlertTriangle
          style={{ width: 48, height: 48, color: 'var(--accent-red)', margin: '0 auto 16px' }}
        />
        <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {error}
        </p>
        <Link
          to="/"
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
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!bond) return null;

  const compliance = bond.compliance_report || bond.compliance || null;
  const risk = bond.risk_assessment || bond.risk || null;
  const agentSteps = bond.agent_steps || bond.processing_steps || [];
  const ledger = bond.ledger_transactions || bond.transactions || [];
  const yieldData = bond.usda_yield_data || bond.yield_data || null;
  const statusStyle = STATUS_STYLES[bond.status] || STATUS_STYLES.PENDING;
  const riskStyle = RISK_STYLES[risk?.risk_level] || RISK_STYLES.MEDIUM;

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    margin: '0 0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: "'Source Sans 3', sans-serif",
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
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
    <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif", maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        <Link to="/investor" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
        {' > '}
        <Link to="/investor" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Marketplace</Link>
        {' > '}
        <span style={{ color: 'var(--text-secondary)' }}>{bond.title}</span>
      </p>

      {/* Header Card */}
      <div style={{ ...cardStyle, marginBottom: 24, boxShadow: '0 4px 16px rgba(45,106,45,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {bond.title}
              </h1>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {bond.status}
              </span>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, fontSize: 14 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                }}
              >
                {formatCurrency(bond.amount)}
              </span>
              {bond.farmer_name && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                  <User style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                  {bond.farmer_name}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <MapPin style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                {bond.county}
              </span>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 12,
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                {bond.crop_type}
              </span>
            </div>

            {bond.description && (
              <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                {bond.description}
              </p>
            )}

            {/* Funding Progress */}
            <div style={{ marginTop: 20 }}>
              {(() => {
                const goal = bond.funding_goal || bond.amount || 0;
                const raised = bond.amount_raised || bond.total_invested || 0;
                const count = bond.investor_count || 0;
                const pct = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
                const isFunded = pct >= 100;
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 48,
                          fontWeight: 700,
                          color: isFunded ? 'var(--accent-blue)' : 'var(--accent-green)',
                          lineHeight: 1,
                        }}
                      >
                        {pct}%
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>funded</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        width: '100%',
                        borderRadius: 999,
                        backgroundColor: 'var(--bg-elevated)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 999,
                          width: `${pct}%`,
                          backgroundColor: isFunded ? 'var(--accent-blue)' : 'var(--accent-green)',
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                    <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatCurrency(raised)} raised of {formatCurrency(goal)} goal
                      {count > 0 && ` \u00B7 ${count} investor${count !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          <button
            onClick={handleReadAloud}
            disabled={speaking}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              cursor: speaking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            {speaking ? (
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
            ) : (
              <Volume2 style={{ width: 16, height: 16 }} />
            )}
            {speaking ? 'Speaking...' : 'Read Aloud'}
          </button>
          <button
            onClick={handleExportAudit}
            className="btn-secondary"
            style={{ flexShrink: 0, height: 'auto', padding: '8px 16px', fontSize: 13, textTransform: 'none', letterSpacing: 0 }}
          >
            Export Audit Trail
          </button>
        </div>
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
        {/* Left column - 60% */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Compliance Report */}
          <div style={cardStyle}>
            <h2 style={sectionLabel}>
              <Shield style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
              Compliance Report
            </h2>
            <ComplianceReport report={compliance} />
          </div>

          {/* Ledger Transaction History */}
          <div style={cardStyle}>
            <h2 style={sectionLabel}>
              <DollarSign style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
              Transaction History
            </h2>
            {ledger.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={thStyle}>Investor</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Type</th>
                      <th style={{ ...thStyle, paddingRight: 0 }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((tx, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px 12px 0', color: 'var(--text-primary)' }}>
                          {tx.investor_name || tx.investor || 'Anonymous'}
                        </td>
                        <td style={{ padding: '12px 16px 12px 0', fontFamily: "'Playfair Display', serif", color: 'var(--accent-green)' }}>
                          {formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding: '12px 16px 12px 0' }}>
                          <span
                            style={{
                              borderRadius: 999,
                              padding: '2px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: 'rgba(36,113,163,0.12)',
                              color: 'var(--accent-blue)',
                            }}
                          >
                            {tx.type || tx.transaction_type || 'INVESTMENT'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>
                          {formatTimestamp(tx.timestamp || tx.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <DollarSign style={{ width: 32, height: 32, margin: '0 auto 8px' }} />
                <p>No transactions recorded yet</p>
              </div>
            )}
          </div>

          {/* USDA Yield Data */}
          <div style={cardStyle}>
            <h2 style={sectionLabel}>
              <TrendingUp style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
              USDA Yield Data
            </h2>
            {yieldData ? (
              <div>
                {typeof yieldData === 'object' && !Array.isArray(yieldData) ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                    {Object.entries(yieldData).map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          borderRadius: 12,
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            margin: 0,
                          }}
                        >
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 20,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '4px 0 0',
                          }}
                        >
                          {typeof value === 'number'
                            ? value.toLocaleString()
                            : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(yieldData) ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {yieldData[0] &&
                            Object.keys(yieldData[0]).map((key) => (
                              <th key={key} style={{ ...thStyle, textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {yieldData.map((row, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {Object.values(row).map((val, j) => (
                              <td key={j} style={{ padding: '12px 16px 12px 0', color: 'var(--text-secondary)' }}>
                                {typeof val === 'number'
                                  ? val.toLocaleString()
                                  : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {String(yieldData)}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <TrendingUp style={{ width: 32, height: 32, margin: '0 auto 8px' }} />
                <p>No USDA yield data available</p>
              </div>
            )}
          </div>
          {/* Repayment Schedule (Feature 4) */}
          {bond.status === 'FUNDED' && (
            <div className="card">
              <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Repayment Schedule
              </h2>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Interest Rate</label>
                  <input type="range" min={4} max={15} step={0.5} value={repaymentRate} onChange={(e) => setRepaymentRate(Number(e.target.value))} style={{ accentColor: 'var(--accent-green)' }} />
                  <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600, marginLeft: 8 }}>{repaymentRate}%</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[6, 12, 24].map((t) => (
                    <button key={t} onClick={() => setRepaymentTerm(t)} style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${repaymentTerm === t ? 'var(--accent-green)' : 'var(--border)'}`,
                      backgroundColor: repaymentTerm === t ? 'var(--accent-green)' : '#fff',
                      color: repaymentTerm === t ? '#fff' : 'var(--text-secondary)',
                    }}>{t}mo</button>
                  ))}
                </div>
              </div>
              {repayment && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Monthly Payment', value: repayment.monthly_payment },
                      { label: 'Total Cost', value: repayment.total_repayment },
                      { label: 'Total Interest', value: repayment.total_interest },
                    ].map((s) => (
                      <div key={s.label} style={{ padding: 12, borderRadius: 6, backgroundColor: 'var(--bg-elevated)', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{s.label}</p>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--accent-green)', margin: '4px 0 0' }}>{formatCurrency(s.value)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflowX: 'auto', maxHeight: 300 }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {repayment.schedule.map((r) => (
                          <tr key={r.month} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.month}</td>
                            <td style={{ padding: '6px 10px', fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>{formatCurrency(r.payment)}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{formatCurrency(r.principal)}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--accent-amber)' }}>{formatCurrency(r.interest)}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{formatCurrency(r.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column - 40% (sticky) */}
        <div>
          <div style={{ position: 'sticky', top: 72 }}>
            {/* Risk Assessment */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={sectionLabel}>
                <BarChart3 style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
                Risk Assessment
              </h2>
              {risk ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        borderRadius: 999,
                        padding: '6px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        backgroundColor: riskStyle.bg,
                        color: riskStyle.color,
                        marginBottom: 16,
                      }}
                    >
                      {risk.risk_level} RISK
                    </span>
                    <p
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 72,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: riskStyle.color,
                        margin: 0,
                      }}
                    >
                      {risk.risk_score || 0}
                    </p>
                    <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      Risk Score
                    </p>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {risk.reasoning || 'No detailed reasoning available.'}
                  </p>

                  {risk.factors && risk.factors.length > 0 && (
                    <div>
                      <h4
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          marginBottom: 8,
                        }}
                      >
                        Key Factors
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {risk.factors.map((factor, i) => (
                          <li
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              fontSize: 14,
                              color: 'var(--text-secondary)',
                              marginBottom: 8,
                            }}
                          >
                            <ChevronRight
                              style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0, color: 'var(--accent-amber)' }}
                            />
                            {typeof factor === 'string'
                              ? factor
                              : factor.description || JSON.stringify(factor)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <BarChart3 style={{ width: 32, height: 32, margin: '0 auto 8px' }} />
                  <p>No risk assessment available</p>
                </div>
              )}
            </div>

            {/* Agent Explainer (Feature 12) */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Decision Explained
              </h2>
              <AgentExplainer bond={bond} />
            </div>

            {/* Agent Audit Trail */}
            <div style={cardStyle}>
              <h2 style={sectionLabel}>
                <FileText style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
                Agent Audit Trail
              </h2>
              {agentSteps.length > 0 ? (
                <div>
                  {agentSteps.map((step, i) => {
                    const isExpanded = expandedStep === i;
                    const isSuccess =
                      step.status === 'complete' ||
                      step.status === 'completed' ||
                      step.status === 'success';
                    const isFailed =
                      step.status === 'failed' || step.status === 'error';

                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              display: 'flex',
                              width: 28,
                              height: 28,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: isSuccess
                                ? 'var(--accent-green-dim)'
                                : isFailed
                                ? 'rgba(192,57,43,0.12)'
                                : 'var(--bg-elevated)',
                              border: `1px solid ${
                                isSuccess
                                  ? 'var(--accent-green)'
                                  : isFailed
                                  ? 'var(--accent-red)'
                                  : 'var(--border)'
                              }`,
                              color: isSuccess
                                ? 'var(--accent-green)'
                                : isFailed
                                ? 'var(--accent-red)'
                                : 'var(--text-muted)',
                            }}
                          >
                            {isSuccess ? (
                              <CheckCircle style={{ width: 14, height: 14 }} />
                            ) : isFailed ? (
                              <XCircle style={{ width: 14, height: 14 }} />
                            ) : (
                              i + 1
                            )}
                          </div>
                          {i < agentSteps.length - 1 && (
                            <div
                              style={{
                                width: 0,
                                height: isExpanded ? 'auto' : 20,
                                minHeight: 20,
                                borderLeft: `1px dashed ${
                                  isSuccess
                                    ? 'var(--accent-green)'
                                    : 'var(--border)'
                                }`,
                              }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 12, paddingTop: 2 }}>
                          <button
                            onClick={() => setExpandedStep(isExpanded ? null : i)}
                            style={{
                              display: 'flex',
                              width: '100%',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                color: isSuccess
                                  ? 'var(--accent-green)'
                                  : isFailed
                                  ? 'var(--accent-red)'
                                  : 'var(--text-secondary)',
                              }}
                            >
                              {STEP_LABELS[step.step] ||
                                step.action ||
                                step.name ||
                                step.step ||
                                `Step ${i + 1}`}
                            </span>
                            {step.result && (
                              isExpanded ? (
                                <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                              ) : (
                                <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                              )
                            )}
                          </button>
                          <p style={{ fontSize: 11, marginTop: 2, color: 'var(--text-muted)' }}>
                            {formatTimestamp(step.timestamp || step.completed_at)}
                          </p>
                          {isExpanded && step.result && (
                            <pre
                              style={{
                                marginTop: 8,
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 11,
                                overflowX: 'auto',
                                fontFamily: "'JetBrains Mono', monospace",
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {typeof step.result === 'string'
                                ? step.result
                                : JSON.stringify(step.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {Object.entries(STEP_LABELS).map(([key, label], i) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            width: 28,
                            height: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {i + 1}
                        </div>
                        {i < 7 && (
                          <div
                            style={{
                              width: 0,
                              height: 20,
                              borderLeft: '1px dashed var(--border)',
                            }}
                          />
                        )}
                      </div>
                      <p style={{ fontSize: 14, lineHeight: '28px', paddingTop: 2, color: 'var(--text-muted)', margin: 0 }}>
                        {label}
                      </p>
                    </div>
                  ))}
                  <p style={{ marginTop: 16, fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Detailed step data will appear once the agent processes this bond
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print overlay */}
      {showPrint && (
        <div className="no-print" style={{ display: 'none' }} />
      )}
      {showPrint && <PrintableBondAudit bond={bond} />}
    </div>
  );
}

export default BondDetail;
