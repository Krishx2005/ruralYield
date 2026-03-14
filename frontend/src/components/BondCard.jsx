import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2,
  Eye,
  DollarSign,
  MapPin,
  Wheat,
  Loader2,
  TrendingUp,
  Shield,
  Leaf,
  Users,
} from 'lucide-react';
import { synthesizeSpeech, investInBond, addToWatchlist, removeFromWatchlist } from '../api';
import ReturnsCalculator from './ReturnsCalculator';
import { Bookmark } from 'lucide-react';

const CROP_ICONS = {
  CORN: '🌽',
  SOYBEANS: '🫘',
  WHEAT: '🌾',
  RICE: '🍚',
};

const RISK_STYLES = {
  LOW: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)', border: 'var(--accent-green)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', border: 'var(--accent-amber)' },
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: 'var(--accent-red)' },
};

const STATUS_STYLES = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' },
  APPROVED: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
  FUNDED: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' },
};

function BondCard({ bond, showInvest = false, onInvested }) {
  const [speaking, setSpeaking] = useState(false);
  const [investing, setInvesting] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investEmail, setInvestEmail] = useState('');
  const [showInvestForm, setShowInvestForm] = useState(false);
  const [error, setError] = useState('');
  const [showReturns, setShowReturns] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const riskLevel = bond.risk_assessment?.risk_level || bond.risk_level || 'MEDIUM';
  const riskScore = bond.risk_assessment?.risk_score || bond.risk_score || 0;
  const complianceScore =
    bond.compliance_report?.compliance_score || bond.compliance_score || 0;
  const yieldData = bond.usda_yield_data || bond.yield_data;
  const riskStyle = RISK_STYLES[riskLevel] || RISK_STYLES.MEDIUM;
  const statusStyle = STATUS_STYLES[bond.status] || STATUS_STYLES.PENDING;

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amt || 0);

  const handleReadAloud = async () => {
    setSpeaking(true);
    setError('');
    try {
      const summary = `Bond: ${bond.title}. Amount: ${formatCurrency(
        bond.amount
      )}. Crop type: ${bond.crop_type}. County: ${bond.county}. Risk level: ${riskLevel}. Compliance score: ${complianceScore} percent.`;
      const audioBlob = await synthesizeSpeech(summary);
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
      setError('Speech synthesis unavailable');
      setSpeaking(false);
    }
  };

  const toggleWatchlist = async () => {
    const investorId = localStorage.getItem('investor_id');
    if (!investorId) return;
    setWatchlistLoading(true);
    try {
      if (isWatchlisted) {
        await removeFromWatchlist(investorId, bond.id || bond.bond_id);
      } else {
        await addToWatchlist(investorId, bond.id || bond.bond_id);
      }
      setIsWatchlisted(!isWatchlisted);
    } catch {} finally { setWatchlistLoading(false); }
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    if (!investAmount || parseFloat(investAmount) <= 0) return;
    setInvesting(true);
    setError('');
    try {
      const investorId = localStorage.getItem('investor_id') || 'anonymous';
      const investorName = localStorage.getItem('investor_name') || 'Anonymous';
      await investInBond(bond.id, {
        investor_id: investorId,
        investor_name: investorName,
        amount: parseFloat(investAmount),
        investor_email: investEmail,
      });
      setShowInvestForm(false);
      setInvestAmount('');
      setInvestEmail('');
      if (onInvested) onInvested();
    } catch (err) {
      setError(err.response?.data?.detail || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  return (
    <div
      className="flex flex-col transition-all duration-150"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: crop tag + risk badge */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
          }}
        >
          {CROP_ICONS[bond.crop_type] || '🌱'} {bond.crop_type}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: riskStyle.bg,
            color: riskStyle.color,
          }}
        >
          {riskLevel} {riskScore > 0 && `· ${riskScore}`}
        </span>
      </div>

      {/* Watchlist bookmark */}
      <button
        onClick={toggleWatchlist}
        disabled={watchlistLoading}
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: isWatchlisted ? 'var(--accent-green)' : 'var(--text-muted)',
          transition: 'color 200ms',
        }}
      >
        <Bookmark size={18} fill={isWatchlisted ? 'var(--accent-green)' : 'none'} />
      </button>

      {/* Title */}
      <h3
        className="leading-tight"
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '18px',
          color: 'var(--text-primary)',
        }}
      >
        {bond.title || 'Untitled Bond'}
      </h3>
      {bond.farmer_name && (
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {bond.farmer_name}
        </p>
      )}

      {/* Amount - hero element */}
      <p
        className="mt-4 leading-none"
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          color: 'var(--accent-green)',
          fontWeight: 700,
        }}
      >
        {formatCurrency(bond.amount)}
      </p>

      {/* Compliance bar */}
      {complianceScore > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Compliance
            </span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {complianceScore}%
            </span>
          </div>
          <div
            className="w-full overflow-hidden rounded-full"
            style={{ height: '3px', backgroundColor: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(complianceScore, 100)}%`,
                backgroundColor: 'var(--accent-green)',
              }}
            />
          </div>
        </div>
      )}

      {/* Funding Progress */}
      <div className="mt-4">
        {(() => {
          const goal = bond.funding_goal || bond.amount || 0;
          const raised = bond.amount_raised || bond.total_invested || 0;
          const count = bond.investor_count || 0;
          const pct = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
          const isFunded = pct >= 100;
          return (
            <>
              <div
                className="w-full overflow-hidden rounded-full"
                style={{ height: '3px', backgroundColor: 'var(--bg-elevated)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isFunded ? 'var(--accent-blue)' : 'var(--accent-green-light)',
                    transition: 'width 1s ease',
                  }}
                />
              </div>
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {isFunded
                  ? 'Fully Funded'
                  : `${formatCurrency(raised)} raised of ${formatCurrency(goal)} goal`}
                {count > 0 && ` \u00B7 ${count} investor${count !== 1 ? 's' : ''}`}
              </p>
            </>
          );
        })()}
      </div>

      {/* County + yield */}
      <div
        className="mt-4 flex items-center gap-3 text-[12px]"
        style={{ color: 'var(--text-muted)' }}
      >
        {bond.county && (
          <span className="flex items-center gap-1">
            <Leaf className="h-3 w-3" />
            {bond.county}
          </span>
        )}
        {yieldData && (
          <span className="flex items-center gap-1">
            <Leaf className="h-3 w-3" />
            {yieldData.avg_yield
              ? `${yieldData.avg_yield} bu/acre`
              : typeof yieldData === 'string'
              ? yieldData
              : 'USDA data'}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}

      {/* Actions */}
      <div
        className="mt-auto flex flex-wrap items-center gap-2 pt-5"
        style={{ borderTop: 'none' }}
      >
        <button
          onClick={handleReadAloud}
          disabled={speaking}
          className="transition-colors text-xs"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
            color: 'var(--accent-green)',
            fontFamily: 'Source Sans 3, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {speaking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
          {speaking ? 'Speaking...' : 'Read Aloud'}
        </button>

        <Link
          to={`/bonds/${bond.id}`}
          className="btn-secondary !px-3 !py-2 !text-xs !rounded-lg !h-auto"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </Link>

        {showInvest && bond.status !== 'FUNDED' && bond.status !== 'REJECTED' && (
          <>
            {!showInvestForm ? (
              <button
                onClick={() => setShowInvestForm(true)}
                className="btn-primary !px-3 !py-2 !text-xs !rounded-lg !h-auto ml-auto"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Invest Now
              </button>
            ) : (
              <form
                onSubmit={handleInvest}
                className="ml-auto flex items-center gap-2"
              >
                <input
                  type="email"
                  value={investEmail}
                  onChange={(e) => setInvestEmail(e.target.value)}
                  placeholder="Email"
                  className="!py-2 !text-xs w-32 !rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="Amount"
                  min="1"
                  step="0.01"
                  className="!py-2 !text-xs w-24 !rounded-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={investing}
                  className="btn-primary !px-3 !py-2 !text-xs !rounded-lg !h-auto"
                >
                  {investing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvestForm(false)}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.target.style.color = 'var(--text-secondary)')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Returns Calculator */}
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setShowReturns(!showReturns)} style={{ fontSize: 12, color: 'var(--accent-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
          {showReturns ? 'Hide Calculator' : 'Calculate Returns'}
        </button>
        {showReturns && (
          <ReturnsCalculator
            bond={bond}
            onInvestAmount={(amt) => { setInvestAmount(String(amt)); setShowInvestForm(true); setShowReturns(false); }}
          />
        )}
      </div>
    </div>
  );
}

export default BondCard;
