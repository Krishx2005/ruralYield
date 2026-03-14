import React, { useState, useEffect, useCallback } from 'react';
import {
  Wheat,
  Plus,
  Loader2,
  Volume2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
import AgentSteps, { AGENT_STEPS } from '../components/AgentSteps';
import BondCard from '../components/BondCard';
import BondTimeline from '../components/BondTimeline';
import FarmerAssistant from '../components/FarmerAssistant';
import { createBond, getBonds, synthesizeSpeech } from '../api';

const CROP_TYPES = ['CORN', 'SOYBEANS', 'WHEAT', 'RICE'];

const INITIAL_FORM = {
  title: '',
  amount: '',
  crop_type: 'CORN',
  county: '',
  description: '',
  farmer_name: 'Current Farmer',
};

const STATUS_STYLES = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' },
  APPROVED: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' },
  FUNDED: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' },
  REJECTED: { bg: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' },
};

function FarmerDashboard() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stepStatuses, setStepStatuses] = useState({});
  const [stepResults, setStepResults] = useState({});
  const [playingDecision, setPlayingDecision] = useState(null);
  const [decisionResult, setDecisionResult] = useState(null);

  const fetchBonds = useCallback(async () => {
    try {
      const data = await getBonds();
      setBonds(Array.isArray(data) ? data : data.bonds || []);
    } catch {
      // silently fail on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBonds();
    const saved = localStorage.getItem('farmer_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        setForm((prev) => ({
          ...prev,
          farmer_name: profile.name || prev.farmer_name,
          county: profile.county ? `${profile.county}` : prev.county,
          crop_type: (profile.crop_type || '').toUpperCase() || prev.crop_type,
        }));
      } catch {}
    }
  }, [fetchBonds]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTranscript = (text) => {
    if (!text) return;

    const lower = text.toLowerCase();
    const updated = { ...form };

    const amountMatch = text.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (amountMatch) {
      updated.amount = amountMatch[1].replace(/,/g, '');
    }

    for (const crop of CROP_TYPES) {
      if (lower.includes(crop.toLowerCase())) {
        updated.crop_type = crop;
        break;
      }
    }

    const countyMatch = text.match(/(\w+)\s+county/i);
    if (countyMatch) {
      updated.county = `${countyMatch[1]} County`;
    }

    if (!updated.description) {
      updated.description = text;
    }

    if (!updated.title && updated.crop_type && updated.county) {
      updated.title = `${updated.crop_type} Bond - ${updated.county}`;
    } else if (!updated.title) {
      updated.title = text.slice(0, 50);
    }

    setForm(updated);
    setSuccess('Voice input transcribed and form populated.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const simulateSteps = (stepSetter, resultSetter) => {
    return new Promise((resolve) => {
      const steps = AGENT_STEPS.map((s) => s.key);
      let i = 0;

      const advance = () => {
        if (i >= steps.length) {
          resolve();
          return;
        }

        stepSetter((prev) => ({ ...prev, [steps[i]]: 'running' }));

        setTimeout(() => {
          stepSetter((prev) => ({ ...prev, [steps[i]]: 'complete' }));
          resultSetter((prev) => ({
            ...prev,
            [steps[i]]: 'Completed successfully',
          }));
          i++;
          advance();
        }, 600 + Math.random() * 400);
      };

      advance();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    setStepStatuses({});
    setStepResults({});
    setDecisionResult(null);

    if (!form.title || !form.amount || !form.county) {
      setError('Please fill in title, amount, and county.');
      setSubmitting(false);
      return;
    }

    const bondData = {
      ...form,
      amount: parseFloat(form.amount),
    };

    const stepPromise = simulateSteps(setStepStatuses, setStepResults);

    try {
      const result = await createBond(bondData);
      await stepPromise;
      setDecisionResult(result);
      setSuccess('Bond created and submitted for agent processing!');
      setForm({ ...INITIAL_FORM });
      await fetchBonds();
    } catch (err) {
      await stepPromise;
      const lastStep = AGENT_STEPS[AGENT_STEPS.length - 1].key;
      setStepStatuses((prev) => ({ ...prev, [lastStep]: 'failed' }));
      setStepResults((prev) => ({
        ...prev,
        [lastStep]: err.response?.data?.detail || 'Failed',
      }));
      setError(
        err.response?.data?.detail || 'Failed to create bond. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayDecision = async (bond) => {
    setPlayingDecision(bond.id);
    try {
      const text = `Decision for bond ${bond.title}: Status is ${bond.status}. ${
        bond.risk_assessment?.reasoning || ''
      } Compliance score: ${bond.compliance_report?.compliance_score || 'pending'}.`;
      const audioBlob = await synthesizeSpeech(text);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => {
        setPlayingDecision(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingDecision(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setPlayingDecision(null);
    }
  };

  const decisionStatus = decisionResult?.status || decisionResult?.bond?.status;
  const decisionBorderColor =
    decisionStatus === 'APPROVED'
      ? 'var(--accent-green)'
      : decisionStatus === 'REJECTED'
      ? 'var(--accent-red)'
      : 'var(--accent-amber)';

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
      {/* Page Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '32px 0',
          marginBottom: 40,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontFamily: "'Source Sans 3', sans-serif" }}>
            Home &gt; Farmer Portal
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Farmer Portal
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* Voice Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 12,
            padding: 40,
            marginBottom: 32,
            boxShadow: '0 4px 16px rgba(45,106,45,0.08)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 12,
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            CREATE YOUR BOND
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 24,
            }}
          >
            Speak Your Innovation
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <VoiceRecorder
              onTranscript={handleTranscript}
              onError={(msg) => setError(msg)}
            />
          </div>
        </div>

        {/* Bond Form */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 12,
            padding: 32,
            marginBottom: 32,
            boxShadow: '0 4px 16px rgba(45,106,45,0.08)',
          }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 24,
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            Bond Application
          </h2>

          {/* Error */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(192,57,43,0.08)',
                borderLeft: '4px solid var(--accent-red)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                color: 'var(--accent-red)',
              }}
            >
              <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              style={{
                backgroundColor: 'var(--accent-green-dim)',
                borderLeft: '4px solid var(--accent-green)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 14,
                color: 'var(--accent-green)',
              }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  Bond Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Spring Corn Bond 2024"
                  required
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
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                  min="1"
                  step="0.01"
                  required
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
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  Crop Type
                </label>
                <select
                  name="crop_type"
                  value={form.crop_type}
                  onChange={handleChange}
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
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                >
                  {CROP_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  County
                </label>
                <input
                  type="text"
                  name="county"
                  value={form.county}
                  onChange={handleChange}
                  placeholder="e.g., Polk County"
                  required
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
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your bond details, farming plans, expected yields..."
                rows={3}
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
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--accent-green)',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Source Sans 3', sans-serif",
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.target.style.backgroundColor = 'var(--accent-green-light)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--accent-green)'; }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                  Processing Bond...
                </>
              ) : (
                <>
                  <Plus style={{ width: 20, height: 20 }} />
                  Submit Bond Proposal
                </>
              )}
            </button>
          </form>

          {/* Agent Steps */}
          {Object.keys(stepStatuses).length > 0 && (
            <div
              style={{
                marginTop: 24,
                borderRadius: 12,
                padding: 20,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                AGENT REVIEW
              </h3>
              <AgentSteps
                stepStatuses={stepStatuses}
                stepResults={stepResults}
              />
            </div>
          )}

          {/* Decision Result */}
          {decisionResult && decisionStatus && (
            <div
              style={{
                marginTop: 20,
                borderRadius: 12,
                padding: 20,
                borderLeft: `4px solid ${decisionBorderColor}`,
                backgroundColor:
                  decisionStatus === 'APPROVED'
                    ? 'var(--accent-green-dim)'
                    : decisionStatus === 'REJECTED'
                    ? 'rgba(192,57,43,0.08)'
                    : 'rgba(184,134,11,0.08)',
                border: `1px solid ${decisionBorderColor}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      borderRadius: 999,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: decisionBorderColor,
                      color: '#ffffff',
                    }}
                  >
                    {decisionStatus}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Agent decision complete
                  </span>
                </div>
                <button
                  onClick={() => {
                    const text = `Your bond has been ${decisionStatus}. ${
                      decisionResult.risk_assessment?.reasoning || ''
                    }`;
                    synthesizeSpeech(text).then((blob) => {
                      const url = URL.createObjectURL(blob);
                      new Audio(url).play();
                    }).catch(() => {});
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Volume2 style={{ width: 14, height: 14 }} />
                  Hear Decision
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Bonds */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              My Bonds
            </h2>
            <button
              onClick={fetchBonds}
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw
                style={{
                  width: 14,
                  height: 14,
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <Loader2
                style={{ width: 32, height: 32, color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }}
              />
            </div>
          ) : bonds.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 12,
                padding: '64px 24px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(45,106,45,0.06)',
              }}
            >
              <Wheat
                style={{ width: 48, height: 48, color: 'var(--text-muted)', margin: '0 auto 12px' }}
              />
              <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>
                No bonds yet
              </p>
              <p style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>
                Create your first bond using voice or the form above
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {bonds.map((bond, i) => (
                <div
                  key={bond.id}
                  style={{ position: 'relative', animation: 'fadeUp 0.4s ease forwards', animationDelay: `${i * 100}ms` }}
                >
                  <BondCard bond={bond} />
                  <button
                    onClick={() => handlePlayDecision(bond)}
                    disabled={playingDecision === bond.id}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      border: 'none',
                      backgroundColor: 'var(--accent-green)',
                      color: '#ffffff',
                      cursor: playingDecision === bond.id ? 'not-allowed' : 'pointer',
                      opacity: playingDecision === bond.id ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.15s',
                    }}
                    title="Play agent decision"
                  >
                    {playingDecision === bond.id ? (
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Volume2 style={{ width: 16, height: 16 }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

        {/* Bond Timeline (Feature 7) */}
        {bonds.length > 0 && (
          <div className="card" style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--text-primary)', marginBottom: 20 }}>
              Your Journey
            </h2>
            <BondTimeline bonds={bonds} />
          </div>
        )}
        </div>
      </div>
      <FarmerAssistant />
    </div>
  );
}

export default FarmerDashboard;
