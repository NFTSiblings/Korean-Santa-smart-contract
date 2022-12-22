const diamondName = "KoreanSantaDiamond"
// set DiamondInit to the contract address of an existing initialiser contract,
// or set it to "deploy" to have the script deploy it, or set it to false to
// deploy without an intialiser contract.
const DiamondInit = "deploy"
const existingFacets = { // Goerli
  // if DiamondCutFacet is not present, it will be deployed
  DiamondCutFacet: "0xA4B7B1FeE93500eCDa0854C7D4953DBEF9FfE999",
  DiamondLoupeFacet: "0x6189F68F7274E5D8f3c00ED7743B0C5192908373",
  AdminPauseFacet: "0x5B87F5555a44e13DeC8fa824b2dcb4785E36f690",
  AdminPrivilegesFacet: "0xDf9Fba5f2F9C9dA9A65b873c6633d487F72438ba",
  ERC165Facet: "0xEa775654F0271fA9b0895B44724B5783d5118235",
  TokenFacet: "0xc9152C0303c2c49cf5bf80db917E7417fB5b16C9"
}
const excludeFunctions = {
  TokenFacet: [
    "supportsInterface(bytes4)"
  ]
}

////////////////////////////////////////////////////////////

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  let diamondCutFacet
  if (existingFacets.DiamondCutFacet) {
    // get existing deployed DiamondCutFacet
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', existingFacets.DiamondCutFacet)
    console.log('DiamondCutFacet exists at:', diamondCutFacet.address)
  } else {
    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    diamondCutFacet = await DiamondCutFacet.deploy()
    await diamondCutFacet.deployed()
    console.log('DiamondCutFacet deployed:', diamondCutFacet.address)
  }

  // deploy Diamond
  const Diamond = await ethers.getContractFactory(diamondName)
  const diamond = await Diamond.deploy(diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  let diamondInit
  if (ethers.utils.isAddress(DiamondInit)) {
    // get existing deployed DiamondInit contract
    diamondInit = await ethers.getContractAt('DiamondInit', DiamondInit)
    console.log('DiamondInit contract exists at:', diamondInit.address)
  } else if (DiamondInit == "deploy") {
    // deploy DiamondInit
    const NewInit = await ethers.getContractFactory('DiamondInit')
    diamondInit = await NewInit.deploy()
    await diamondInit.deployed()
    console.log('DiamondInit deployed:', diamondInit.address)
  }
  
  const cut = []
  for (const FacetName in existingFacets) {
    if (FacetName == "DiamondCutFacet") continue

    const facet = await ethers.getContractAt(FacetName, existingFacets[FacetName])
    console.log(`${FacetName} exists at ${facet.address}`)

    const remove = excludeFunctions[FacetName] ? excludeFunctions[FacetName] : [];

    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet).remove(remove)
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt

  // call to init function
  if (DiamondInit) {
    let functionCall = diamondInit.interface.encodeFunctionData('initAll')
    tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  } else {
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, [])
  }

  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond cut failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deployDiamond().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

exports.deployDiamond = deployDiamond