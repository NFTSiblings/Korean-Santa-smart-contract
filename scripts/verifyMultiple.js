const logErrors = false;
const contracts = { // Goerli
    Diamond: {
        address: "0x4EefDf2217523873aA34f20289E9545de03c038e",
        arguments: ["0xC38Bd9aE7ceeFA705579B71c0295Eb532d6B75D3"]
    },
    DiamondInit: { address: "0x0470ee1b40aB769C09587Db379662f7972543A28" },
    DiamondCutFacet: { address: "0xC38Bd9aE7ceeFA705579B71c0295Eb532d6B75D3" },
    DiamondLoupeFacet: { address: "0xD470198BF69e77df0887Da5e5300C945A56F9aE0" },
    AdminPauseFacet: { address: "0x326625BB25A27e24415D80448862ef876d4A4b80" },
    AdminPrivilegesFacet: { address: "0x33d110b29E64F88374dceD2B6d2C66328F7428A0" },
    ERC165Facet: { address: "0xE723DF1C9156bA14f795C320214E22df0d0939D6" },
}

////////////////////////////////////////////////////////////

async function main() {
    for (contract in contracts) {
        console.log("Verifying " + contract + " at " + contracts[contract].address)

        try {

            await hre.run("verify:verify", {
                address: contracts[contract].address,
                constructorArguments: contracts[contract].arguments
            })

        } catch (err) {

            if (logErrors) console.error("Failed to verify " + contract)

        }
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})