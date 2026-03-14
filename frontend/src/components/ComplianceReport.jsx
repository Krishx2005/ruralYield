import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Shield,
} from 'lucide-react';

function ScoreGauge({ score, size = 'lg' }) {
  const radius = size === 'lg' ? 54 : 36;
  const stroke = size === 'lg' ? 6 : 4;
  const viewBox = (radius + stroke) * 2;
  const center = radius + stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? 'var(--accent-green)'
      : score >= 50
      ? 'var(--accent-amber)'
      : 'var(--accent-red)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={viewBox} height={viewBox} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
          style={{ color, fontFamily: 'Playfair Display, serif' }}
        >
          {score}
        </span>
        <span className="text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function ComplianceReport({ report }) {
  if (!report) {
    return (
      <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <Shield className="mx-auto mb-2 h-8 w-8" />
        <p>No compliance report available</p>
      </div>
    );
  }

  const {
    compliance_score = 0,
    missing_disclosures = [],
    jurisdiction_risks = [],
    suggested_fixes = [],
    summary = '',
  } = report;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <ScoreGauge score={compliance_score} />
        <div>
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Compliance Score
          </h4>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {compliance_score >= 80
              ? 'Meets regulatory requirements'
              : compliance_score >= 50
              ? 'Needs some improvements'
              : 'Significant issues found'}
          </p>
          {summary && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {summary}
            </p>
          )}
        </div>
      </div>

      {missing_disclosures.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h4
            className="mb-3 flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--accent-amber)' }}
          >
            <AlertTriangle className="h-4 w-4" />
            Missing Disclosures ({missing_disclosures.length})
          </h4>
          <ul className="space-y-2">
            {missing_disclosures.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: 'var(--accent-amber)' }}
                />
                <span>{typeof item === 'string' ? item : item.description || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {jurisdiction_risks.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h4
            className="mb-3 flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--accent-red)' }}
          >
            <AlertCircle className="h-4 w-4" />
            Jurisdiction Risks ({jurisdiction_risks.length})
          </h4>
          <ul className="space-y-2">
            {jurisdiction_risks.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <AlertCircle
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: 'var(--accent-red)' }}
                />
                <span>{typeof item === 'string' ? item : item.description || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggested_fixes.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h4
            className="mb-3 flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--accent-blue)' }}
          >
            <Info className="h-4 w-4" />
            Suggested Fixes ({suggested_fixes.length})
          </h4>
          <ul className="space-y-2">
            {suggested_fixes.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <CheckCircle
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: 'var(--accent-blue)' }}
                />
                <span>{typeof item === 'string' ? item : item.description || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { ScoreGauge };
export default ComplianceReport;
