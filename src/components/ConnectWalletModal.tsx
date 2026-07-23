import type { WalletState } from '../hooks/useWallet'
import styles from './ConnectWalletModal.module.css'

interface Props {
  wallet: WalletState
}

export function ConnectWalletModal({ wallet }: Props) {
  if (!wallet.isModalOpen) return null

  const handleWalletSelect = (walletId: string) => {
    wallet.connect(walletId)
  }

  // Detect installed wallets in browser environment
  const isMetaMaskDetected = typeof window !== 'undefined' && !!((window as any).ethereum?.isMetaMask || (window as any).ethereum?.providers?.some((p: any) => p.isMetaMask))
  const isPhantomDetected = typeof window !== 'undefined' && !!((window as any).phantom || (window as any).ethereum?.isPhantom)
  const isKeplrDetected = typeof window !== 'undefined' && !!((window as any).keplr)
  const isBaseDetected = typeof window !== 'undefined' && !!((window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet)

  return (
    <div className={styles.overlay} onClick={wallet.closeModal}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          className={styles.closeBtn}
          onClick={wallet.closeModal}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className={styles.contentGrid}>
          {/* ── LEFT PANEL ───────────────────────────────────────────── */}
          <div className={styles.leftPanel}>
            <h2 id="modal-title" className={styles.title}>
              Connect a Wallet
            </h2>

            {/* Installed Section Header */}
            <div className={styles.sectionHeaderInstalled}>Installed</div>

            <div className={styles.walletList}>
              {/* Keplr */}
              <button
                className={styles.walletRow}
                onClick={() => handleWalletSelect('keplr')}
                disabled={!!wallet.connectingWalletId}
              >
                <div className={`${styles.iconContainer} ${styles.bgKeplr}`}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.walletSvg}>
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="white" />
                    <path d="M12 4V7M12 17V20M4 12H7M17 12H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={styles.walletName}>Keplr</span>
                {isKeplrDetected && <span className={styles.installedBadge}>Installed</span>}
                {wallet.connectingWalletId === 'keplr' && <span className={styles.connectingDot}>Connecting…</span>}
              </button>

              {/* Phantom */}
              <button
                className={styles.walletRow}
                onClick={() => handleWalletSelect('phantom')}
                disabled={!!wallet.connectingWalletId}
              >
                <div className={`${styles.iconContainer} ${styles.bgPhantom}`}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.walletSvg}>
                    <path
                      d="M19 12C19 15.866 15.866 19 12 19C8.8 19 6.08 16.84 5.25 13.9C5.1 13.4 5.5 13 6 13H18C18.55 13 19.05 12.55 19 12Z"
                      fill="white"
                    />
                    <path
                      d="M12 4C7.58 4 4 7.58 4 12C4 13.13 4.24 14.2 4.67 15.17C5.03 16 6.06 16.32 6.83 15.77C7.45 15.33 7.8 14.57 7.73 13.82C7.6 12.44 8.7 11.25 10.08 11.12C11.58 10.98 12.86 12.1 12.98 13.58C13.06 14.49 13.55 15.31 14.37 15.72C15.22 16.14 16.24 15.75 16.6 14.87C17.5 12.65 16.5 10 14.5 8.5C13.5 7.75 12.25 7.5 11 7.75"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="9" cy="9" r="1.2" fill="#ab9ff2" />
                    <circle cx="14" cy="9" r="1.2" fill="#ab9ff2" />
                  </svg>
                </div>
                <span className={styles.walletName}>Phantom</span>
                {isPhantomDetected && <span className={styles.installedBadge}>Installed</span>}
                {wallet.connectingWalletId === 'phantom' && <span className={styles.connectingDot}>Connecting…</span>}
              </button>
            </div>

            {/* Popular Section */}
            <div className={styles.sectionHeaderPopular}>Popular</div>

            <div className={styles.walletList}>
              {/* Rainbow */}
              <button
                className={styles.walletRow}
                onClick={() => handleWalletSelect('rainbow')}
                disabled={!!wallet.connectingWalletId}
              >
                <div className={`${styles.iconContainer} ${styles.bgRainbow}`}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.walletSvg}>
                    <path d="M4 19C4 10.1634 11.1634 3 20 3" stroke="#FF5964" strokeWidth="3" strokeLinecap="round" />
                    <path d="M4 19C4 12.3726 9.37258 7 16 7" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
                    <path d="M4 19C4 14.5817 7.58172 11 12 11" stroke="#00D68F" strokeWidth="3" strokeLinecap="round" />
                    <path d="M4 19C4 16.7614 5.76142 15 8 15" stroke="#0099FF" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={styles.walletName}>Rainbow</span>
                {wallet.connectingWalletId === 'rainbow' && <span className={styles.connectingDot}>Connecting…</span>}
              </button>

              {/* Base */}
              <button
                className={styles.walletRow}
                onClick={() => handleWalletSelect('base')}
                disabled={!!wallet.connectingWalletId}
              >
                <div className={`${styles.iconContainer} ${styles.bgBase}`}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.walletSvg}>
                    <circle cx="12" cy="12" r="8" fill="white" />
                  </svg>
                </div>
                <span className={styles.walletName}>Base</span>
                {isBaseDetected && <span className={styles.installedBadge}>Installed</span>}
                {wallet.connectingWalletId === 'base' && <span className={styles.connectingDot}>Connecting…</span>}
              </button>

              {/* MetaMask */}
              <button
                className={styles.walletRow}
                onClick={() => handleWalletSelect('metamask')}
                disabled={!!wallet.connectingWalletId}
              >
                <div className={`${styles.iconContainer} ${styles.bgMetaMask}`}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.walletSvg}>
                    <polygon points="12,3 6,9 9,12 12,9 15,12 18,9" fill="#E4761B" stroke="#E4761B" strokeWidth="1" />
                    <polygon points="12,21 5,14 7,10 12,14 17,10 19,14" fill="#E4761B" />
                    <polygon points="12,9 9,12 12,14 15,12" fill="#D7C1B3" />
                    <circle cx="9.5" cy="10.5" r="1.2" fill="#233447" />
                    <circle cx="14.5" cy="10.5" r="1.2" fill="#233447" />
                  </svg>
                </div>
                <span className={styles.walletName}>MetaMask</span>
                {isMetaMaskDetected && <span className={styles.installedBadge}>Installed</span>}
                {wallet.connectingWalletId === 'metamask' && <span className={styles.connectingDot}>Connecting…</span>}
              </button>

              {/* WalletConnect */}
              <button
                className={styles.walletRow}
                onClick={() => handleWalletSelect('walletconnect')}
                disabled={!!wallet.connectingWalletId}
              >
                <div className={`${styles.iconContainer} ${styles.bgWalletConnect}`}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.walletSvg}>
                    <path
                      d="M6 9.5C9.31371 6.18629 14.6863 6.18629 18 9.5L18.7 10.2C18.9 10.4 18.9 10.7 18.7 10.9L16.6 13C16.4 13.2 16.1 13.2 15.9 13L15.4 12.5C13.5 10.6 10.5 10.6 8.6 12.5L8.1 13C7.9 13.2 7.6 13.2 7.4 13L5.3 10.9C5.1 10.7 5.1 10.4 5.3 10.2L6 9.5Z"
                      fill="white"
                    />
                    <path
                      d="M10.2 14.8L11.7 16.3C11.9 16.5 12.1 16.5 12.3 16.3L13.8 14.8C14 14.6 14.3 14.6 14.5 14.8L16.2 16.5C16.4 16.7 16.4 17 16.2 17.2L12.5 20.9C12.2 21.2 11.8 21.2 11.5 20.9L7.8 17.2C7.6 17 7.6 16.7 7.8 16.5L9.5 14.8C9.7 14.6 10 14.6 10.2 14.8Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <span className={styles.walletName}>WalletConnect</span>
                {wallet.connectingWalletId === 'walletconnect' && (
                  <span className={styles.connectingDot}>Connecting…</span>
                )}
              </button>
            </div>

            {wallet.connectError && (
              <div className={styles.errorNotice}>
                ⚠ {wallet.connectError}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
          <div className={styles.rightPanel}>
            <h3 className={styles.rightTitle}>What is a Wallet?</h3>

            <div className={styles.infoCardsList}>
              {/* Card 1 */}
              <div className={styles.infoCard}>
                <div className={styles.cardBadgeDark}>
                  <div className={styles.badgeGrid}>
                    <div className={styles.gridRainbow}>🌈</div>
                    <div className={styles.gridPixel}>👾</div>
                    <div className={styles.gridEth}>◆</div>
                    <div className={styles.gridRose}>🌹</div>
                  </div>
                </div>
                <div className={styles.cardText}>
                  <h4 className={styles.cardHeading}>A Home for your Digital Assets</h4>
                  <p className={styles.cardDesc}>
                    Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTs.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className={styles.infoCard}>
                <div className={styles.cardBadgeGradient}>
                  <div className={styles.keyholeCapsule}>
                    <div className={styles.keyholeDot} />
                  </div>
                </div>
                <div className={styles.cardText}>
                  <h4 className={styles.cardHeading}>A New Way to Log In</h4>
                  <p className={styles.cardDesc}>
                    Instead of creating new accounts and passwords on every website, just connect your wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className={styles.bottomActions}>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className={styles.getWalletBtn}
              >
                Get a Wallet
              </a>
              <a
                href="https://ethereum.org/en/wallets/"
                target="_blank"
                rel="noreferrer"
                className={styles.learnMoreLink}
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
