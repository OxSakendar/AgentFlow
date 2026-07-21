import { useState, useEffect, useCallback } from 'react'
import { createWalletClient, custom, formatUnits } from 'viem'
import { arcTestnet, USDC_CONTRACT, erc20Abi } from '../lib/constants'
import { publicClient } from '../lib/utils'

export interface WalletState {
  address: `0x${string}` | null
  chainId: number | null
  usdcBalance: bigint
  isConnected: boolean
  isCorrectChain: boolean
  connectError: string | null
  isSwitchingNetwork: boolean
  connect: () => Promise<void>
  disconnect: () => void
  refresh: () => Promise<void>
  switchNetwork: () => Promise<void>
  walletClient: ReturnType<typeof createWalletClient> | null
  formattedUsdc: string
}

const ARC_CHAIN_ID = 5042002
const ARC_CHAIN_HEX = '0x' + ARC_CHAIN_ID.toString(16)

/**
 * Resolve the best EVM provider.
 * EIP-5749: when multiple wallets (Phantom, Keplr, MetaMask…) are installed
 * they expose a `providers` array. We prefer MetaMask, then any non-Phantom
 * provider, then fall back to raw window.ethereum.
 */
function resolveProvider(): any {
  if (typeof window === 'undefined') return null
  const eth = (window as any).ethereum
  if (!eth) return null

  const providers: any[] = eth.providers ?? []
  if (providers.length > 0) {
    return (
      providers.find((p: any) => p.isMetaMask && !p.isPhantom) ??
      providers.find((p: any) => !p.isPhantom) ??
      providers[0]
    )
  }
  return eth
}

/** Add / switch to Arc Testnet using a specific provider instance. */
async function ensureArcNetwork(provider: any): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_CHAIN_HEX }],
    })
  } catch (err: any) {
    if (err.code === 4902 || err.code === -32603) {
      // Chain not added yet — add it
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: ARC_CHAIN_HEX,
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

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n)
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)

  const provider = resolveProvider()

  const buildWalletClient = useCallback(
    (addr: `0x${string}`) => {
      if (!provider) return null
      return createWalletClient({ account: addr, chain: arcTestnet, transport: custom(provider) })
    },
    [provider],
  )

  const fetchBalance = useCallback(async (addr: `0x${string}`) => {
    try {
      // balanceOf on the Arc Testnet USDC system contract (6 decimals)
      const bal = await publicClient.readContract({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr],
      })
      setUsdcBalance(bal as bigint)
    } catch {
      setUsdcBalance(0n)
    }
  }, [])



  const refresh = useCallback(async () => {
    if (address) await fetchBalance(address)
  }, [address, fetchBalance])

  // ── Switch to Arc Testnet (callable from UI) ──────────────────────────────
  const switchNetwork = useCallback(async () => {
    if (!provider) return
    setConnectError(null)
    setIsSwitchingNetwork(true)
    try {
      await ensureArcNetwork(provider)
      // chainChanged event will update chainId automatically
    } catch (e: any) {
      if (e?.code !== 4001) {
        setConnectError('Network switch failed: ' + (e?.message ?? String(e)))
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }, [provider])

  // ── Connect wallet ────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setConnectError(null)
    if (!provider) {
      setConnectError('No wallet found. Please install MetaMask.')
      return
    }
    try {
      // 1. Request accounts
      const accounts: `0x${string}`[] = await provider.request({ method: 'eth_requestAccounts' })
      if (!accounts?.length) {
        setConnectError('No accounts returned. Did you approve the connection?')
        return
      }
      const addr = accounts[0]

      // 2. Auto-switch to Arc Testnet (mandatory)
      setIsSwitchingNetwork(true)
      try {
        await ensureArcNetwork(provider)
      } catch (e: any) {
        // User rejected the network switch — warn but still set wallet state
        if (e?.code !== 4001) {
          setConnectError('Please switch to Arc Testnet to use this app.')
        }
      } finally {
        setIsSwitchingNetwork(false)
      }

      // 3. Read final chain after (possible) switch
      const cid = parseInt(await provider.request({ method: 'eth_chainId' }), 16)
      setAddress(addr)
      setChainId(cid)
      setWalletClient(buildWalletClient(addr))

      // 4. Fetch USDC balance
      await fetchBalance(addr)
    } catch (e: any) {
      if (e?.code === 4001) return // user rejected — silent
      setConnectError(e?.message ?? String(e))
    }
  }, [provider, buildWalletClient, fetchBalance])

  const disconnect = useCallback(() => {
    setAddress(null)
    setChainId(null)
    setUsdcBalance(0n)
    setWalletClient(null)
    setConnectError(null)
  }, [])

  // ── Provider event listeners + auto-reconnect ─────────────────────────────
  useEffect(() => {
    if (!provider) return

    // Auto-reconnect if already authorised
    provider
      .request({ method: 'eth_accounts' })
      .then(async (accounts: `0x${string}`[]) => {
        if (!accounts[0]) return
        const addr = accounts[0]
        const cid = parseInt(await provider.request({ method: 'eth_chainId' }), 16)
        setAddress(addr)
        setChainId(cid)
        setWalletClient(buildWalletClient(addr))
        await fetchBalance(addr)
      })
      .catch(() => {})

    const onAccounts = (accounts: `0x${string}`[]) => {
      if (!accounts[0]) { disconnect(); return }
      setAddress(accounts[0])
      setWalletClient(buildWalletClient(accounts[0]))
      fetchBalance(accounts[0])
    }

    const onChain = async (cidHex: string) => {
      const cid = parseInt(cidHex, 16)
      setChainId(cid)

      // If user switches away from Arc Testnet — offer auto-switch back
      if (cid !== ARC_CHAIN_ID) {
        setIsSwitchingNetwork(true)
        try {
          await ensureArcNetwork(provider)
        } catch {
          // User declined — they'll see the "Wrong Network" banner
        } finally {
          setIsSwitchingNetwork(false)
        }
      } else {
        // Refreshed to correct chain — update balance
        setChainId(ARC_CHAIN_ID)
        setConnectError(null)
      }
    }

    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    return () => {
      provider.removeListener('accountsChanged', onAccounts)
      provider.removeListener('chainChanged', onChain)
    }
  }, [provider, buildWalletClient, fetchBalance, disconnect])

  // Re-fetch balance whenever chainId settles on Arc Testnet
  useEffect(() => {
    if (address && chainId === ARC_CHAIN_ID) {
      fetchBalance(address)
    }
  }, [chainId, address, fetchBalance])

  return {
    address,
    chainId,
    usdcBalance,
    isConnected: !!address,
    isCorrectChain: chainId === ARC_CHAIN_ID,
    connectError,
    isSwitchingNetwork,
    connect,
    disconnect,
    refresh,
    switchNetwork,
    walletClient,
    formattedUsdc: formatUnits(usdcBalance, 6),
  }
}
