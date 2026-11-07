'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/v1/notifications');
        const json = await res.json();
        if (!ignore && json.data) {
          setNotifications(json.data.items ?? []);
          setUnreadCount(json.data.unreadCount ?? 0);
        }
      } catch {
        // Ignore
      }
    }
    fetchNotifications();

    // Poll every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: '1px solid var(--border-hairline)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          position: 'relative',
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.85 }}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#E6007A',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px #E6007A',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '320px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-hairline)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              NOTIFICATIONS ({unreadCount})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E6007A',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.isRead ? 'transparent' : 'rgba(230,0,122,0.04)',
                    cursor: n.linkUrl ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {!n.isRead && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#E6007A',
                          display: 'inline-block',
                        }}
                      />
                    )}
                    <div
                      style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {n.title}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      marginBottom: '0.35rem',
                    }}
                  >
                    {n.message}
                  </div>
                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      onClick={() => setIsOpen(false)}
                      style={{
                        fontSize: '0.7rem',
                        color: '#E6007A',
                        fontFamily: 'var(--font-mono)',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      View details →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
