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

export default function App() {
  const wallet = useWallet()
  const [latestJobId, setLatestJobId] = useState<bigint | null>(null)
  
  const [activeContractAddress, setActiveContractAddress] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agentflow_contract_override')
      if (saved && saved.startsWith('0x')) {
        return saved
      }
    }
    return AGENTIC_COMMERCE_CONTRACT
  })

  const handleContractDeployed = (newAddr: string) => {
    setActiveContractAddress(newAddr)
    localStorage.setItem('agentflow_contract_override', newAddr)
  }

  return (
    <div className="app">
      <Header wallet={wallet} />

      <main>
        <Hero wallet={wallet} />

        <div className="container">
          <InfoCards />

          {/* ── Two-column layout for Create + Lookup ── */}
          <section id="jobs" className="panels">
            <div className="panel-left">
              <CreateJob
                wallet={wallet}
                contractAddress={activeContractAddress as `0x${string}`}
                onJobCreated={(id) => setLatestJobId(id)}
              />
            </div>
            <div className="panel-right">
              <JobLookup 
                wallet={wallet} 
                contractAddress={activeContractAddress as `0x${string}`}
                initialId={latestJobId} 
              />
            </div>
          </section>

          <DeployContract
            wallet={wallet}
            activeContractAddress={activeContractAddress}
            onContractDeployed={handleContractDeployed}
          />

          {/* ── Network info strip ── */}
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
              <a href="https://rpc.testnet.arc.network" target="_blank" rel="noreferrer" className="net-val mono link">rpc.testnet.arc.network ↗</a>
            </div>
            <div className="net-item">
              <span className="net-label">Explorer</span>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="net-val mono link">testnet.arcscan.app ↗</a>
            </div>
            <div className="net-item">
              <span className="net-label">Faucet</span>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="net-val mono link">faucet.circle.com ↗</a>
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
