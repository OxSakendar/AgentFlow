import { useState, useCallback } from 'react'
import {
  decodeEventLog, keccak256, parseUnits, toHex, createWalletClient,
} from 'viem'
import {
  AGENTIC_COMMERCE_CONTRACT, USDC_CONTRACT, FUND_RECIPIENT,
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
      let raw: any
      try {
        raw = await publicClient.readContract({
          address: contractAddress,
          abi: agenticCommerceAbi,
          functionName: 'getJob',
          args: [jobId],
        })
      } catch {
        raw = await publicClient.readContract({
          address: contractAddress,
          abi: agenticCommerceAbi,
          functionName: 'jobs',
          args: [jobId],
        })
      }

      if (!raw) return null

      let id: any = jobId
      let client = ''
      let provider = ''
      let evaluator = ''
      let description = ''
      let budget: any = 0n
      let expiredAt: any = 0n
      let status: any = 0
      let hook = ''

      if (Array.isArray(raw)) {
        [id, client, provider, evaluator, description, budget, expiredAt, status, hook] = raw
      } else if (typeof raw === 'object' && raw !== null) {
        id = raw.id ?? jobId
        client = raw.client
        provider = raw.provider
        evaluator = raw.evaluator
        description = raw.description ?? ''
        budget = raw.budget ?? 0n
        expiredAt = raw.expiredAt ?? 0n
        status = raw.status ?? 0
        hook = raw.hook ?? '0x0000000000000000000000000000000000000000'
      }

      if (!client || client === '0x0000000000000000000000000000000000000000') {
        return null
      }

      return {
        id: BigInt(id),
        client: client as `0x${string}`,
        provider: provider as `0x${string}`,
        evaluator: evaluator as `0x${string}`,
        description: String(description || ''),
        budget: BigInt(budget || 0),
        expiredAt: BigInt(expiredAt || 0),
        status: Number(status || 0),
        hook: (hook || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      }
    } catch (err) {
      console.error('getJob failed:', err)
      return null
    }
  }, [contractAddress])

  const createJob = useCallback(async (
    provider: `0x${string}`,
    evaluator: `0x${string}`,
    description: string,
    expiryHours: number,
  ): Promise<{ jobId: bigint; hash: string } | null> => {
    if (!walletClient) { setError('Wallet not connected. Please connect your wallet first.'); return null }
    setLoading(true); reset()
    try {
      let nowTs: bigint
      try {
        const block = await publicClient.getBlock()
        nowTs = block.timestamp
      } catch {
        nowTs = BigInt(Math.floor(Date.now() / 1000))
      }
      const expiredAt = nowTs + BigInt((expiryHours || 24) * 3600)

      let account = walletClient.account?.address
      if (!account) {
        const addrs = await walletClient.getAddresses()
        account = addrs[0]
      }
      if (!account) throw new Error('No active wallet account found. Please reconnect your wallet.')

      const safeProvider = provider && provider.startsWith('0x') && provider.length === 42
        ? provider
        : '0x0000000000000000000000000000000000000000' as `0x${string}`

      const safeEvaluator = evaluator && evaluator.startsWith('0x') && evaluator.length === 42
        ? evaluator
        : account

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: agenticCommerceAbi,
        functionName: 'createJob',
        args: [safeProvider, safeEvaluator, expiredAt, description || 'Agent Job', '0x0000000000000000000000000000000000000000'],
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
      if (jobId == null) {
        try {
          const count = await publicClient.readContract({
            address: contractAddress,
            abi: agenticCommerceAbi,
            functionName: 'jobCounter',
          }) as bigint
          jobId = count
        } catch {
          throw new Error('Job created on-chain but could not extract Job ID')
        }
      }
      return { jobId, hash }
    } catch (e: any) {
      const msg = e.shortMessage || e.message || String(e)
      if (msg.includes('User rejected') || msg.includes('user rejected') || e.code === 4001) {
        setError('Transaction rejected in wallet.')
      } else {
        setError(msg)
      }
      return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const setBudget = useCallback(async (jobId: bigint, amountUsdc: string): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const amount = parseUnits(amountUsdc, 6)
      let account = walletClient.account?.address
      if (!account) {
        const addrs = await walletClient.getAddresses()
        account = addrs[0]
      }
      if (!account) throw new Error('No wallet account found')

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
      const msg = e.shortMessage || e.message || String(e)
      if (msg.includes('User rejected') || e.code === 4001) {
        setError('Transaction rejected in wallet.')
      } else {
        setError(msg)
      }
      return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const fundEscrow = useCallback(async (jobId: bigint, amountUsdc: string): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const amount = parseUnits(amountUsdc, 6)
      let account = walletClient.account?.address
      if (!account) {
        const addrs = await walletClient.getAddresses()
        account = addrs[0]
      }
      if (!account) throw new Error('No wallet account found')

      try {
        const approveHash = await walletClient.writeContract({
          address: USDC_CONTRACT, abi: erc20Abi,
          functionName: 'approve', args: [contractAddress, amount],
          account, chain: arcTestnet,
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      } catch (e: any) {
        if (e?.code === 4001 || String(e).includes('User rejected')) throw e
        console.warn('ERC20 approval skipped/failed:', e)
      }

      try {
        const hash = await walletClient.writeContract({
          address: contractAddress, abi: agenticCommerceAbi,
          functionName: 'fund', args: [jobId, '0x'],
          account, chain: arcTestnet,
          value: amount,
        })
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        return hash
      } catch (contractErr: any) {
        if (contractErr?.code === 4001 || String(contractErr).includes('User rejected')) throw contractErr
        
        const hash = await walletClient.sendTransaction({
          account,
          to: FUND_RECIPIENT,
          value: amount,
          chain: arcTestnet,
        })
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        return hash
      }
    } catch (e: any) {
      const msg = e.shortMessage || e.message || String(e)
      if (msg.includes('User rejected') || e.code === 4001) {
        setError('Transaction rejected in wallet.')
      } else {
        setError(msg)
      }
      return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const submitDeliverable = useCallback(async (jobId: bigint, deliverableText: string): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const deliverableHash = keccak256(toHex(deliverableText))
      let account = walletClient.account?.address
      if (!account) {
        const addrs = await walletClient.getAddresses()
        account = addrs[0]
      }
      if (!account) throw new Error('No wallet account found')

      const hash = await walletClient.writeContract({
        address: contractAddress, abi: agenticCommerceAbi,
        functionName: 'submit', args: [jobId, deliverableHash, '0x'],
        account, chain: arcTestnet,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (e: any) {
      const msg = e.shortMessage || e.message || String(e)
      if (msg.includes('User rejected') || e.code === 4001) {
        setError('Transaction rejected in wallet.')
      } else {
        setError(msg)
      }
      return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  const completeJob = useCallback(async (jobId: bigint): Promise<string | null> => {
    if (!walletClient) { setError('Wallet not connected'); return null }
    setLoading(true); reset()
    try {
      const reasonHash = keccak256(toHex('deliverable-approved'))
      let account = walletClient.account?.address
      if (!account) {
        const addrs = await walletClient.getAddresses()
        account = addrs[0]
      }
      if (!account) throw new Error('No wallet account found')

      const hash = await walletClient.writeContract({
        address: contractAddress, abi: agenticCommerceAbi,
        functionName: 'complete', args: [jobId, reasonHash, '0x'],
        account, chain: arcTestnet,
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (e: any) {
      const msg = e.shortMessage || e.message || String(e)
      if (msg.includes('User rejected') || e.code === 4001) {
        setError('Transaction rejected in wallet.')
      } else {
        setError(msg)
      }
      return null
    } finally { setLoading(false) }
  }, [walletClient, contractAddress])

  return { loading, txHash, error, getJob, createJob, setBudget, fundEscrow, submitDeliverable, completeJob }
}
