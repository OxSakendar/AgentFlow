import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// 1. Install solc if not available
try {
  execSync('node -e "require(\'solc\')"', { stdio: 'ignore' })
  console.log('solc already installed.')
} catch (e) {
  console.log('Installing solc...')
  execSync('cmd /c npm install --save-dev solc', { stdio: 'inherit' })
}

// Dynamically import solc after installing it
const solcModule = await import('solc')
const solc = solcModule.default

const sourcePath = path.resolve('AgentFlow.sol')
const source = fs.readFileSync(sourcePath, 'utf8')

const input = {
  language: 'Solidity',
  sources: {
    'AgentFlow.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    },
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}

console.log('Compiling contract...')
const output = JSON.parse(solc.compile(JSON.stringify(input)))

if (output.errors) {
  let hasErrors = false
  for (const err of output.errors) {
    console.error(err.formattedMessage)
    if (err.severity === 'error') {
      hasErrors = true
    }
  }
  if (hasErrors) {
    process.exit(1)
  }
}

const contract = output.contracts['AgentFlow.sol']['AgentFlow']
const abi = contract.abi
const bytecode = contract.evm.bytecode.object

const destDir = path.resolve('src/lib')
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

const destPath = path.join(destDir, 'AgentFlowArtifact.ts')
const fileContent = `// Generated automatically by compile.js - DO NOT EDIT MANUALLY
export const AgentFlowABI = ${JSON.stringify(abi, null, 2)} as const;

export const AgentFlowBytecode = "0x${bytecode}" as const;
`

fs.writeFileSync(destPath, fileContent, 'utf8')
console.log(`Successfully generated artifact at ${destPath}`)
