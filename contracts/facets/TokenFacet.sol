// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**************************************************************\
 * TokenFacetLib authored by Sibling Labs
 * Version 0.1.0
 * 
 * This library is designed to work in conjunction with
 * TokenFacet - it facilitates diamond storage and shared
 * functionality associated with TokenFacet.
/**************************************************************/

library TokenFacetLib {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("tokenfacet.storage");

    struct state {
        mapping(address => uint8) minted;
        bool mintActive;
    }

    /**
    * @dev Return stored state struct.
    */
    function getState() internal pure returns (state storage _state) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            _state.slot := position
        }
    }
}

/**************************************************************\
 * TokenFacet authored by Sibling Labs
 * Version 0.1.0
 * 
 * As part of KOREAN-SANTA Diamond
/**************************************************************/

import { GlobalState } from "../libraries/GlobalState.sol";
import { ERC1155, ERC1155Lib } from "../ancillary/ERC1155DiamondStorage.sol";

contract TokenFacet is ERC1155 {
    function minted(address addr) external view returns (bool) {
        return TokenFacetLib.getState().minted[addr] == 1;
    }

    function mint() external {
        TokenFacetLib.state storage s = TokenFacetLib.getState();

        require(TokenFacetLib.getState().mintActive, "TokenFacet: minting is not available now");
        require(s.minted[msg.sender] == 0, "TokenFacet: this address has already minted");

        super._mint(msg.sender, 0, 1, "");
        s.minted[msg.sender] = 1;
    }

    function setUri(string memory u) external {
        GlobalState.requireCallerIsAdmin();
        ERC1155Lib.getState()._uri = u;
    }

    // TEST FUNCTIONS - MUST BE REMOVED PRIOR TO MAINNET DEPLOYMENT

    function resetMinted(address addr) external {
        TokenFacetLib.getState().minted[addr] = 0;
    }
}