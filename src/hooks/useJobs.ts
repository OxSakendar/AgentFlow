import { useState, useCallback } from 'react'
import {
  decodeEventLog, keccak256, parseUnits, toHex, createWalletClient,
} from 'viem'
import {
  AGENTIC_COMMERCE_CONTRACT, USDC_CONTRACT,
  agenticCommerceAbi, erc20Abi, arcTestnet,
} from '../lib/constants'
import { publicClient } from '../lib/utils'

export interface Job {
  id: bigint
  client: `0x${string}`
  provider: `0x${string}`
  evaluator: `0x${string}`
  description: string
  budget: bigint
  expiredAt: bigint
  status: number
  hook: `0x${string}`
}

export interface TxResult { hash: string; ok: boolean; error?: string }

export function useJobs(
  walletClient: ReturnType<typeof createWalletClient> | null,
  contractAddressOverride?: `0x${string}`
) {
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const contractAddress = contractAddressOverride || AGENTIC_COMMERCE_CONTRACT

  const reset = () => { setError(null); setTxHash(null) }

  const getJob = useCallback(async (jobId: bigint): Promise<Job | null> => {
    try {
      const raw = await publicClient.readContract({
        address: contractAddress,
        abi: agenticCommerceAbi,
        functionName: 'getJob',
        args: [jobId],
      })
      return raw as unknown as Job
    } catch { return null }
  }, [contractAddress])

  const createJob = useCallback(async (
    provider: `0x${string}`,
    evaluator: `0x${string}`,
    description: string,
    expiryHours: number,
  ): Promise<{ jobId: bigint; hash: string } | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const block = await publicClient.getBlock()
      const expiredAt = block.timestamp + BigInt(expiryHours * 3600)

      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: agenticCommerceAbi,
        functionName: 'createJob',
        args: [provider, evaluator, expiredAt, description, '0x0000000000000000000000000000000000000000'],
        account,
        chain: arcTestnet,
      })
      setTxHash(hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      let jobId: bigint | undefined
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: agenticCommerceAbi, data: log.data, topics: log.topics })
          if (decoded.eventName === 'JobCreated') { jobId = (decoded.args as any).jobId; break }
        } catch { continue }
      }
      if (jobId == null) throw new Error('Could not parse JobCreated event')
      return { jobId, hash }
    } catch (e: any) {
      setError(e.shortMessage || e.message || String(e)); return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const setBudget = useCallback(async (jobId: bigint, amountUsdc: string): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const amount = parseUnits(amountUsdc, 6)
      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: agenticCommerceAbi,
        functionName: 'setBudget',
        args: [jobId, amount, '0x'],
        account, chain: arcTestnet,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (e: any) {
      setError(e.shortMessage || e.message || String(e)); return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const fundEscrow = useCallback(async (jobId: bigint, amountUsdc: string): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const amount = parseUnits(amountUsdc, 6)
      const [account] = await walletClient.getAddresses()
      // 1. Approve
      const approveHash = await walletClient.writeContract({
        address: USDC_CONTRACT, abi: erc20Abi,
        functionName: 'approve', args: [contractAddress, amount],
        account, chain: arcTestnet,
      })
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      // 2. Fund
      const hash = await walletClient.writeContract({
        address: contractAddress, abi: agenticCommerceAbi,
        functionName: 'fund', args: [jobId, '0x'],
        account, chain: arcTestnet,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (e: any) {
      setError(e.shortMessage || e.message || String(e)); return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const submitDeliverable = useCallback(async (jobId: bigint, deliverableText: string): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const deliverableHash = keccak256(toHex(deliverableText))
      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.writeContract({
        address: contractAddress, abi: agenticCommerceAbi,
        functionName: 'submit', args: [jobId, deliverableHash, '0x'],
        account, chain: arcTestnet,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (e: any) {
      setError(e.shortMessage || e.message || String(e)); return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const completeJob = useCallback(async (jobId: bigint): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const reasonHash = keccak256(toHex('deliverable-approved'))
      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.writeContract({
        address: contractAddress, abi: agenticCommerceAbi,
        functionName: 'complete', args: [jobId, reasonHash, '0x'],
        account, chain: arcTestnet,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (e: any) {
      setError(e.shortMessage || e.message || String(e)); return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  return { loading, txHash, error, getJob, createJob, setBudget, fundEscrow, submitDeliverable, completeJob }
}
