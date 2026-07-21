import { useState } from 'react'
import { useWallet } from './hooks/useWallet'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { InfoCards } from './components/InfoCards'
import { CreateJob } from './components/CreateJob'
import { JobLookup } from './components/JobLookup'
import { DeployContract } from './components/DeployContract'
import { AGENTIC_COMMERCE_CONTRACT } from './lib/constants'
import './App.css'

/**
 * The Create Job contract address is permanently set to AGENTIC_COMMERCE_CONTRACT.
 * It is NOT stored in state or localStorage and cannot be changed at runtime.
 */
export default function App() {
  const wallet = useWallet()
  const [latestJobId, setLatestJobId] = useState<bigint | null>(null)

  // ── Mandatory wallet gate ──────────────────────────────────────────────────
  if (!wallet.isConnected) {
    return (
      <div className="app">
        <Header wallet={wallet} />
        <div className="gate">
          <div className="gate-card">
            <div className="gate-icon">⬡</div>
            <h1 className="gate-title">Connect Your Wallet</h1>
            <p className="gate-desc">
              AgentFlow requires a connected wallet on <strong>Arc Testnet</strong> to
              create, manage, and monitor agentic jobs.
            </p>

            <div className="gate-network">
              <div className="gnet-row">
                <span className="gnet-label">Network</span>
                <span className="gnet-val">Arc Testnet</span>
              </div>
              <div className="gnet-row">
                <span className="gnet-label">Chain ID</span>
                <span className="gnet-val mono">5042002</span>
              </div>
              <div className="gnet-row">
                <span className="gnet-label">Currency</span>
                <span className="gnet-val">USDC</span>
              </div>
              <div className="gnet-row">
                <span className="gnet-label">RPC</span>
                <span className="gnet-val mono">rpc.testnet.arc.network</span>
              </div>
            </div>

            <button
              className="gate-btn"
              onClick={wallet.connect}
              disabled={wallet.isSwitchingNetwork}
            >
              {wallet.isSwitchingNetwork ? (
                <><span className="gate-spinner" /> Switching Network…</>
              ) : (
                'Connect & Switch to Arc Testnet'
              )}
            </button>

            {wallet.connectError && (
              <div className="gate-error">⚠ {wallet.connectError}</div>
            )}

            <p className="gate-hint">
              Don't have a wallet?{' '}
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
                Install MetaMask ↗
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Header wallet={wallet} />

      <main>
        <Hero wallet={wallet} />

        <div className="container">
          <InfoCards />

          <section id="jobs" className="panels">
            <div className="panel-left">
              <CreateJob
                wallet={wallet}
                contractAddress={AGENTIC_COMMERCE_CONTRACT}
                onJobCreated={(id) => setLatestJobId(id)}
              />
            </div>
            <div className="panel-right">
              <JobLookup
                wallet={wallet}
                contractAddress={AGENTIC_COMMERCE_CONTRACT}
                initialId={latestJobId}
              />
            </div>
          </section>

          <DeployContract
            wallet={wallet}
            activeContractAddress={AGENTIC_COMMERCE_CONTRACT}
            onContractDeployed={() => { /* permanent — address never changes */ }}
          />

          {/* Network info strip */}
          <div className="network-strip">
            <div className="net-item">
              <span className="net-label">Network</span>
              <span className="net-val">Arc Testnet</span>
            </div>
            <div className="net-item">
              <span className="net-label">Chain ID</span>
              <span className="net-val mono">5042002</span>
            </div>
            <div className="net-item">
              <span className="net-label">RPC</span>
              <a href="https://rpc.testnet.arc.network" target="_blank" rel="noreferrer" className="net-val mono link">
                rpc.testnet.arc.network ↗
              </a>
            </div>
            <div className="net-item">
              <span className="net-label">Explorer</span>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="net-val mono link">
                testnet.arcscan.app ↗
              </a>
            </div>
            <div className="net-item">
              <span className="net-label">Faucet</span>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="net-val mono link">
                faucet.circle.com ↗
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Built on <a href="https://arc.io" target="_blank" rel="noreferrer">Arc</a> · AgentFlow (ERC-8183)</span>
          <span className="footer-links">
            <a href="https://docs.arc.io/build/agentic-economy" target="_blank" rel="noreferrer">Docs ↗</a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">Explorer ↗</a>
            <a href="https://discord.com/invite/buildonarc" target="_blank" rel="noreferrer">Discord ↗</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
