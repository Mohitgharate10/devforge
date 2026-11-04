'use client';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionDescription: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string | null;
  errorMessage?: string | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  title,
  actionDescription,
  status,
  txHash,
  errorMessage,
}: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: '#0B0B0E',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          maxWidth: '32rem',
          width: '100%',
          padding: '2rem',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(230, 0, 122, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative',
        }}
      >
        {/* Header Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              background:
                status === 'pending'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : status === 'confirmed'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                status === 'pending'
                  ? '#3B82F6'
                  : status === 'confirmed'
                  ? '#10B981'
                  : '#EF4444'
              }`,
              color:
                status === 'pending'
                  ? '#3B82F6'
                  : status === 'confirmed'
                  ? '#10B981'
                  : '#EF4444',
            }}
          >
            {status === 'pending' && (
              <span
                style={{
                  display: 'inline-block',
                  animation: 'spin 1.5s linear infinite',
                }}
              >
                ⟳
              </span>
            )}
            {status === 'confirmed' && '✓'}
            {status === 'failed' && '✕'}
          </div>

          <div>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: '0.2rem 0 0 0',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Network: Ethereum Sepolia (Chain ID: 11155111)
            </p>
          </div>
        </div>

        {/* Action Description */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {actionDescription}
        </p>

        {/* Status Pill & Information */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.825rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Transaction State:</span>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                background:
                  status === 'pending'
                    ? 'rgba(59, 130, 246, 0.2)'
                    : status === 'confirmed'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                color:
                  status === 'pending'
                    ? '#60A5FA'
                    : status === 'confirmed'
                    ? '#34D399'
                    : '#F87171',
              }}
            >
              {status === 'pending'
                ? 'Broadcasting to Sepolia...'
                : status === 'confirmed'
                ? 'Confirmed On-Chain'
                : 'Execution Failed'}
            </span>
          </div>

          {txHash && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Etherscan Tx:</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#E6007A',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
              </a>
            </div>
          )}

          {status === 'failed' && errorMessage && (
            <div
              style={{
                color: '#F87171',
                fontSize: '0.8rem',
                marginTop: '0.25rem',
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'pending'}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background:
                status === 'pending'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
              color: status === 'pending' ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: status === 'pending' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {status === 'pending' ? 'Waiting for Confirmation...' : 'Dismiss'}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
