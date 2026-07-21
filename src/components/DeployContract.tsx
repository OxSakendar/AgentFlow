import { useState, useEffect } from 'react'
import type { WalletState } from '../hooks/useWallet'
import { useDeployContract } from '../hooks/useDeployContract'
import { USDC_CONTRACT, AGENTIC_COMMERCE_CONTRACT } from '../lib/constants'
import { explorerTx, shortenAddress } from '../lib/utils'
import styles from './DeployContract.module.css'

interface Props {
  wallet: WalletState
  onContractDeployed: (address: string) => void
  activeContractAddress: string
}

export function DeployContract({ wallet, onContractDeployed, activeContractAddress }: Props) {
  const { loading, txHash, contractAddress, error, deploy, reset } = useDeployContract(wallet.walletClient)
  
  const [paymentToken, setPaymentToken] = useState<string>(USDC_CONTRACT)
  const [platformTreasury, setPlatformTreasury] = useState('')

  const isDefaultContract = activeContractAddress.toLowerCase() === AGENTIC_COMMERCE_CONTRACT.toLowerCase()

  // Set default treasury address to current wallet address when connected
  useEffect(() => {
    if (wallet.address && !platformTreasury) {
      setPlatformTreasury(wallet.address)
    }
  }, [wallet.address, platformTreasury])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet.isConnected) {
      wallet.connect()
      return
    }
    if (!paymentToken || !platformTreasury) return

    await deploy(paymentToken, platformTreasury)
  }

  const handleUseContract = () => {
    if (contractAddress) {
      onContractDeployed(contractAddress)
    }
  }

  return (
    <section id="deploy" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2>Deploy Custom ERC-8183 Contract</h2>
          <p>Deploy a new programmable job registry for agent commerce on Arc Testnet</p>
        </div>
      </div>
      <div className={styles.activeStatus}>
        <span>
          <strong>Active Contract in App:</strong>{' '}
          <span className={styles.monoAddress}>{shortenAddress(activeContractAddress)}</span>{' '}
          {isDefaultContract ? '(Default)' : '(Custom)'}
        </span>
        {!isDefaultContract && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => onContractDeployed(AGENTIC_COMMERCE_CONTRACT)}
          >
            Reset to Default
          </button>
        )}
      </div>

      {contractAddress ? (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h3>Contract Deployed!</h3>
          <div className={styles.addressBlock}>
            <span className={styles.label}>Contract Address</span>
            <span className={styles.addressVal}>{contractAddress}</span>
          </div>
          
          {txHash && (
            <a 
              href={explorerTx(txHash)} 
              target="_blank" 
              rel="noreferrer" 
              className={styles.txLink}
            >
              View deployment transaction ↗
            </a>
          )}

          <div className={styles.successActions}>
            <button 
              className={styles.btnPrimary} 
              onClick={handleUseContract}
              disabled={activeContractAddress.toLowerCase() === contractAddress.toLowerCase()}
            >
              {activeContractAddress.toLowerCase() === contractAddress.toLowerCase() 
                ? 'Currently Active in App' 
                : 'Use This Contract in App'}
            </button>
            <button className={styles.btnSecondary} onClick={reset}>
              Deploy Another
            </button>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="deploy-token">USDC Payment Token Address</label>
            <input
              id="deploy-token"
              className={styles.input}
              type="text"
              required
              placeholder="e.g. 0x…"
              value={paymentToken}
              onChange={e => setPaymentToken(e.target.value)}
            />
            <span className={styles.fieldHint}>
              Address of ERC-20 token used for escrow and payouts. Defaults to Arc USDC.
            </span>
          </div>

          <div className={styles.field}>
            <label htmlFor="deploy-treasury">Platform Treasury Address</label>
            <input
              id="deploy-treasury"
              className={styles.input}
              type="text"
              required
              placeholder="e.g. 0x…"
              value={platformTreasury}
              onChange={e => setPlatformTreasury(e.target.value)}
            />
            <span className={styles.fieldHint}>
              Address where platform fees are deposited. Usually your wallet or DAO treasury.
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {!wallet.isConnected ? (
            <button 
              type="button" 
              className={styles.btnPrimary} 
              onClick={() => wallet.connect()}
            >
              Connect Wallet to Deploy
            </button>
          ) : (
            <button 
              type="submit" 
              className={styles.btnPrimary} 
              disabled={loading || !paymentToken || !platformTreasury}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Deploying contract…
                </>
              ) : (
                'Deploy AgenticCommerce Contract'
              )}
            </button>
          )}

          {txHash && !contractAddress && (
            <div className={styles.pendingBlock}>
              <span className={styles.spinner} />
              <p>Deployment transaction pending...</p>
              <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className={styles.txLink}>
                Track on Explorer ↗
              </a>
            </div>
          )}
        </form>
      )}
    </section>
  )
}
