import type { Chain } from 'viem'

export const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
}

/** Permanent Create Job contract — do NOT change */
export const AGENTIC_COMMERCE_CONTRACT =
  '0x84c7579C7c0195570D1dE7aa58771925A41B5Ee4' as const

export const USDC_CONTRACT =
  '0x3600000000000000000000000000000000000000' as const

export const STATUS_NAMES = [
  'Open',
  'Funded',
  'Submitted',
  'Completed',
  'Rejected',
  'Expired',
] as const

export type JobStatus = (typeof STATUS_NAMES)[number]

export const STATUS_COLORS: Record<string, string> = {
  Open:      '#3b82f6',
  Funded:    '#8a4bff',
  Submitted: '#f59e0b',
  Completed: '#10b981',
  Rejected:  '#ef4444',
  Expired:   '#6b7280',
}

export const agenticCommerceAbi = [
  {
    name: 'createJob',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'provider',  type: 'address'  },
      { name: 'evaluator', type: 'address'  },
      { name: 'expiredAt', type: 'uint256'  },
      { name: 'description', type: 'string' },
      { name: 'hook',      type: 'address'  },
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }],
  },
  {
    name: 'setBudget',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId',     type: 'uint256' },
      { name: 'amount',    type: 'uint256' },
      { name: 'optParams', type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    name: 'fund',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'jobId',     type: 'uint256' },
      { name: 'optParams', type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    name: 'submit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId',       type: 'uint256' },
      { name: 'deliverable', type: 'bytes32' },
      { name: 'optParams',   type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    name: 'complete',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId',     type: 'uint256' },
      { name: 'reason',    type: 'bytes32' },
      { name: 'optParams', type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    name: 'jobCounter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'jobs',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      { name: 'id',          type: 'uint256'  },
      { name: 'client',      type: 'address'  },
      { name: 'provider',    type: 'address'  },
      { name: 'evaluator',   type: 'address'  },
      { name: 'description', type: 'string'   },
      { name: 'budget',      type: 'uint256'  },
      { name: 'expiredAt',   type: 'uint256'  },
      { name: 'status',      type: 'uint8'    },
      { name: 'hook',        type: 'address'  },
    ],
  },
  {
    name: 'getJob',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id',          type: 'uint256'  },
          { name: 'client',      type: 'address'  },
          { name: 'provider',    type: 'address'  },
          { name: 'evaluator',   type: 'address'  },
          { name: 'description', type: 'string'   },
          { name: 'budget',      type: 'uint256'  },
          { name: 'expiredAt',   type: 'uint256'  },
          { name: 'status',      type: 'uint8'    },
          { name: 'hook',        type: 'address'  },
        ],
      },
    ],
  },
  {
    name: 'JobCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true,  name: 'jobId',     type: 'uint256' },
      { indexed: true,  name: 'client',    type: 'address' },
      { indexed: true,  name: 'provider',  type: 'address' },
      { indexed: false, name: 'evaluator', type: 'address' },
      { indexed: false, name: 'expiredAt', type: 'uint256' },
      { indexed: false, name: 'hook',      type: 'address' },
    ],
  },
] as const

export const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',     type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

/** Permanent token fund recipient — do NOT change */
export const FUND_RECIPIENT =
  '0x0D67530F1bb7f4f8ca809f688f5cbA771140ec16' as const
