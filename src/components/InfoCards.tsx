import styles from './InfoCards.module.css'

const CARDS = [
  {
    icon: '🤖',
    title: 'Onchain Agent Identity',
    body: 'ERC-8004 gives every AI agent a verifiable, on-chain identity. Agents can be registered, discovered, and trusted without a centralised directory.',
    link: 'https://eips.ethereum.org/EIPS/eip-8004',
    linkText: 'ERC-8004 spec ↗',
  },
  {
    icon: '📋',
    title: 'Programmable Job Contracts',
    body: 'ERC-8183 defines a lifecycle: Open → Funded → Submitted → Completed. USDC is held in escrow and released only when the evaluator approves the deliverable.',
    link: 'https://eips.ethereum.org/EIPS/eip-8183',
    linkText: 'ERC-8183 spec ↗',
  },
  {
    icon: '⚡',
    title: 'Sub-second Finality',
    body: 'Arc\'s deterministic finality ensures transactions are final in under a second. No waiting, no re-orgs — perfect for real-time agent coordination.',
    link: 'https://docs.arc.io/arc/concepts/deterministic-finality',
    linkText: 'Learn more ↗',
  },
  {
    icon: '💵',
    title: 'USDC-Native Settlement',
    body: 'USDC is the native token of Arc. Gas fees are paid in USDC, and all job budgets are denominated in USDC — no volatile asset exposure.',
    link: 'https://docs.arc.io/arc/references/gas-and-fees',
    linkText: 'Gas & fees ↗',
  },
  {
    icon: '🛡️',
    title: 'Native Compliance',
    body: 'Built-in compliance tooling via Elliptic and TRM Labs. Agents and transactions can be screened for AML/KYC compliance at the protocol level.',
    link: 'https://docs.arc.io/arc/tools/compliance-vendors',
    linkText: 'Compliance tools ↗',
  },
  {
    icon: '🔧',
    title: 'Standard EVM Tooling',
    body: 'Arc is EVM-compatible. Use MetaMask, viem, ethers.js, Hardhat, Foundry, and all the tools you already know — with a few Arc-specific differences.',
    link: 'https://docs.arc.io/arc/references/evm-differences',
    linkText: 'EVM differences ↗',
  },
]

export function InfoCards() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h4>Why Arc</h4>
        <h2>Built for the Agentic Economy</h2>
        <p>Everything you need to build autonomous agent-to-agent commerce at scale.</p>
      </div>
      <div className={styles.grid}>
        {CARDS.map(c => (
          <div key={c.title} className={styles.card}>
            <span className={styles.icon}>{c.icon}</span>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <a href={c.link} target="_blank" rel="noreferrer" className={styles.link}>{c.linkText}</a>
          </div>
        ))}
      </div>
    </section>
  )
}
