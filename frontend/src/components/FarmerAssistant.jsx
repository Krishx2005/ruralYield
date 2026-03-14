import React, { useState, useRef, useEffect } from 'react';

const prompts = [
  "Help me describe my innovation",
  "What should I include in my bond proposal?",
  "How do I set a realistic funding goal?",
  "What makes investors trust a farmer?",
];

function FarmerAssistant() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setChatOpen(false);
      }
    };
    if (chatOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chatOpen]);

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/assistant/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.message || 'Sorry, I could not respond.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am having trouble connecting. Please try again.',
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
      {/* Chat Panel */}
      {chatOpen && (
        <div
          ref={chatRef}
          style={{
            position: 'absolute',
            bottom: '68px',
            right: '0',
            width: '320px',
            maxHeight: '480px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-card)',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              Bond Writing Assistant
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatMinimized(!chatMinimized);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '16px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  lineHeight: 1,
                }}
              >
                —
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '16px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          {!chatMinimized && (
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '280px',
                }}
              >
                {messages.length === 0 && (
                  <div style={{ padding: '8px 0' }}>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        marginBottom: '10px',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      Hi! I can help you write a compelling bond proposal.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {prompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(p)}
                          style={{
                            background: 'var(--accent-green-dim)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            fontSize: '12px',
                            color: 'var(--accent-green)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 600,
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      background:
                        m.role === 'user' ? 'var(--accent-green)' : 'var(--bg-card)',
                      color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      maxWidth: '85%',
                      fontFamily: 'Nunito, sans-serif',
                      border:
                        m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Thinking...
                  </div>
                )}
              </div>

              {/* Input */}
              <div
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && input.trim() && sendMessage(input.trim())
                  }
                  placeholder="Ask anything..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    fontSize: '13px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'Nunito, sans-serif',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => input.trim() && sendMessage(input.trim())}
                  style={{
                    background: 'var(--accent-green)',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Float Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--accent-green)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          color: 'white',
          fontSize: '20px',
          transition: 'transform 200ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {chatOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}

export default FarmerAssistant;
