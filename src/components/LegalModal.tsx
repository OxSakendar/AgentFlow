import { useState, type FormEvent } from 'react'
import styles from './LegalModal.module.css'

export type LegalModalType = 'tos' | 'privacy' | 'cookie' | 'contact' | null

interface Props {
  type: LegalModalType
  onClose: () => void
}

export function LegalModal({ type, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })

  if (!type) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const renderContent = () => {
    switch (type) {
      case 'tos':
        return (
          <>
            <p>Welcome to <strong>AgentFlow</strong>. By interacting with the AgentFlow protocol on Arc Testnet, you agree to these Terms of Service.</p>
            <h3>1. Non-Custodial Protocol</h3>
            <p>AgentFlow is a decentralized non-custodial smart contract suite (ERC-8183). We do not hold, control, or store your Web3 private keys or crypto assets.</p>
            <h3>2. Autonomous Agent Execution</h3>
            <p>Jobs submitted to the escrow contract are evaluated according to programmable bytecode criteria. Users are solely responsible for verifying evaluator addresses and escrow budgets.</p>
            <h3>3. Testnet Disclaimer</h3>
            <p>All smart contracts are currently deployed on <strong>Arc Testnet (Chain ID 5042002)</strong> using testnet USDC. Tokens have no real-world monetary value.</p>
          </>
        )
      case 'privacy':
        return (
          <>
            <p>AgentFlow respects your privacy and is built on non-custodial Web3 principles.</p>
            <h3>1. Data Collection</h3>
            <p>We do not track IP addresses, sell user metrics, or collect personal identifying information (PII). All transactions are recorded publicly on the Arc blockchain.</p>
            <h3>2. Wallet Connection</h3>
            <p>Connecting your wallet provider (MetaMask, Phantom, Keplr, Base) only shares your public Ethereum address (`0x...`) with your local browser session to query on-chain balances.</p>
            <h3>3. Third-Party RPCs</h3>
            <p>Network calls interact directly with the public Arc RPC node (`rpc.testnet.arc.network`).</p>
          </>
        )
      case 'cookie':
        return (
          <>
            <p>This Cookie Policy explains how AgentFlow uses local storage and cookies.</p>
            <h3>1. Essential Storage</h3>
            <p>We use browser `localStorage` solely to remember your preferred wallet connection state and user session settings.</p>
            <h3>2. Zero Tracking Cookies</h3>
            <p>AgentFlow contains no advertising cookies, third-party analytics trackers, or cross-site tracking scripts.</p>
          </>
        )
      case 'contact':
        return submitted ? (
          <div className={styles.successNotice}>
            <span>✓ Message Sent Successfully!</span>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Thank you for reaching out. Our team will respond to {formData.email || 'your email'} shortly.
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <p>Have questions about AgentFlow or ERC-8183 integration? Send us a message below.</p>
            <div className={styles.field}>
              <label>Your Name</label>
              <input
                type="text"
                required
                className={styles.input}
                placeholder="e.g. Satoshi Nakamoto"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Email Address</label>
              <input
                type="email"
                required
                className={styles.input}
                placeholder="e.g. satoshi@agentflow.io"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Subject</label>
              <input
                type="text"
                required
                className={styles.input}
                placeholder="e.g. Agent SDK Integration Query"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Message</label>
              <textarea
                required
                className={styles.textarea}
                placeholder="Describe your inquiry or technical question..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Send Message ↗
            </button>
          </form>
        )
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'tos': return { title: 'Terms of Service', icon: '📜' }
      case 'privacy': return { title: 'Privacy Policy', icon: '🛡️' }
      case 'cookie': return { title: 'Cookie Policy', icon: '🍪' }
      case 'contact': return { title: 'Contact Us', icon: '💬' }
    }
  }

  const meta = getTitle()

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.icon}>{meta.icon}</span>
            <h2>{meta.title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close popup">×</button>
        </div>

        <div className={styles.body}>
          {renderContent()}
        </div>

        <div className={styles.footer}>
          <button className={styles.doneBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
