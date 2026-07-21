import { createPublicClient, http } from 'viem'
import { arcTestnet } from './constants'

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network'),
})

export function shortenAddress(addr: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}

export function formatUsdc(raw: bigint): string {
  const n = Number(raw) / 1_000_000
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

export function formatExpiry(ts: bigint): string {
  const d = new Date(Number(ts) * 1000)
  return d.toLocaleString()
}

export function isExpired(ts: bigint): boolean {
  return Number(ts) * 1000 < Date.now()
}

export function explorerTx(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`
}

export function explorerAddr(addr: string): string {
  return `https://testnet.arcscan.app/address/${addr}`
}

/** Resolve the best EVM provider (MetaMask-first, skips Phantom). */
function resolveProvider(): any {
  if (typeof window === 'undefined') return null
  const eth = (window as any).ethereum
  if (!eth) return null
  const providers: any[] = eth.providers ?? []
  if (providers.length > 0) {
    return providers.find((p: any) => p.isMetaMask && !p.isPhantom)
      ?? providers.find((p: any) => !p.isPhantom)
      ?? providers[0]
  }
  return eth
}

/** Switch or add the Arc Testnet to MetaMask */
export async function switchToArcTestnet(): Promise<void> {
  const provider = resolveProvider()
  if (!provider) throw new Error('No wallet found')

  const chainId = '0x' + (5042002).toString(16)
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] })
  } catch (err: any) {
    if (err.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId,
            chainName: 'Arc Testnet',
            nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
            rpcUrls: ['https://rpc.testnet.arc.network'],
            blockExplorerUrls: ['https://testnet.arcscan.app'],
          },
        ],
      })
    } else {
      throw err
    }
  }
}
