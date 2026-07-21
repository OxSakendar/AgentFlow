import fs from 'fs'
import path from 'path'

const CONTRACT_ADDRESS = '0xcf850AFb3f4900b898A180D8F6Eb6d52bf6dA9FB'
const BLOCKSCOUT_API = 'https://testnet.arcscan.app/api'

const sourceCode = fs.readFileSync(path.resolve('AgentFlow.sol'), 'utf8')

console.log('Submitting verification for AgentFlow...')
console.log(`Contract: ${CONTRACT_ADDRESS}`)

const params = new URLSearchParams({
  module: 'contract',
  action: 'verifysourcecode',
  contractaddress: CONTRACT_ADDRESS,
  sourceCode: sourceCode,
  codeformat: 'solidity-single-file',
  contractname: 'AgentFlow',
  compilerversion: 'v0.8.36+commit.8a079791',
  optimizationUsed: '1',
  runs: '200',
  licenseType: '3',       // MIT = 3
  // Constructor args (ABI-encoded): paymentToken + treasury
  // Extracted from creation bytecode tail
  constructorArguements: '000000000000000000000000360000000000000000000000000000000000000000000000000000000000000061ad9d231df0a097ecd9ca04712ed604aba5c083'
})

const res = await fetch(BLOCKSCOUT_API, {
  method: 'POST',
  body: params
})

const data = await res.json()
console.log('Submit response:', JSON.stringify(data, null, 2))

if (data.status === '1') {
  const guid = data.result
  console.log(`\nGUID received: ${guid}`)
  console.log('Polling for verification result...')

  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const pollParams = new URLSearchParams({
      module: 'contract',
      action: 'checkverifystatus',
      guid: guid
    })
    const pollRes = await fetch(`${BLOCKSCOUT_API}?${pollParams}`)
    const pollData = await pollRes.json()
    console.log(`  [${i+1}] Status: ${pollData.result}`)
    if (pollData.result === 'Pass - Verified') {
      console.log('\n✅ AgentFlow contract VERIFIED successfully on Arc Testnet!')
      console.log(`🔗 View at: https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}#code`)
      break
    }
    if (pollData.result && !pollData.result.includes('Pending')) {
      console.log('Final status:', pollData.result)
      break
    }
  }
} else {
  console.error('❌ Verification submission failed:', data.message)
}
