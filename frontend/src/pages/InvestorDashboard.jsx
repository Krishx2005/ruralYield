import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Loader2,
  RefreshCw,
  BarChart3,
  X,
  ChevronDown,
  Map,
  LayoutGrid,
} from 'lucide-react';
import BondCard from '../components/BondCard';
import BondMap from '../components/BondMap';
import ActivityFeed from '../components/ActivityFeed';
import { getBonds, createInvestor, getWatchlist } from '../api';

const RISK_LEVELS = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];
const CROP_TYPES = ['ALL', 'CORN', 'SOYBEANS', 'WHEAT', 'VEGETABLES', 'LIVESTOCK', 'OTHER'];
const AMOUNT_RANGES = [
  { label: 'All', key: 'ALL' },
  { label: 'Under $5K', key: 'UNDER_5K', min: 0, max: 5000 },
  { label: '$5K\u2013$15K', key: '5K_15K', min: 5000, max: 15000 },
  { label: '$15K\u2013$50K', key: '15K_50K', min: 15000, max: 50000 },
  { label: 'Over $50K', key: 'OVER_50K', min: 50000, max: Infinity },
];
const STATUS_OPTIONS = ['ALL', 'APPROVED', 'FUNDED', 'EXPIRED'];
const SORT_OPTIONS = [
  { label: 'Newest First', key: 'newest' },
  { label: 'Oldest First', key: 'oldest' },
  { label: 'Highest Amount', key: 'amount_desc' },
  { label: 'Lowest Risk', key: 'risk_asc' },
  { label: 'Highest Compliance', key: 'compliance_desc' },
];

function InvestorDashboard() {
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'watchlist'
  const [watchlistBonds, setWatchlistBonds] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [amountFilter, setAmountFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // View mode
  const [viewMode, setViewMode] = useState('grid'); // grid | map
  const [mapCounty, setMapCounty] = useState(null);

  // Investor modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [investorName, setInvestorName] = useState('');
  const [creatingProfile, setCreatingProfile] = useState(false);

  const fetchBonds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBonds();
      const bondsList = Array.isArray(data) ? data : (data.bonds || data.data || []);
      console.log('Bonds fetched:', bondsList);
      setBonds(bondsList);
    } catch (err) {
      console.error('Bond fetch error:', err);
      setError('Failed to load bonds. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBonds();
    const investorId = localStorage.getItem('investor_id');
    if (investorId) {
      getWatchlist(investorId).then((res) => setWatchlistBonds(res.bonds || [])).catch(() => {});
    }
    // Safety timeout: force loading to false after 10 seconds
    const timeout = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timeout);
  }, [fetchBonds]);

  useEffect(() => {
    const investorId = localStorage.getItem('investor_id');
    if (!investorId) {
      setShowNameModal(true);
    }
  }, []);

  const handleCreateProfile = async () => {
    if (!investorName.trim()) return;
    setCreatingProfile(true);
    try {
      const result = await createInvestor({ name: investorName.trim() });
      localStorage.setItem('investor_id', result.investor_id);
      localStorage.setItem('investor_name', result.name);
      setShowNameModal(false);
    } catch {
      // ignore
    } finally {
      setCreatingProfile(false);
    }
  };

  // Derived: active filter list for tags
  const activeFilters = useMemo(() => {
    const tags = [];
    if (riskFilter !== 'ALL') tags.push({ label: `Risk: ${riskFilter}`, clear: () => setRiskFilter('ALL') });
    if (cropFilter !== 'ALL') tags.push({ label: `Crop: ${cropFilter}`, clear: () => setCropFilter('ALL') });
    if (amountFilter !== 'ALL') {
      const range = AMOUNT_RANGES.find((r) => r.key === amountFilter);
      tags.push({ label: `Amount: ${range?.label || amountFilter}`, clear: () => setAmountFilter('ALL') });
    }
    if (statusFilter !== 'ALL') tags.push({ label: `Status: ${statusFilter}`, clear: () => setStatusFilter('ALL') });
    if (searchQuery.trim()) tags.push({ label: `Search: "${searchQuery}"`, clear: () => setSearchQuery('') });
    if (mapCounty) tags.push({ label: `County: ${mapCounty}`, clear: () => setMapCounty(null) });
    return tags;
  }, [riskFilter, cropFilter, amountFilter, statusFilter, searchQuery, mapCounty]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setRiskFilter('ALL');
    setCropFilter('ALL');
    setAmountFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('newest');
    setMapCounty(null);
  };

  const filteredBonds = useMemo(() => {
    let result = bonds.filter((bond) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const searchable = [
          bond.title, bond.farmer_name, bond.crop_type, bond.county, bond.description,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      // Risk
      if (riskFilter !== 'ALL') {
        const level = bond.risk_assessment?.risk_level || bond.risk_level || '';
        if (level !== riskFilter) return false;
      }
      // Crop
      if (cropFilter !== 'ALL') {
        if ((bond.crop_type || '').toUpperCase() !== cropFilter) return false;
      }
      // Amount range
      if (amountFilter !== 'ALL') {
        const range = AMOUNT_RANGES.find((r) => r.key === amountFilter);
        if (range) {
          const amt = bond.amount || 0;
          if (amt < range.min || amt >= range.max) return false;
        }
      }
      // Status
      if (statusFilter !== 'ALL') {
        if (bond.status !== statusFilter) return false;
      }
      // Map county filter
      if (mapCounty) {
        const bondCounty = (bond.county || '').replace(/\s*county\s*/i, '').trim().toLowerCase();
        if (bondCounty !== mapCounty.toLowerCase()) return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (a.created_at || '').localeCompare(b.created_at || '');
        case 'amount_desc':
          return (b.amount || 0) - (a.amount || 0);
        case 'risk_asc':
          return (a.risk_score || a.risk_assessment?.risk_score || 50) - (b.risk_score || b.risk_assessment?.risk_score || 50);
        case 'compliance_desc':
          return (b.compliance_score || b.compliance_report?.compliance_score || 0) - (a.compliance_score || a.compliance_report?.compliance_score || 0);
        case 'newest':
        default:
          return (b.created_at || '').localeCompare(a.created_at || '');
      }
    });

    return result;
  }, [bonds, searchQuery, riskFilter, cropFilter, amountFilter, statusFilter, sortBy, mapCounty]);

  const stats = {
    total: bonds.length,
    approved: bonds.filter((b) => b.status === 'APPROVED').length,
    totalValue: bonds.reduce((sum, b) => sum + (b.amount || 0), 0),
    lowRisk: bonds.filter(
      (b) => (b.risk_assessment?.risk_level || b.risk_level) === 'LOW'
    ).length,
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amt);

  const PillButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        border: `1px solid ${active ? 'var(--accent-green)' : 'var(--border)'}`,
        backgroundColor: active ? 'var(--accent-green)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: "'Source Sans 3', sans-serif",
      }}
    >
      {children}
    </button>
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    backgroundColor: '#ffffff',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: "'Source Sans 3', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
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
            Bond Marketplace
          </h1>
          <p style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
            Verified micro-investment opportunities in rural innovation
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Bonds', value: stats.total },
            { label: 'Total Invested', value: formatCurrency(stats.totalValue) },
            {
              label: 'Avg Risk Score',
              value: bonds.length > 0
                ? Math.round(
                    bonds.reduce(
                      (sum, b) =>
                        sum + (b.risk_assessment?.risk_score || b.risk_score || 50),
                      0
                    ) / bonds.length
                  )
                : '\u2014',
              color: 'var(--accent-green)',
            },
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
                  color: stat.color || 'var(--text-primary)',
                  margin: '8px 0 0',
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by farmer name, crop type, county..."
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {/* Risk */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {RISK_LEVELS.map((level) => (
              <PillButton key={level} active={riskFilter === level} onClick={() => setRiskFilter(level)}>
                {level}
              </PillButton>
            ))}
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />

          {/* Crop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {CROP_TYPES.map((crop) => (
              <PillButton key={crop} active={cropFilter === crop} onClick={() => setCropFilter(crop)}>
                {crop}
              </PillButton>
            ))}
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />

          {/* Amount range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {AMOUNT_RANGES.map((range) => (
              <PillButton key={range.key} active={amountFilter === range.key} onClick={() => setAmountFilter(range.key)}>
                {range.label}
              </PillButton>
            ))}
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {STATUS_OPTIONS.map((s) => (
              <PillButton key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s}
              </PillButton>
            ))}
          </div>

          {/* View toggle + Sort + Refresh */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grid' ? 'var(--accent-green)' : '#ffffff',
                  color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                <LayoutGrid style={{ width: 14, height: 14 }} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'map' ? 'var(--accent-green)' : '#ffffff',
                  color: viewMode === 'map' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                <Map style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 32px 8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontFamily: "'Source Sans 3', sans-serif",
                  appearance: 'none',
                  cursor: 'pointer',
                  minWidth: 140,
                  outline: 'none',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
            <button
              onClick={fetchBonds}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: '#ffffff',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Active filter tags */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {activeFilters.map((f, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: 'var(--accent-green-dim)',
                  color: 'var(--accent-green)',
                  border: '1px solid rgba(45,106,45,0.2)',
                }}
              >
                {f.label}
                <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Results count */}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          Showing {filteredBonds.length} of {bonds.length} bonds
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 14,
              backgroundColor: 'rgba(192,57,43,0.08)',
              color: 'var(--accent-red)',
              border: '1px solid rgba(192,57,43,0.2)',
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && !loading && (
          <div style={{ marginBottom: 24 }}>
            <BondMap
              bonds={bonds}
              selectedCounty={mapCounty}
              onCountySelect={(county) => setMapCounty(county)}
            />
          </div>
        )}

        {/* Bond Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2
              style={{ width: 32, height: 32, color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }}
            />
          </div>
        ) : filteredBonds.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 12,
              padding: '80px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
            }}
          >
            <BarChart3
              style={{ width: 48, height: 48, color: 'var(--text-muted)', margin: '0 auto 12px' }}
            />
            <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
              {bonds.length === 0
                ? 'No bonds available yet'
                : 'No bonds match your filters'}
            </p>
            <p style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>
              {bonds.length === 0
                ? 'Bonds will appear here once farmers create them'
                : 'Try adjusting your filter criteria'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', marginBottom: 40 }}>
            {filteredBonds.map((bond, i) => (
              <div
                key={bond.bond_id || bond.id || i}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <BondCard
                  bond={bond}
                  showInvest
                  onInvested={fetchBonds}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed (Feature 1) */}
      <ActivityFeed />

      {/* Investor Name Modal */}
      {showNameModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 16,
              padding: 32,
              maxWidth: 400,
              width: '100%',
              margin: '0 16px',
              boxShadow: '0 8px 32px rgba(45,106,45,0.12)',
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Welcome, Investor
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Enter your name to track your investments.
            </p>
            <input
              type="text"
              value={investorName}
              onChange={(e) => setInvestorName(e.target.value)}
              placeholder="Your name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: '#ffffff',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: "'Source Sans 3', sans-serif",
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowNameModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                Skip
              </button>
              <button
                onClick={handleCreateProfile}
                disabled={creatingProfile || !investorName.trim()}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--accent-green)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: creatingProfile || !investorName.trim() ? 'not-allowed' : 'pointer',
                  opacity: creatingProfile || !investorName.trim() ? 0.6 : 1,
                  fontFamily: "'Source Sans 3', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {creatingProfile ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestorDashboard;
