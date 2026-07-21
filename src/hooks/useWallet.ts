import { useState, useEffect, useCallback } from 'react'
import { createWalletClient, custom, formatUnits } from 'viem'
import { arcTestnet, USDC_CONTRACT, erc20Abi } from '../lib/constants'
import { publicClient, switchToArcTestnet } from '../lib/utils'

export interface WalletState {
  address: `0x${string}` | null
  chainId: number | null
  usdcBalance: bigint
  isConnected: boolean
  isCorrectChain: boolean
  connectError: string | null
  connect: () => Promise<void>
  disconnect: () => void
  refresh: () => Promise<void>
  walletClient: ReturnType<typeof createWalletClient> | null
  formattedUsdc: string
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n)
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  const provider = typeof window !== 'undefined' ? (window as any).ethereum : null

  const buildWalletClient = useCallback((addr: `0x${string}`) => {
    if (!provider) return null
    return createWalletClient({ account: addr, chain: arcTestnet, transport: custom(provider) })
  }, [provider])

  const fetchBalance = useCallback(async (addr: `0x${string}`) => {
    try {
      const bal = await publicClient.readContract({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr],
      })
      setUsdcBalance(bal)
    } catch { setUsdcBalance(0n) }
  }, [])

  const refresh = useCallback(async () => {
    if (address) await fetchBalance(address)
  }, [address, fetchBalance])

  const connect = useCallback(async () => {
    setConnectError(null)
    if (!provider) {
      setConnectError('No wallet found. Please install MetaMask or a compatible wallet.')
      return
    }
    try {
      const accounts: `0x${string}`[] = await provider.request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        setConnectError('No accounts returned. Did you approve the connection?')
        return
      }
      const addr = accounts[0]
      const cid = parseInt(await provider.request({ method: 'eth_chainId' }), 16)
      setAddress(addr)
      setChainId(cid)
      setWalletClient(buildWalletClient(addr))
      await fetchBalance(addr)
      // Switch network non-fatally after setting wallet state
      if (cid !== 5042002) {
        try { await switchToArcTestnet() } catch { /* user may reject, that's ok */ }
      }
    } catch (e: any) {
      const msg = e?.message || String(e)
      // User rejected the connection request — not a real error, just don't show
      if (e?.code === 4001) return
      setConnectError(msg)
    }
  }, [provider, buildWalletClient, fetchBalance])

  const disconnect = useCallback(() => {
    setAddress(null); setChainId(null); setUsdcBalance(0n); setWalletClient(null)
  }, [])

  // Auto-reconnect
  useEffect(() => {
    if (!provider) return
    provider.request({ method: 'eth_accounts' }).then(async (accounts: `0x${string}`[]) => {
      if (accounts[0]) {
        const addr = accounts[0]
        const cid = parseInt(await provider.request({ method: 'eth_chainId' }), 16)
        setAddress(addr); setChainId(cid)
        setWalletClient(buildWalletClient(addr))
        await fetchBalance(addr)
      }
    }).catch(() => {})

    const onAccounts = (accounts: `0x${string}`[]) => {
      if (!accounts[0]) { disconnect(); return }
      setAddress(accounts[0])
      setWalletClient(buildWalletClient(accounts[0]))
      fetchBalance(accounts[0])
    }
    const onChain = (cid: string) => setChainId(parseInt(cid, 16))
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    return () => { provider.removeListener('accountsChanged', onAccounts); provider.removeListener('chainChanged', onChain) }
  }, [provider, buildWalletClient, fetchBalance, disconnect])

  return {
    address,
    chainId,
    usdcBalance,
    isConnected: !!address,
    isCorrectChain: chainId === 5042002,
    connectError,
    connect,
    disconnect,
    refresh,
    walletClient,
    formattedUsdc: formatUnits(usdcBalance, 6),
  }
}
