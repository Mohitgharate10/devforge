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
        .catch(() => {});

      // Check current chain
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((id) => setChainId(id as string))
        .catch(() => {});

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
      // Demo simulation fallback if no browser wallet extension is installed
      const mockSepoliaAddress = '0x71C84164b3c915122e265646cD8266395A344e45';
      setAddress(mockSepoliaAddress);
      setChainId(SEPOLIA_CHAIN_ID_HEX);
      return;
    }

    try {
      setConnecting(true);
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
    } finally {
      setConnecting(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
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
        }
      }
    }
  };

  const isWrongNetwork = chainId && chainId.toLowerCase() !== SEPOLIA_CHAIN_ID_HEX.toLowerCase();

  if (address) {
    if (isWrongNetwork) {
      return (
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
          title="Click to switch wallet to Sepolia"
        >
          <span>⚠ Switch to Sepolia</span>
        </button>
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
    <button
      type="button"
      onClick={connectWallet}
      disabled={connecting}
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
      <span style={{ fontSize: '0.85rem' }}>⚡</span>
      <span>{connecting ? 'Connecting...' : hasProvider ? 'Connect Wallet' : 'Connect Demo Wallet'}</span>
    </button>
  );
}
