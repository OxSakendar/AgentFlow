import { useState, useCallback } from 'react'
import { parseUnits } from 'viem'
import type { createWalletClient } from 'viem'
import { arcTestnet, USDC_CONTRACT, erc20Abi, FUND_RECIPIENT } from '../lib/constants'
import { publicClient } from '../lib/utils'

export interface TransferState {
  loading: boolean
  txHash: string | null
  success: boolean
  error: string | null
  transfer: (amount: string) => Promise<void>
  reset: () => void
}

export function useTokenTransfer(
  walletClient: ReturnType<typeof createWalletClient> | null,
): TransferState {
  const [loading, setLoading]   = useState(false)
  const [txHash, setTxHash]     = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const reset = useCallback(() => {
    setLoading(false)
    setTxHash(null)
    setSuccess(false)
    setError(null)
  }, [])

  const transfer = useCallback(async (amount: string) => {
    if (!walletClient) { setError('Wallet not connected'); return }

    setError(null)
    setTxHash(null)
    setSuccess(false)
    setLoading(true)

    try {
      const [account] = await walletClient.getAddresses()

      // Parse USDC amount (6 decimals)
      const amountRaw = parseUnits(amount, 6)

      const hash = await walletClient.writeContract({
        address: USDC_CONTRACT,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [FUND_RECIPIENT, amountRaw],
        account,
        chain: arcTestnet,
      })
      setTxHash(hash)

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      setSuccess(true)
    } catch (e: any) {
      // User rejected — silent
      if (e?.code === 4001 || e?.cause?.code === 4001) return
      setError(e?.shortMessage ?? e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [walletClient])

  return { loading, txHash, success, error, transfer, reset }
}
