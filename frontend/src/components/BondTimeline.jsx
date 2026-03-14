import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  APPROVED: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
  FUNDED: { bg: 'rgba(36,113,163,0.12)', color: 'var(--accent-blue)' },
  REJECTED: { bg: 'rgba(192,57,43,0.1)', color: 'var(--accent-red)' },
  PENDING: { bg: 'rgba(184,134,11,0.12)', color: 'var(--accent-amber)' },
  EXPIRED: { bg: 'rgba(138,158,135,0.15)', color: 'var(--text-muted)' },
};

function BondTimeline({ bonds }) {
  const [expanded, setExpanded] = useState(null);
  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v || 0);
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(); } catch { return d; } };

  const sorted = [...bonds].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const totalRaised = bonds.reduce((s, b) => s + (b.amount_raised || b.total_invested || 0), 0);
  const approvedCount = bonds.filter((b) => ['APPROVED', 'FUNDED'].includes(b.status)).length;
  const approvalRate = bonds.length > 0 ? Math.round((approvedCount / bonds.length) * 100) : 0;

  if (bonds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.4 }}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Submit your first bond to start your journey</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Bonds Submitted', value: bonds.length },
          { label: 'Total Raised', value: fmt(totalRaised) },
          { label: 'Approval Rate', value: `${approvalRate}%` },
        ].map((s) => (
          <span key={s.label} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--accent-green)', marginRight: 6 }}>{s.value}</strong>
            {s.label}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, backgroundColor: 'var(--border)' }} />
        {sorted.map((bond, i) => {
          const st = STATUS_COLORS[bond.status] || STATUS_COLORS.PENDING;
          const isExp = expanded === i;
          return (
            <div key={bond.bond_id || i} style={{ marginBottom: 20, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -24, top: 4, width: 14, height: 14, borderRadius: '50%', backgroundColor: st.color, border: '2px solid var(--bg-card)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{fmtDate(bond.created_at)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--text-primary)' }}>{bond.title || 'Untitled Bond'}</span>
                <span style={{ fontSize: 14, fontFamily: "'Playfair Display', serif", color: 'var(--accent-green)' }}>{fmt(bond.amount)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: st.bg, color: st.color }}>{bond.status}</span>
              </div>
              <button onClick={() => setExpanded(isExp ? null : i)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Details
              </button>
              {isExp && (
                <div style={{ marginTop: 8, padding: 12, borderRadius: 6, backgroundColor: 'var(--bg-elevated)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <p>Compliance: {bond.compliance_score || 'N/A'}/100 | Risk: {bond.risk_level || 'N/A'} ({bond.risk_score || 'N/A'})</p>
                  {bond.decision_reason && <p style={{ marginTop: 4 }}>{bond.decision_reason}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BondTimeline;
