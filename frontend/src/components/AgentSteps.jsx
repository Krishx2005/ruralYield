import React from 'react';
import { CheckCircle, Loader2, Clock, XCircle } from 'lucide-react';

const AGENT_STEPS = [
  { key: 'receive', label: 'Receive Bond Application' },
  { key: 'transcribe', label: 'Transcribe Voice Input' },
  { key: 'validate', label: 'Validate Bond Data' },
  { key: 'usda', label: 'Fetch USDA Yield Data' },
  { key: 'compliance', label: 'Run Compliance Check' },
  { key: 'risk', label: 'Score Risk Assessment' },
  { key: 'decision', label: 'Agent Decision' },
  { key: 'ledger', label: 'Record to Ledger' },
];

function AgentSteps({ stepStatuses = {}, stepResults = {} }) {
  return (
    <div className="space-y-0">
      {AGENT_STEPS.map((step, index) => {
        const status = stepStatuses[step.key] || 'pending';
        const result = stepResults[step.key];
        const isComplete = status === 'complete';
        const isRunning = status === 'running';
        const isFailed = status === 'failed';

        return (
          <div
            key={step.key}
            className="flex items-start gap-3 animate-step-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"
                style={{
                  backgroundColor: isComplete
                    ? 'var(--accent-green)'
                    : isRunning
                    ? 'var(--accent-green-dim)'
                    : isFailed
                    ? 'rgba(192,57,43,0.1)'
                    : '#ffffff',
                  border: isComplete
                    ? 'none'
                    : `1px solid ${
                        isRunning
                          ? 'var(--accent-green)'
                          : isFailed
                          ? 'var(--accent-red)'
                          : 'var(--border)'
                      }`,
                  color: isComplete
                    ? '#ffffff'
                    : isRunning
                    ? 'var(--accent-green)'
                    : isFailed
                    ? 'var(--accent-red)'
                    : 'var(--text-muted)',
                }}
              >
                {isComplete ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFailed ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < AGENT_STEPS.length - 1 && (
                <div
                  className="transition-colors duration-300"
                  style={{
                    height: 24,
                    width: 0,
                    borderLeft: `2px solid ${
                      isComplete
                        ? 'var(--accent-green)'
                        : 'var(--border)'
                    }`,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3 pt-0.5">
              <p
                className="text-sm"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  fontSize: '14px',
                  color: isComplete || isRunning
                    ? 'var(--accent-green)'
                    : isFailed
                    ? 'var(--accent-red)'
                    : 'var(--text-muted)',
                  fontWeight: isRunning ? 500 : 400,
                }}
              >
                {step.label}
              </p>
              {result && isComplete && (
                <p
                  className="mt-1 truncate max-w-xs rounded-md px-2 py-1 text-[11px]"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {typeof result === 'string'
                    ? result
                    : JSON.stringify(result).slice(0, 100)}
                </p>
              )}
              {result && isFailed && (
                <p className="mt-1 text-xs" style={{ color: 'var(--accent-red)' }}>
                  {result}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { AGENT_STEPS };
export default AgentSteps;
