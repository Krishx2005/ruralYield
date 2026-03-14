import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant } from '../api';

const PROMPT_CHIPS = [
  'Help me write a bond description',
  'What crop should I grow this season?',
  'How do I set a fair bond amount?',
  'Explain risk scores to me',
  'Tips for getting funded faster',
];

function FarmerAssistant() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Bond Writing Assistant. I can help you craft bond proposals, understand risk scores, or answer questions about the platform. What can I help with?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <>
      {/* Float button */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
        <button
          onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setChatMinimized(false); }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--accent-green)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            color: 'white',
            fontSize: '24px',
            transition: 'transform 200ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {chatOpen ? '\u2715' : '\ud83d\udcac'}
        </button>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div
          ref={chatRef}
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '320px',
            maxHeight: chatMinimized ? '56px' : 'calc(100vh - 120px)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'max-height 300ms ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: chatMinimized ? 'none' : '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
              Bond Writing Assistant
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setChatMinimized(!chatMinimized)}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: '18px', padding: '0 4px', lineHeight: 1,
                }}
              >
                {chatMinimized ? '+' : '\u2014'}
              </button>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  fontSize: '18px', padding: '0 4px', lineHeight: 1,
                }}
              >
                \u2715
              </button>
            </div>
          </div>

          {/* Body - hidden when minimized */}
          {!chatMinimized && (
            <>
              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0,
              }}>
                {/* Prompt chips at top */}
                {messages.length <= 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {PROMPT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendMessage(chip)}
                        disabled={sending}
                        style={{
                          fontSize: 11, padding: '5px 10px', borderRadius: 16,
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-glass, var(--bg-secondary))',
                          color: 'var(--text-secondary)', cursor: 'pointer',
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
                      backgroundColor: msg.role === 'user' ? 'var(--accent-green)' : 'var(--bg-glass, var(--bg-card))',
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
                    borderRadius: '12px 12px 12px 2px',
                    backgroundColor: 'var(--bg-glass, var(--bg-card))',
                    color: 'var(--text-muted)', fontSize: 13,
                  }}>
                    Thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input form */}
              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex', gap: 8, padding: '12px 16px',
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
                    flex: 1, padding: '8px 12px',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontSize: 13, outline: 'none',
                    backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  style={{
                    padding: '8px 16px', backgroundColor: 'var(--accent-green)',
                    color: '#ffffff', border: 'none', borderRadius: 10,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
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
    </>
  );
}

export default FarmerAssistant;
