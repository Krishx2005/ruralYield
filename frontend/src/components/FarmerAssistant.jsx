import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithAssistant } from '../api';

const PROMPT_CHIPS = [
  'Help me write a bond description',
  'What crop should I grow this season?',
  'How do I set a fair bond amount?',
  'Explain risk scores to me',
  'Tips for getting funded faster',
];

function FarmerAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Bond Writing Assistant. I can help you craft bond proposals, understand risk scores, or answer questions about the platform. What can I help with?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    // Delay to avoid closing immediately on the open click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setSending(true);
    try {
      const res = await chatWithAssistant(updated);
      const reply = res.response || res.reply || res.message || res.content || 'Sorry, I could not generate a response.';
      setMessages([...updated, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleOpen = useCallback(() => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      setMinimized(false);
    }
  }, [open]);

  return (
    <>
      {/* Floating toggle button — always visible */}
      <button
        onClick={toggleOpen}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--accent-green)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          transition: 'transform 200ms ease, box-shadow 200ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.25)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: 320,
            maxHeight: minimized ? 48 : 'calc(100vh - 120px)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            fontFamily: "'Nunito', 'Source Sans 3', sans-serif",
            overflow: 'hidden',
            transition: 'max-height 300ms ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: 'var(--accent-green)',
              color: '#ffffff',
              padding: '12px 12px 12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              height: 48,
              cursor: minimized ? 'pointer' : 'default',
            }}
            onClick={minimized ? () => setMinimized(false) : undefined}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Bond Writing Assistant
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Minimize / Expand */}
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
                style={{
                  background: 'none', border: 'none', color: '#ffffff',
                  cursor: 'pointer', padding: '4px 6px', lineHeight: 1,
                  fontSize: 18, opacity: 0.8, borderRadius: 4,
                }}
                title={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? '+' : '\u2013'}
              </button>
              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                style={{
                  background: 'none', border: 'none', color: '#ffffff',
                  cursor: 'pointer', padding: '4px 6px', lineHeight: 1,
                  fontSize: 18, opacity: 0.8, borderRadius: 4,
                }}
                title="Close"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Body — hidden when minimized */}
          {!minimized && (
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minHeight: 0,
                }}
              >
                {/* Prompt chips */}
                {messages.length <= 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {PROMPT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        disabled={sending}
                        style={{
                          fontSize: 11, padding: '5px 10px', borderRadius: 16,
                          border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)', cursor: 'pointer',
                          fontFamily: "'Nunito', sans-serif", transition: 'background-color 150ms',
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%', padding: '8px 12px',
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      backgroundColor: msg.role === 'user' ? 'var(--accent-green)' : 'var(--bg-elevated)',
                      color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                      fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
                {sending && (
                  <div style={{
                    alignSelf: 'flex-start', padding: '8px 12px',
                    borderRadius: '12px 12px 12px 2px', backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)', fontSize: 13,
                  }}>
                    Thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex', gap: 8, padding: '10px 12px',
                  borderTop: '1px solid var(--border)', flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  style={{
                    flex: 1, padding: '8px 12px', border: '1px solid var(--border)',
                    borderRadius: 8, fontSize: 13, outline: 'none',
                    backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  style={{
                    padding: '8px 14px', backgroundColor: 'var(--accent-green)',
                    color: '#ffffff', border: 'none', borderRadius: 8,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    opacity: sending || !input.trim() ? 0.5 : 1,
                  }}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Mobile responsive override */}
      <style>{`
        @media (max-width: 768px) {
          [data-chat-panel] { width: calc(100vw - 48px) !important; }
        }
      `}</style>
    </>
  );
}

export default FarmerAssistant;
