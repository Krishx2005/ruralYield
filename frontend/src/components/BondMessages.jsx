import React, { useState, useEffect, useRef } from 'react';
import { getBondMessages, postBondMessage } from '../api';

function BondMessages({ bondId, bondTitle, farmerName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const farmerProfile = (() => {
    try { return JSON.parse(localStorage.getItem('farmer_profile') || 'null'); } catch { return null; }
  })();
  const investorId = localStorage.getItem('investor_id');
  const investorName = localStorage.getItem('investor_name');
  const senderRole = farmerProfile ? 'farmer' : investorId ? 'investor' : 'anonymous';
  const senderId = farmerProfile?.id || farmerProfile?.farmer_id || investorId || 'anonymous';
  const senderName = farmerProfile?.name || farmerProfile?.farmer_name || investorName || 'Anonymous';

  const fetchMessages = () => {
    getBondMessages(bondId)
      .then((res) => setMessages(res.messages || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [bondId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    setError('');
    try {
      await postBondMessage(bondId, {
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        content: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const farmerUpdates = messages.filter((m) => m.sender_role === 'farmer');
  const investorQuestions = messages.filter((m) => m.sender_role === 'investor');

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div
      style={{
        fontFamily: 'Source Sans 3, sans-serif',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 28,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h3
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 22,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        Bond Updates & Discussion
      </h3>
      {bondTitle && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          {bondTitle} {farmerName && `by ${farmerName}`}
        </p>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>
          Loading messages...
        </p>
      ) : (
        <>
          {/* Farmer Updates */}
          {farmerUpdates.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Farmer Updates
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {farmerUpdates.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    style={{
                      borderLeft: '3px solid var(--accent-green)',
                      paddingLeft: 16,
                      paddingTop: 4,
                      paddingBottom: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>
                        {msg.sender_name || 'Farmer'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatTime(msg.created_at || msg.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investor Questions */}
          {investorQuestions.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Investor Questions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {investorQuestions.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {msg.sender_name || 'Investor'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatTime(msg.created_at || msg.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: 24 }}>
              No messages yet. Start the conversation!
            </p>
          )}
          <div ref={bottomRef} />
        </>
      )}

      {error && (
        <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {/* Post message form */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          borderTop: '1px solid var(--border)',
          paddingTop: 16,
          marginTop: 8,
        }}
      >
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            senderRole === 'farmer'
              ? 'Post an update for your investors...'
              : 'Ask a question about this bond...'
          }
          rows={2}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'Source Sans 3, sans-serif',
            outline: 'none',
            resize: 'vertical',
            minHeight: 48,
            backgroundColor: '#ffffff',
          }}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--accent-green)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Source Sans 3, sans-serif',
            opacity: sending || !newMessage.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default BondMessages;
