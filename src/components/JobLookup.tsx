import { useState, useCallback } from 'react'
import type { WalletState } from '../hooks/useWallet'
import { useJobs, type Job } from '../hooks/useJobs'
import { JobCard } from './JobCard'
import styles from './JobLookup.module.css'

interface Props { wallet: WalletState; contractAddress: `0x${string}`; initialId?: bigint | null }

export function JobLookup({ wallet, contractAddress, initialId }: Props) {
  const { getJob, loading } = useJobs(wallet.walletClient, contractAddress)
  const [inputId, setInputId] = useState(initialId ? initialId.toString() : '')
  const [job, setJob] = useState<Job | null>(null)
  const [notFound, setNotFound] = useState(false)

  const lookup = useCallback(async (id?: string) => {
    const target = id ?? inputId
    if (!target) return
    setNotFound(false); setJob(null)
    const result = await getJob(BigInt(target))
    if (result) setJob(result)
    else setNotFound(true)
  }, [inputId, getJob])

  const refresh = useCallback(() => { if (job) lookup(job.id.toString()) }, [job, lookup])

  return (
    <section id="lookup" className={styles.section}>
      <div className={styles.header}>
        <h2>Job Lookup</h2>
        <p>Look up any ERC-8183 job by ID from Arc Testnet</p>
      </div>

      <div className={styles.searchRow}>
        <input
          id="job-lookup-input"
          className={styles.input}
          type="number"
          min="1"
          placeholder="Enter Job ID…"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
        />
        <button id="job-lookup-btn" className={styles.searchBtn} disabled={loading || !inputId} onClick={() => lookup()}>
          {loading ? <span className={styles.spinner} /> : 'Look Up'}
        </button>
      </div>

      {notFound && (
        <div className={styles.notFound}>
          <span>⚠</span> Job #{inputId} not found on Arc Testnet
        </div>
      )}

      {job && <JobCard job={job} wallet={wallet} contractAddress={contractAddress} onRefresh={refresh} />}
    </section>
  )
}
