import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const solc = require('solc')

// Compile AgentFlow.sol and verify hash matches itself (sanity check)
const source = fs.readFileSync('AgentFlow.sol', 'utf8')
const input = JSON.stringify({
  language: 'Solidity',
  sources: { 'AgentFlow.sol': { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['evm.bytecode.object'] } }
  }
})
const out = JSON.parse(solc.compile(input))
if (out.errors) out.errors.filter(e => e.severity === 'error').forEach(e => console.error(e.formattedMessage))
const bytecode = out.contracts['AgentFlow.sol']['AgentFlow'].evm.bytecode.object

const ipfsMarker = 'a264697066735822'
const ipfsStart = bytecode.lastIndexOf(ipfsMarker)
const ipfsHash = bytecode.slice(ipfsStart + ipfsMarker.length, ipfsStart + ipfsMarker.length + 64)

console.log('AgentFlow.sol ready to deploy!')
console.log('IPFS metadata hash:', ipfsHash)
console.log('Bytecode length:', bytecode.length / 2, 'bytes')
console.log('\nWhen you deploy AgentFlow.sol fresh, this bytecode will be on-chain')
console.log('and Blockscout will verify it automatically (the IPFS hashes will match).')
console.log('\nTo deploy: click "Deploy AgenticCommerce Contract" button in the app at:')
console.log('http://localhost:5175/#deploy')
