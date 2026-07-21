import { useState } from 'react'
import type { WalletState } from '../hooks/useWallet'
import { useJobs, type Job } from '../hooks/useJobs'
import { STATUS_NAMES, STATUS_COLORS } from '../lib/constants'
import { formatUsdc, formatExpiry, explorerTx, explorerAddr, shortenAddress } from '../lib/utils'
import styles from './JobCard.module.css'

interface Props { job: Job; wallet: WalletState; contractAddress: `0x${string}`; onRefresh: () => void }

export function JobCard({ job, wallet, contractAddress, onRefresh }: Props) {
  const { loading, error, txHash, setBudget, fundEscrow, submitDeliverable, completeJob } = useJobs(wallet.walletClient, contractAddress)
  const [budgetInput, setBudgetInput] = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [actionDone, setActionDone] = useState(false)

  const statusName = STATUS_NAMES[job.status] ?? 'Unknown'
  const statusColor = STATUS_COLORS[statusName] ?? '#6b7280'

  const isClient   = wallet.address?.toLowerCase() === job.client.toLowerCase()
  const isProvider = wallet.address?.toLowerCase() === job.provider.toLowerCase()

  async function handleSetBudget() {
    const h = await setBudget(job.id, budgetInput)
    if (h) { setActionDone(true); onRefresh() }
  }

  async function handleFund() {
    const h = await fundEscrow(job.id, formatUsdc(job.budget).replace(/,/g, ''))
    if (h) { setActionDone(true); onRefresh() }
  }

  async function handleSubmit() {
    const h = await submitDeliverable(job.id, deliverable)
    if (h) { setActionDone(true); onRefresh() }
  }

  async function handleComplete() {
    const h = await completeJob(job.id)
    if (h) { setActionDone(true); onRefresh() }
  }

  return (
    <div className={styles.card} id={`job-${job.id}`}>
      <div className={styles.top}>
        <div className={styles.idBadge}>#{job.id.toString()}</div>
        <span className={styles.statusBadge} style={{ '--status-color': statusColor } as React.CSSProperties}>
          <span className={styles.statusDot} />
          {statusName}
        </span>
      </div>

      <p className={styles.description}>{job.description}</p>

      <div className={styles.meta}>
        <MetaItem label="Budget" value={`${formatUsdc(job.budget)} USDC`} mono />
        <MetaItem label="Expiry" value={formatExpiry(job.expiredAt)} />
        <MetaItem label="Client" value={shortenAddress(job.client)} link={explorerAddr(job.client)} />
        <MetaItem label="Provider" value={shortenAddress(job.provider)} link={explorerAddr(job.provider)} />
      </div>

      <button className={styles.expandBtn} onClick={() => setExpanded(v => !v)}>
        {expanded ? '▲ Hide actions' : '▼ Show actions'}
      </button>

      {expanded && (
        <div className={styles.actions}>
          {/* Set Budget – provider, status Open */}
          {isProvider && job.status === 0 && (
            <div className={styles.action}>
              <h4>Set Budget</h4>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  type="number" min="0.01" step="0.01"
                  placeholder="USDC amount"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                />
                <button id={`set-budget-${job.id}`} className={styles.actionBtn} disabled={loading || !budgetInput} onClick={handleSetBudget}>
                  {loading ? <span className={styles.spinner} /> : 'Set Budget'}
                </button>
              </div>
            </div>
          )}

          {/* Fund Escrow – client, status Open with budget */}
          {isClient && job.status === 0 && job.budget > 0n && (
            <div className={styles.action}>
              <h4>Fund Escrow</h4>
              <p className={styles.actionDesc}>Approve and transfer <strong>{formatUsdc(job.budget)} USDC</strong> into escrow.</p>
              <button id={`fund-${job.id}`} className={styles.actionBtn} disabled={loading} onClick={handleFund}>
                {loading ? <span className={styles.spinner} /> : 'Approve & Fund'}
              </button>
            </div>
          )}

          {/* Submit Deliverable – provider, status Funded */}
          {isProvider && job.status === 1 && (
            <div className={styles.action}>
              <h4>Submit Deliverable</h4>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  placeholder="Deliverable text / hash"
                  value={deliverable}
                  onChange={e => setDeliverable(e.target.value)}
                />
                <button id={`submit-${job.id}`} className={styles.actionBtn} disabled={loading || !deliverable} onClick={handleSubmit}>
                  {loading ? <span className={styles.spinner} /> : 'Submit'}
                </button>
              </div>
            </div>
          )}

          {/* Complete Job – evaluator/client, status Submitted */}
          {isClient && job.status === 2 && (
            <div className={styles.action}>
              <h4>Complete Job</h4>
              <p className={styles.actionDesc}>Approve the deliverable and release payment to the provider.</p>
              <button id={`complete-${job.id}`} className={styles.actionBtn + ' ' + styles.completeBtn} disabled={loading} onClick={handleComplete}>
                {loading ? <span className={styles.spinner} /> : '✓ Complete & Release Payment'}
              </button>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          {txHash && (
            <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className={styles.txLink}>
              View transaction ↗
            </a>
          )}
          {actionDone && !loading && !error && (
            <div className={styles.successNote}>Action confirmed on-chain ✓</div>
          )}
        </div>
      )}
    </div>
  )
}

function MetaItem({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  return (
    <div className={styles.metaItem}>
      <span className={styles.metaLabel}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className={`${styles.metaValue} ${mono ? styles.mono : ''}`}>{value} ↗</a>
      ) : (
        <span className={`${styles.metaValue} ${mono ? styles.mono : ''}`}>{value}</span>
      )}
    </div>
  )
}
