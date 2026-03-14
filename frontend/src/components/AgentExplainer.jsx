import React from 'react';
import { CheckCircle, AlertTriangle, Lightbulb, PartyPopper } from 'lucide-react';

function AgentExplainer({ bond }) {
  const status = bond.status || 'PENDING';
  const compliance = bond.compliance_report || bond.compliance_result || {};
  const risk = bond.risk_assessment || bond.risk_result || {};
  const isApproved = status === 'APPROVED' || status === 'FUNDED';
  const isRejected = status === 'REJECTED';

  const positives = [];
  const concerns = [];
  const fixes = compliance.suggested_fixes || [];

  if ((compliance.compliance_score || 0) >= 70) positives.push('Compliance requirements met');
  else concerns.push(`Compliance score (${compliance.compliance_score || 0}/100) is below the 70-point threshold`);

  if (risk.risk_level === 'LOW') positives.push('Low risk profile based on market and USDA data');
  else if (risk.risk_level === 'MEDIUM') positives.push('Moderate risk level within acceptable range');
  else if (risk.risk_level === 'HIGH') concerns.push('Risk assessment indicates high risk to investors');

  if (risk.reasoning) {
    const sentences = risk.reasoning.split('. ').filter(Boolean);
    sentences.forEach((s) => {
      if (s.toLowerCase().includes('favorable') || s.toLowerCase().includes('strong') || s.toLowerCase().includes('positive'))
        positives.push(s.trim());
      else if (s.toLowerCase().includes('risk') || s.toLowerCase().includes('concern') || s.toLowerCase().includes('low yield'))
        concerns.push(s.trim());
    });
  }

  (compliance.missing_disclosures || []).forEach((d) => concerns.push(typeof d === 'string' ? d : d.description || JSON.stringify(d)));
  (compliance.jurisdiction_risks || []).forEach((r) => concerns.push(typeof r === 'string' ? r : r.description || JSON.stringify(r)));

  return (
    <div>
      {isApproved && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>&#127881;</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-green)' }}>This bond was approved and is open for investment!</span>
        </div>
      )}
      {isRejected && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'rgba(192,57,43,0.08)', border: '1px solid var(--accent-red)', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-red)', margin: 0 }}>This bond was not approved</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Here's how to resubmit successfully:</p>
        </div>
      )}

      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--text-primary)', marginBottom: 16 }}>
        Why this bond was {status}
      </h3>

      {positives.length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 8, backgroundColor: 'var(--accent-green-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle size={18} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-green)' }}>What worked in your favor</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {positives.slice(0, 5).map((p, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {concerns.length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 8, backgroundColor: 'rgba(184,134,11,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-amber)' }}>What raised concerns</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {concerns.slice(0, 5).map((c, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {fixes.length > 0 && (
        <div style={{ padding: 16, borderRadius: 8, backgroundColor: 'rgba(36,113,163,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Lightbulb size={18} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-blue)' }}>How to improve</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {fixes.map((f, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {typeof f === 'string' ? f : f.description || JSON.stringify(f)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AgentExplainer;
