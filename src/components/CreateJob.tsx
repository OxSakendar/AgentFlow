import { useState } from 'react'
import type { WalletState } from '../hooks/useWallet'
import { useJobs } from '../hooks/useJobs'
import { explorerTx, shortenAddress } from '../lib/utils'
import styles from './CreateJob.module.css'

interface Props { wallet: WalletState; contractAddress: `0x${string}`; onJobCreated: (id: bigint) => void }

export function CreateJob({ wallet, contractAddress, onJobCreated }: Props) {
  const { loading, txHash, error, createJob } = useJobs(wallet.walletClient, contractAddress)
  const [provider, setProvider] = useState('')
  const [evaluator, setEvaluator] = useState('')
  const [description, setDescription] = useState('')
  const [expiryHours, setExpiryHours] = useState('24')
  const [useSelfEvaluator, setUseSelfEvaluator] = useState(true)
  const [successId, setSuccessId] = useState<bigint | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet.isConnected) { wallet.connect(); return }
    const evalAddr = useSelfEvaluator ? wallet.address! : evaluator as `0x${string}`
    const result = await createJob(
      provider as `0x${string}`,
      evalAddr,
      description,
      parseInt(expiryHours),
    )
    if (result) { setSuccessId(result.jobId); onJobCreated(result.jobId) }
  }

  return (
    <section id="create" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2>Create a Job</h2>
          <p>Deploy an ERC-8183 programmable job contract on Arc Testnet</p>
        </div>
        <a
          href={`https://testnet.arcscan.app/address/${contractAddress}`}
          target="_blank" rel="noreferrer"
          className={styles.contractLink}
        >
          Contract ↗
        </a>
      </div>

      {successId !== null ? (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h3>Job #{successId.toString()} Created!</h3>
          <p>Your ERC-8183 job is live on Arc Testnet.</p>
          {txHash && (
            <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className={styles.txLink}>
              View transaction ↗
            </a>
          )}
          <div className={styles.successActions}>
            <button className={styles.btnPrimary} onClick={() => { setSuccessId(null); setDescription(''); setProvider('') }}>
              Create Another
            </button>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              className={styles.textarea}
              placeholder="Describe the work to be done by the AI agent…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="job-provider">Provider Address</label>
              <input
                id="job-provider"
                className={styles.input}
                placeholder="0x… agent or wallet"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                required
              />
              {wallet.address && (
                <button type="button" className={styles.fillSelf}
                  onClick={() => setProvider(wallet.address!)}>
                  Use my address
                </button>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="job-expiry">Expiry (hours)</label>
              <input
                id="job-expiry"
                className={styles.input}
                type="number" min="1" max="8760"
                value={expiryHours}
                onChange={e => setExpiryHours(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={useSelfEvaluator}
                onChange={e => setUseSelfEvaluator(e.target.checked)}
                id="use-self-evaluator"
              />
              Use my wallet as evaluator
            </label>
            {!useSelfEvaluator && (
              <input
                id="job-evaluator"
                className={styles.input}
                placeholder="0x… evaluator address"
                value={evaluator}
                onChange={e => setEvaluator(e.target.value)}
                required
              />
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            id="create-job-submit"
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? (
              <><span className={styles.spinner} /> Waiting for confirmation…</>
            ) : wallet.isConnected ? 'Deploy Job Contract' : 'Connect Wallet to Continue'}
          </button>

          {txHash && !successId && (
            <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className={styles.txLink}>
              View pending tx ↗ {shortenAddress(txHash)}
            </a>
          )}
        </form>
      )}
    </section>
  )
}
