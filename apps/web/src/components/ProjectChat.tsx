'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'FILE' | 'DELIVERY_SUBMITTED' | 'ESCROW_RELEASED';
  createdAt: string;
}

export function ProjectChat({ contractId }: { contractId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/v1/conversations/${contractId}/messages`);
        const json = await res.json();
        if (!ignore && json.data?.items) {
          setMessages(json.data.items);
        }
      } catch {
        // Ignore
      }
    }
    loadMessages();

    // Poll for new messages every 6 seconds
    const interval = setInterval(loadMessages, 6000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [contractId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetch(`/api/v1/conversations/${contractId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'TEXT' }),
      });
      const json = await res.json();
      if (json.data) {
        setMessages((prev) => [...prev, json.data]);
      }
    } catch {
      // Ignore
    } finally {
      setSending(false);
    }
  };

  const renderBadge = (type: ChatMessage['type']) => {
    switch (type) {
      case 'ESCROW_RELEASED':
        return (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            ⚡ ESCROW RELEASED
          </span>
        );
      case 'DELIVERY_SUBMITTED':
        return (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              background: 'rgba(230, 0, 122, 0.15)',
              color: '#E6007A',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            📦 DELIVERABLE PR
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        height: '520px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            Project Room & Milestone Chat
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          E2E Authenticated
        </span>
      </div>

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              margin: 'auto',
            }}
          >
            No messages yet. Begin project collaboration below!
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                background: m.senderName.includes('Elena')
                  ? 'rgba(230,0,122,0.06)'
                  : 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}
                  >
                    {m.senderName}
                  </span>
                  {renderBadge(m.type)}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid var(--border-hairline)',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          gap: '0.75rem',
        }}
      >
        <input
          type="text"
          placeholder="Type update or paste commit URL..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem 0.85rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="btn-pill-primary"
          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
        >
          {sending ? 'Sending...' : 'Send →'}
        </button>
      </form>
    </div>
  );
}
