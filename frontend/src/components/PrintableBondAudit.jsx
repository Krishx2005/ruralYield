import React from 'react';

function PrintableBondAudit({ bond }) {
  if (!bond) return null;
  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v || 0);
  const fmtTs = (ts) => { try { return new Date(ts).toLocaleString(); } catch { return ts || 'N/A'; } };
  const compliance = bond.compliance_report || bond.compliance_result || {};
  const risk = bond.risk_assessment || bond.risk_result || {};
  const steps = bond.agent_steps || bond.processing_steps || bond.audit_trail || [];
  const ledger = bond.ledger_transactions || bond.transactions || [];

  const tdStyle = { padding: '8px 12px', borderBottom: '1px solid #dde8d0', fontSize: 13, verticalAlign: 'top' };
  const thStyle = { padding: '8px 12px', borderBottom: '2px solid #2d6a2d', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left', color: '#4a6741' };

  return (
    <div className="printable-audit" style={{ fontFamily: "'Source Sans 3', sans-serif", color: '#1a2e1a', padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2d6a2d', paddingBottom: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, margin: 0, color: '#2d6a2d' }}>RuralYield</h1>
          <p style={{ fontSize: 12, color: '#8a9e87', margin: '4px 0 0' }}>Bond Audit Report</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#8a9e87' }}>
          <p style={{ margin: 0 }}>Bond ID: {bond.bond_id || bond.id || 'N/A'}</p>
          <p style={{ margin: '2px 0 0' }}>Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 12 }}>Bond Details</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <tbody>
          {[
            ['Title', bond.title], ['Farmer', bond.farmer_name], ['Amount', fmt(bond.amount)],
            ['Crop Type', bond.crop_type], ['County', bond.county], ['Status', bond.status],
            ['Created', fmtTs(bond.created_at)], ['Decision', bond.decision_reason || 'N/A'],
          ].map(([k, v]) => (
            <tr key={k}><td style={{ ...tdStyle, fontWeight: 600, width: 140 }}>{k}</td><td style={tdStyle}>{v}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 12 }}>Agent Processing Steps</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead><tr>{['Step', 'Timestamp', 'Status', 'Details'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i}>
              <td style={tdStyle}>{s.step || s.name || `Step ${i + 1}`}</td>
              <td style={tdStyle}>{fmtTs(s.timestamp || s.completed_at)}</td>
              <td style={tdStyle}>{s.status || (s.detail && s.detail.status) || 'N/A'}</td>
              <td style={{ ...tdStyle, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.result ? (typeof s.result === 'string' ? s.result : JSON.stringify(s.result).slice(0, 200))
                 : s.detail ? JSON.stringify(s.detail).slice(0, 200) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 12 }}>Compliance Report</h2>
      <pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", backgroundColor: '#f7f9f4', padding: 16, borderRadius: 6, overflow: 'auto', marginBottom: 24 }}>
        {JSON.stringify(compliance, null, 2)}
      </pre>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 12 }}>Risk Assessment</h2>
      <pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", backgroundColor: '#f7f9f4', padding: 16, borderRadius: 6, overflow: 'auto', marginBottom: 24 }}>
        {JSON.stringify(risk, null, 2)}
      </pre>

      {ledger.length > 0 && (
        <>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 12 }}>Transaction History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead><tr>{['Investor', 'Amount', 'Type', 'Date'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {ledger.map((tx, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{tx.investor_name || tx.investor || 'Anonymous'}</td>
                  <td style={tdStyle}>{fmt(tx.amount)}</td>
                  <td style={tdStyle}>{tx.type || 'INVEST'}</td>
                  <td style={tdStyle}>{fmtTs(tx.timestamp || tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #dde8d0', fontSize: 11, color: '#8a9e87', textAlign: 'center' }}>
        Generated by RuralYield AI Agent &middot; {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default PrintableBondAudit;
