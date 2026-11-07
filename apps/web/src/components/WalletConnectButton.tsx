'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111

const emptySubscribe = () => () => {};

export function WalletConnectButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasProvider = useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && !!window.ethereum,
    () => false,
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Check existing connected accounts
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          const list = accounts as string[];
          if (list && list.length > 0) {
            setAddress(list[0] ?? null);
          }
        })
        .catch((error) => {
          console.error('Failed to read connected wallet accounts:', error);
          setConnectionError('Could not read the wallet account.');
        });

      // Check current chain
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((id) => setChainId(id as string))
        .catch((error) => {
          console.error('Failed to read the wallet network:', error);
          setConnectionError('Could not read the wallet network.');
        });

      const handleAccountsChanged = (...args: unknown[]) => {
        const accs = args[0] as string[];
        if (accs && accs.length > 0) {
          setAddress(accs[0] ?? null);
        } else {
          setAddress(null);
        }
      };

      const handleChainChanged = (...args: unknown[]) => {
        setChainId(args[0] as string);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setConnectionError('No browser wallet detected. A demo address will not be substituted.');
      return;
    }

    try {
      setConnecting(true);
      setConnectionError(null);
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0] ?? null);
      }

      const currentChain = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      setChainId(currentChain);
    } catch (err) {
      console.error('Wallet connection rejected:', err);
      setConnectionError(err instanceof Error ? err.message : 'Wallet connection was rejected.');
    } finally {
      setConnecting(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) {
      setConnectionError('No browser wallet detected.');
      return;
    }
    try {
      setConnectionError(null);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      setChainId(SEPOLIA_CHAIN_ID_HEX);
    } catch (switchError: unknown) {
      // 4902 code indicates chain has not been added to wallet
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          setChainId(SEPOLIA_CHAIN_ID_HEX);
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          setConnectionError('Could not add Sepolia to this wallet.');
        }
      } else {
        console.error('Failed to switch wallet network:', switchError);
        setConnectionError('Could not switch the wallet to Sepolia.');
      }
    }
  };

  const isWrongNetwork = chainId && chainId.toLowerCase() !== SEPOLIA_CHAIN_ID_HEX.toLowerCase();

  if (address) {
    if (isWrongNetwork) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <button
            type="button"
            onClick={switchToSepolia}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#EF4444',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
            title={connectionError ?? 'Click to switch wallet to Sepolia'}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
              Switch to Sepolia
            </span>
          </button>
          {connectionError && (
            <span
              role="alert"
              style={{ color: '#EF4444', fontSize: '0.7rem', maxWidth: '14rem', lineHeight: 1.3 }}
            >
              {connectionError}
            </span>
          )}
        </div>
      );
    }

    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: '#10B981',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 6px #10B981',
          }}
        />
        <span>{shortAddress}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={connectWallet}
        disabled={connecting}
        title={connectionError ?? undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.95rem',
          borderRadius: '9999px',
          border: '1px solid rgba(230, 0, 122, 0.35)',
          background: 'rgba(230, 0, 122, 0.08)',
          color: '#ff40a4',
          fontSize: '0.825rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.85 }}
        >
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a2 2 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
        <span>
          {connecting ? (
            'Connecting...'
          ) : (
            <>
              <span className="desktop-only">
                {hasProvider ? 'Connect Wallet' : 'Wallet unavailable'}
              </span>
              <span className="mobile-only">Connect</span>
            </>
          )}
        </span>
      </button>
      {connectionError && (
        <span
          role="alert"
          style={{ color: '#EF4444', fontSize: '0.7rem', maxWidth: '14rem', lineHeight: 1.3 }}
        >
          {connectionError}
        </span>
      )}
    </div>
  );
}
