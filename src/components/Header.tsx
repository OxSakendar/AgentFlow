import { useState, useEffect } from 'react'
import type { WalletState } from '../hooks/useWallet'
import { shortenAddress, explorerAddr } from '../lib/utils'
import styles from './Header.module.css'

interface Props { wallet: WalletState }

export function Header({ wallet }: Props) {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          {/* Inline SVG hex icon */}
          <svg className={styles.logoSvg} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8a4bff"/>
                <stop offset="100%" stopColor="#3b82f6"/>
              </linearGradient>
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <polygon points="32,4 56,18 56,46 32,60 8,46 8,18"
              fill="url(#hg)" opacity="0.18" filter="url(#glow)"/>
            <polygon points="32,4 56,18 56,46 32,60 8,46 8,18"
              fill="none" stroke="url(#hg)" strokeWidth="2.5" filter="url(#glow)"/>
            <polygon points="32,14 48,23 48,41 32,50 16,41 16,23"
              fill="url(#hg)" opacity="0.85"/>
            <circle cx="32" cy="32" r="5" fill="#fff" opacity="0.95"/>
          </svg>

          <div>
            <span className={styles.logoText}>AgentFlow</span>
            <span className={styles.logoBadge}>Arc Testnet</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="#jobs"   className={`${styles.navLink} ${hash === '#jobs'   ? styles.active : ''}`}>Jobs</a>
          <a href="#create" className={`${styles.navLink} ${hash === '#create' ? styles.active : ''}`}>Create</a>
          <a href="#lookup" className={`${styles.navLink} ${hash === '#lookup' ? styles.active : ''}`}>Lookup</a>
          <a href="#deploy" className={`${styles.navLink} ${hash === '#deploy' ? styles.active : ''}`}>Deploy</a>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className={styles.navLink}>
            Explorer ↗
          </a>
        </nav>

        <div className={styles.walletArea}>
          {wallet.isConnected ? (
            <div className={styles.walletInfo}>
              {/* USDC Balance */}
              <div className={styles.usdcBadge}>
                <span className={styles.dot} />
                <span className={styles.usdcAmount}>
                  {parseFloat(wallet.formattedUsdc).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className={styles.usdcLabel}>USDC</span>
              </div>

              {/* Wrong network banner */}
              {!wallet.isCorrectChain && (
                <button
                  className={styles.switchBtn}
                  onClick={wallet.switchNetwork}
                  disabled={wallet.isSwitchingNetwork}
                  title="Switch to Arc Testnet (Chain ID 5042002)"
                >
                  {wallet.isSwitchingNetwork ? (
                    <span className={styles.spinner} />
                  ) : (
                    '⚠ Wrong Network'
                  )}
                </button>
              )}

              {/* Address link */}
              <a
                href={explorerAddr(wallet.address!)}
                target="_blank"
                rel="noreferrer"
                className={styles.addressBtn}
                title={wallet.address!}
              >
                {shortenAddress(wallet.address!)}
              </a>

              {/* Disconnect */}
              <button
                className={styles.disconnectBtn}
                onClick={wallet.disconnect}
                title="Disconnect wallet"
              >
                ×
              </button>
            </div>
          ) : (
            <div className={styles.connectWrapper}>
              <button
                id="connect-wallet-btn"
                className={styles.connectBtn}
                onClick={wallet.connect}
                disabled={wallet.isSwitchingNetwork}
              >
                {wallet.isSwitchingNetwork ? (
                  <><span className={styles.spinner} /> Switching…</>
                ) : (
                  'Connect Wallet'
                )}
              </button>
              {wallet.connectError && (
                <div className={styles.connectError} title={wallet.connectError}>
                  ⚠ {wallet.connectError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
