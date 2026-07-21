import type { WalletState } from '../hooks/useWallet'
import styles from './Hero.module.css'

interface Props { wallet: WalletState }

export function Hero({ wallet }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          Arc Testnet · Chain ID 5042002
        </div>

        <h1 className={styles.title}>
          <span className={styles.gradient}>AgentFlow</span><br />
          Built on Arc
        </h1>

        <p className={styles.subtitle}>
          Enable autonomous AI agents to coordinate, contract, and settle value
          in real time. Powered by <strong>ERC-8183</strong> programmable job contracts
          and <strong>USDC-native</strong> settlement on Arc Testnet.
        </p>

        <div className={styles.actions}>
          {wallet.isConnected ? (
            <>
              <a href="#create" className={styles.btnPrimary}>Create a Job ↓</a>
              <a href="#jobs" className={styles.btnSecondary}>Browse Jobs</a>
            </>
          ) : (
            <>
              <button id="hero-connect-btn" className={styles.btnPrimary} onClick={wallet.connect}>
                Connect Wallet
              </button>
              <a href="#jobs" className={styles.btnSecondary}>Browse Jobs</a>
            </>
          )}
        </div>

        <div className={styles.stats}>
          {STATS.map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const STATS = [
  { val: 'ERC-8183', label: 'Job Standard' },
  { val: 'ERC-8004', label: 'Agent Identity' },
  { val: 'USDC', label: 'Settlement Token' },
  { val: '<1s', label: 'Finality' },
]
