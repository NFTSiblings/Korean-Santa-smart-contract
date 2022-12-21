const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect, assert } = require("chai")
const { ethers } = require("hardhat")

beforeEach(async () => {
    [deployer] = await ethers.getSigners()
    diamondAddress = await deployDiamond()

    DiamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    AdminPrivilegesFacet = await ethers.getContractAt('AdminPrivilegesFacet', diamondAddress)
    ERC165Facet = await ethers.getContractAt('ERC165Facet', diamondAddress)
    TokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
})

describe("Diamond Deployment", () => {
    it("Correctly sets the contract owner", async () => {
        expect(await AdminPrivilegesFacet.owner()).to.equal(deployer.address)
    })

    it("Correctly adds DiamondCutFacet", async () => {
        // Checking that a facet exists for the diamondCut function
        const diamondCutFunctionSelector = "0x1f931c1c"
        expect(await DiamondLoupeFacet.facetAddress(diamondCutFunctionSelector))
        .not.to.be.equal(ethers.constants.AddressZero)
    })
})

describe("Initialisation", () => {
    it("All facets are added", async () => {
        facetAddresses = []
        for (address of await DiamondLoupeFacet.facetAddresses()) {
            facetAddresses.push(address)
        }
        assert.equal(facetAddresses.length, 6)
    })

    it("AdminPrivilegesFacet is initialised correctly", async () => {
        admin = "0x885Af893004B4405Dc18af1A4147DCDCBdA62b50"
        expect(await AdminPrivilegesFacet.isAdmin(admin)).to.equal(true)
    })

    it("ERC165Facet is initialised correctly", async () => {
        interfaceIds = ["0x01ffc9a7", "0x7f5828d0", "0x2a55205a", "0x80ac58cd", "0x5b5e139f", "0x48e2b093", "0x1f931c1c"]

        for (id of interfaceIds) {
            expect(await ERC165Facet.supportsInterface(id)).to.equal(true);
        }
    })
})