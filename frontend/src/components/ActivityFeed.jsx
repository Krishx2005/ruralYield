import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { getActivity } from '../api';

function ActivityFeed() {
  const [events, setEvents] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await getActivity(20);
        setEvents(data.events || []);
      } catch {}
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 5000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 30) return 'just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const isRecent = (ts) => {
    if (!ts) return false;
    return (Date.now() - new Date(ts).getTime()) < 30000;
  };

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'fixed',
          right: collapsed ? 0 : 300,
          top: 80,
          zIndex: 40,
          backgroundColor: 'var(--accent-green)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '8px 6px',
          cursor: 'pointer',
          transition: 'right 300ms ease',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
      <div
        style={{
          position: 'fixed',
          right: collapsed ? -300 : 0,
          top: 64,
          bottom: 0,
          width: 300,
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 39,
          transition: 'right 300ms ease',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Source Sans 3', sans-serif",
        }}
      >
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-green)', animation: 'pulse-ring 2s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-green)' }}>
            Live Activity
          </span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {events.length === 0 ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
              No activity yet
            </p>
          ) : (
            events.map((ev, i) => (
              <div
                key={ev.event_id || i}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  animation: 'fadeUp 0.3s ease both',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    backgroundColor: 'var(--accent-green)',
                    animation: isRecent(ev.timestamp) ? 'pulse-ring 1.5s infinite' : 'none',
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                      {ev.message}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {timeAgo(ev.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default ActivityFeed;
