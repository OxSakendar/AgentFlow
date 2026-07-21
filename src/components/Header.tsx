import { useState, useEffect } from 'react'
import type { WalletState } from '../hooks/useWallet'
import { shortenAddress, explorerAddr } from '../lib/utils'
import styles from './Header.module.css'

interface Props { wallet: WalletState }

export function Header({ wallet }: Props) {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <div>
            <span className={styles.logoText}>AgentFlow</span>
            <span className={styles.logoBadge}>Arc Testnet</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="#jobs" className={`${styles.navLink} ${hash === '#jobs' ? styles.active : ''}`}>Jobs</a>
          <a href="#create" className={`${styles.navLink} ${hash === '#create' ? styles.active : ''}`}>Create</a>
          <a href="#lookup" className={`${styles.navLink} ${hash === '#lookup' ? styles.active : ''}`}>Lookup</a>
          <a href="#deploy" className={`${styles.navLink} ${hash === '#deploy' ? styles.active : ''}`}>Deploy</a>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className={styles.navLink}>Explorer ↗</a>
        </nav>

        <div className={styles.walletArea}>
          {wallet.isConnected ? (
            <div className={styles.walletInfo}>
              <div className={styles.usdcBadge}>
                <span className={styles.dot} />
                {wallet.formattedUsdc} USDC
              </div>
              <a
                href={explorerAddr(wallet.address!)}
                target="_blank" rel="noreferrer"
                className={styles.addressBtn}
              >
                {shortenAddress(wallet.address!)}
              </a>
              {!wallet.isCorrectChain && (
                <button className={styles.switchBtn} onClick={wallet.connect}>
                  Switch Network
                </button>
              )}
              <button className={styles.disconnectBtn} onClick={wallet.disconnect} title="Disconnect">×</button>
            </div>
          ) : (
            <div className={styles.connectWrapper}>
              <button id="connect-wallet-btn" className={styles.connectBtn} onClick={wallet.connect}>
                Connect Wallet
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
