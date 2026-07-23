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
  isModalOpen: boolean
  connectingWalletId: string | null
  openModal: () => void
  closeModal: () => void
  connect: (walletId?: string) => Promise<void>
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

function resolveTargetProvider(walletId?: string): any {
  if (typeof window === 'undefined') return null
  const win = window as any
  const eth = win.ethereum

  if (walletId === 'phantom') {
    if (win.phantom?.ethereum) return win.phantom.ethereum
    if (eth?.isPhantom) return eth
  }
  if (walletId === 'keplr') {
    if (win.keplr?.ethereum) return win.keplr.ethereum
  }
  if (walletId === 'metamask') {
    if (eth?.providers) {
      const mm = eth.providers.find((p: any) => p.isMetaMask && !p.isPhantom)
      if (mm) return mm
    }
    if (eth?.isMetaMask && !eth?.isPhantom) return eth
  }
  if (walletId === 'base') {
    if (eth?.providers) {
      const cb = eth.providers.find((p: any) => p.isCoinbaseWallet || p.isBase)
      if (cb) return cb
    }
    if (eth?.isCoinbaseWallet) return eth
  }

  return resolveProvider()
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null)

  const provider = resolveProvider()

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const buildWalletClient = useCallback(
    (addr: `0x${string}`) => {
      if (!provider) return null
      return createWalletClient({ account: addr, chain: arcTestnet, transport: custom(provider) })
    },
    [provider],
  )

  const fetchBalance = useCallback(async (addr: `0x${string}`) => {
    try {
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

  const switchNetwork = useCallback(async () => {
    if (!provider) return
    setConnectError(null)
    setIsSwitchingNetwork(true)
    try {
      await ensureArcNetwork(provider)
    } catch (e: any) {
      if (e?.code !== 4001) {
        setConnectError('Network switch failed: ' + (e?.message ?? String(e)))
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }, [provider])

  const connect = useCallback(async (walletId?: string) => {
    setConnectError(null)
    setConnectingWalletId(walletId || 'default')
    
    const targetProvider = resolveTargetProvider(walletId) || provider

    if (!targetProvider) {
      setConnectError(`No wallet extension detected for ${walletId ? walletId.toUpperCase() : 'Web3'}. Please install MetaMask or another EVM wallet.`)
      setConnectingWalletId(null)
      return
    }

    try {
      const accounts: `0x${string}`[] = await targetProvider.request({ method: 'eth_requestAccounts' })
      if (!accounts?.length) {
        setConnectError('No accounts returned. Did you approve the connection?')
        setConnectingWalletId(null)
        return
      }
      const addr = accounts[0]

      setIsSwitchingNetwork(true)
      try {
        await ensureArcNetwork(targetProvider)
      } catch (e: any) {
        if (e?.code !== 4001) {
          setConnectError('Please switch to Arc Testnet to use this app.')
        }
      } finally {
        setIsSwitchingNetwork(false)
      }

      const cid = parseInt(await targetProvider.request({ method: 'eth_chainId' }), 16)
      setAddress(addr)
      setChainId(cid)
      setWalletClient(createWalletClient({ account: addr, chain: arcTestnet, transport: custom(targetProvider) }))

      await fetchBalance(addr)
      setIsModalOpen(false)
    } catch (e: any) {
      if (e?.code !== 4001) {
        setConnectError(e?.message ?? String(e))
      }
    } finally {
      setConnectingWalletId(null)
    }
  }, [provider, fetchBalance])

  const disconnect = useCallback(() => {
    setAddress(null)
    setChainId(null)
    setUsdcBalance(0n)
    setWalletClient(null)
    setConnectError(null)
  }, [])

  useEffect(() => {
    if (!provider) return

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

      if (cid !== ARC_CHAIN_ID) {
        setIsSwitchingNetwork(true)
        try {
          await ensureArcNetwork(provider)
        } catch {
        } finally {
          setIsSwitchingNetwork(false)
        }
      } else {
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

  useEffect(() => {
    if (!address || chainId !== ARC_CHAIN_ID) return

    fetchBalance(address)
    const interval = setInterval(() => {
      fetchBalance(address)
    }, 10000)

    const handleFocus = () => {
      fetchBalance(address)
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
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
    isModalOpen,
    connectingWalletId,
    openModal,
    closeModal,
    connect,
    disconnect,
    refresh,
    switchNetwork,
    walletClient,
    formattedUsdc: formatUnits(usdcBalance, 6),
  }
}

