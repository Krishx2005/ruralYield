import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getFarmerProfile, getCreditScore } from '../api';
import BondCard from '../components/BondCard';

function FarmProfile() {
  const { farmer_id } = useParams();
  const [profile, setProfile] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getFarmerProfile(farmer_id).catch(() => null),
      getCreditScore(farmer_id).catch(() => null),
    ])
      .then(([prof, score]) => {
        setProfile(prof);
        setCreditScore(score);
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [farmer_id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-green)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Source Sans 3, sans-serif', color: 'var(--text-secondary)' }}>
        <p>{error || 'Farm profile not found.'}</p>
        <Link to="/investor" style={{ color: 'var(--accent-green)', marginTop: 16, display: 'inline-block' }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const farmer = profile.farmer || profile;
  const bonds = profile.bonds || [];
  const farmerName = farmer.name || farmer.farmer_name || farmer_id.replace(/_/g, ' ');
  const county = farmer.county || bonds[0]?.county || 'Unknown County';
  const cropType = farmer.crop_type || bonds[0]?.crop_type || '';
  const hasFundedBond = farmer.has_funded_bond || bonds.some((b) => b.status === 'FUNDED');
  const score = creditScore?.credit_score || creditScore?.score || null;

  const totalRaised = bonds.reduce((sum, b) => sum + (b.amount_raised || b.total_invested || 0), 0);
  const bondsFunded = bonds.filter((b) => b.status === 'FUNDED').length;
  const avgCompliance = bonds.length > 0
    ? Math.round(bonds.reduce((sum, b) => sum + (b.compliance_report?.compliance_score || b.compliance_score || 0), 0) / bonds.length)
    : 0;
  const investorCount = bonds.reduce((sum, b) => sum + (b.investor_count || 0), 0);
  const acresFunded = bonds.reduce((sum, b) => sum + (b.acres || 0), 0) || bonds.length * 40;
  const foodEstimate = acresFunded * 180;
  const description = farmer.description || bonds[0]?.description || bonds[0]?.purpose || '';

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amt || 0);

  const scoreColor = score >= 700 ? 'var(--accent-green)' : score >= 600 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
      {/* Back link */}
      <Link
        to="/investor"
        style={{
          fontSize: 13,
          color: 'var(--accent-green)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 24,
        }}
      >
        &larr; Back to Marketplace
      </Link>

      {/* Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 32,
          marginBottom: 32,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 32,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {farmerName} Farm
              {hasFundedBond && (
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: 14,
                    backgroundColor: 'var(--accent-green-dim)',
                    color: 'var(--accent-green)',
                    padding: '4px 10px',
                    borderRadius: 20,
                    verticalAlign: 'middle',
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  Verified Farmer
                </span>
              )}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {county && (
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 20,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {county}
                </span>
              )}
              {cropType && (
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 20,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {cropType}
                </span>
              )}
            </div>
          </div>
          {score && (
            <div
              style={{
                textAlign: 'center',
                padding: '12px 20px',
                borderRadius: 12,
                border: `2px solid ${scoreColor}`,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Credit Score</div>
              <div
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 28,
                  fontWeight: 700,
                  color: scoreColor,
                }}
              >
                {score}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {description && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 28,
            marginBottom: 32,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 20,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            About
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{description}</p>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: 'Total Raised', value: formatCurrency(totalRaised) },
          { label: 'Bonds Funded', value: bondsFunded },
          { label: 'Avg Compliance', value: `${avgCompliance}%` },
          { label: 'Investor Count', value: investorCount },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '20px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 24,
                color: 'var(--accent-green)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Impact */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--accent-green-dim)',
            borderRadius: 10,
            padding: '20px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 4, fontWeight: 500 }}>
            Acres Funded
          </div>
          <div
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--accent-green)',
            }}
          >
            {acresFunded.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--accent-green-dim)',
            borderRadius: 10,
            padding: '20px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 4, fontWeight: 500 }}>
            Food Produced (est. lbs)
          </div>
          <div
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--accent-green)',
            }}
          >
            {foodEstimate.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Current Bonds */}
      {bonds.length > 0 && (
        <>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 24,
              color: 'var(--text-primary)',
              marginBottom: 20,
            }}
          >
            Current Bonds
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
              marginBottom: 40,
            }}
          >
            {bonds.map((bond) => (
              <BondCard key={bond.id || bond.bond_id} bond={bond} showInvest />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FarmProfile;
