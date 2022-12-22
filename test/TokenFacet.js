const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect, assert } = require("chai")
const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers");

beforeEach(async () => {
    [deployer, addr1] = await ethers.getSigners()
    diamondAddress = await deployDiamond()

    TokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
})

describe("TokenFacet", () => {
    describe("Admin Functions", () => {
        it("`reserve` function is only callable by contract admins", async () => {
            expect(await TokenFacet.reserve(deployer.address, 1))
            .not.to.be.reverted
    
            await expect(TokenFacet.connect(addr1).reserve(addr1.address, 1))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("`setUri` function is only callable by contract admins", async () => {
            expect(await TokenFacet.setUri("some uri"))
            .not.to.be.reverted
    
            await expect(TokenFacet.connect(addr1).setUri("some uri"))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("`beginMintingPhase` function is only callable by contract admins", async () => {
            expect(await TokenFacet.beginMintingPhase())
            .not.to.be.reverted
    
            await expect(TokenFacet.connect(addr1).beginMintingPhase())
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
    })
    
    describe("Public Mint Function", () => {
        it("Not callable before claim period has begun", async () => {
            await expect(TokenFacet.connect(addr1).mint())
            .to.be.revertedWith("TokenFacet: minting is not available now")
        })
        it("Callable during claim period", async () => {
            await TokenFacet.beginMintingPhase()
            expect(await TokenFacet.connect(addr1).mint())
            .not.to.be.reverted
        })
        it("Not callable after claim period has expired", async () => {
            await TokenFacet.beginMintingPhase()
            await time.increase(86401)
            await expect(TokenFacet.connect(addr1).mint())
            .to.be.revertedWith("TokenFacet: minting is not available now")
        })
        it("A single wallet may not mint more than once", async () => {
            await TokenFacet.beginMintingPhase()
    
            await TokenFacet.connect(addr1).mint()
    
            await expect(TokenFacet.connect(addr1).mint())
            .to.be.revertedWith("TokenFacet: this address has already minted")
        })
        it("Mint function correctly creates a new token", async () => {
            await TokenFacet.beginMintingPhase()
    
            await TokenFacet.connect(addr1).mint()
    
            expect(await TokenFacet.balanceOf(addr1.address, 0))
            .to.equal(1)
        })
    })
    
    describe("Transferring tokens", () => {
        it("Non-admins may not transfer tokens", async () => {
            await TokenFacet.reserve(addr1.address, 1)
    
            await expect(
                TokenFacet.connect(addr1).safeTransferFrom(
                    addr1.address,
                    deployer.address,
                    0,
                    1,
                    []
                )
            )
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
    
        it("Admins may transfer tokens", async () => {
            await TokenFacet.reserve(deployer.address, 1)
    
            expect(
                await TokenFacet.safeTransferFrom(
                    deployer.address,
                    addr1.address,
                    0,
                    1,
                    []
                )
            )
            .not.to.be.reverted
        })
    })
})