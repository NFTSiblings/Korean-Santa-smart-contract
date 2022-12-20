const facetName = "TokenFacet"
const Diamond = "0x4EefDf2217523873aA34f20289E9545de03c038e"
const DiamondInit = "0x0470ee1b40aB769C09587Db379662f7972543A28"
// const DiamondInit = false
const excludeFunctions = [
  "supportsInterface(bytes4)"
]

////////////////////////////////////////////////////////////////////////////

const { ethers } = require('hardhat')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function main() {
  const [deployer] = await ethers.getSigners()
  
  console.log("Deploying facet with the account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  ////////////////////////////////////////////////////////////////////////////
  
  const Facet = await ethers.getContractFactory(facetName)
  const facet = await Facet.deploy()
  await facet.deployed()
  
  console.log(`${facetName} deployed: ${facet.address}`)

  ////////////////////////////////////////////////////////////////////////////

  // get existing deployed DiamondInit contract
  let diamondInit
  if (DiamondInit) {
    diamondInit = await ethers.getContractAt('DiamondInit', DiamondInit)
    console.log('DiamondInit contract exists at:', diamondInit.address)
  }

  ////////////////////////////////////////////////////////////////////////////

  const cut = [{
    facetAddress: facet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(facet).remove(excludeFunctions)
  }]

  console.log('')
  console.log('Diamond Cut:', cut)

  ////////////////////////////////////////////////////////////////////////////

  const diamondCut = await ethers.getContractAt('IDiamondCut', Diamond)
  let tx
  let receipt

  // call to init function
  if (DiamondInit) {
    let functionCall = diamondInit.interface.encodeFunctionData('init' + facetName)
    tx = await diamondCut.diamondCut(cut, DiamondInit, functionCall)
  } else {
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, [])
  }

  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')

  ////////////////////////////////////////////////////////////////////////////

  console.log('Verifying new facet:')
  await hre.run("verify:verify", { address: facet.address })
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})