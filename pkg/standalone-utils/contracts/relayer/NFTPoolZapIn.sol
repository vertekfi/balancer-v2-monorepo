// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";

// import "@balancer-labs/v2-solidity-utils/contracts/helpers/VaultHelpers.sol";

import "@balancer-labs/v2-interfaces/contracts/standalone-utils/INFTPool.sol";

import "./IBaseRelayerLibrary.sol";

/**
 * @title NFTPoolZapIn
 * @notice Allows users to automate the process of creating liquidity and then depositing into the
 * associated NFTPool pool for staking.
 * @dev
 * Since the relayer is not expected to hold user funds, we expect the user to be the recipient of any token transfers
 * from the Vault.
 *
 * All functions must be payable so they can be called from a multicall involving ETH
 */
abstract contract NFTPoolZapIn is IBaseRelayerLibrary {
    IVault private immutable _vault;

    constructor(IVault vault) {
        _vault = vault;
    }

    function zapIntoNFTPool(
        INFTPool nftPool,
        bytes32 poolId,
        address sender,
        address recipient
    ) external payable {
        // if (_isChainedReference(uAmount)) {
        //     uAmount = _getChainedReferenceValue(uAmount);
        // }
    }
}
