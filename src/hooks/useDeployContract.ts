import { useState, useCallback } from 'react'
import type { createWalletClient } from 'viem'
import { arcTestnet } from '../lib/constants'
import { publicClient } from '../lib/utils'
import { AgentFlowABI, AgentFlowBytecode } from '../lib/AgentFlowArtifact'

export function useDeployContract(walletClient: ReturnType<typeof createWalletClient> | null) {
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setError(null)
    setTxHash(null)
    setContractAddress(null)
  }

  const deploy = useCallback(async (
    paymentToken: string,
    platformTreasury: string
  ): Promise<string | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }
    setLoading(true)
    reset()
    try {
      const [account] = await walletClient.getAddresses()
      
      const hash = await walletClient.deployContract({
        abi: AgentFlowABI,
        bytecode: AgentFlowBytecode,
        args: [paymentToken as `0x${string}`, platformTreasury as `0x${string}`],
        account,
        chain: arcTestnet,
      })
      setTxHash(hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (!receipt.contractAddress) {
        throw new Error('Transaction succeeded but did not return a contract address')
      }

      setContractAddress(receipt.contractAddress)
      return receipt.contractAddress
    } catch (e: any) {
      setError(e.shortMessage || e.message || String(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [walletClient])

  return {
    loading,
    txHash,
    contractAddress,
    error,
    deploy,
    reset,
  }
}
