// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@balancer-labs/v2-interfaces/contracts/standalone-utils/IwBNBx.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";

import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Address.sol";
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/SafeERC20.sol";

import "./IBaseRelayerLibrary.sol";

/**
 * @title BnbxWrapping
 * @notice Allows users to wrap and unwrap BNBx
 * @dev All functions must be payable so they can be called from a multicall involving ETH
 */
abstract contract BNBxWrapping is IBaseRelayerLibrary {
    using Address for address payable;
    using SafeERC20 for IERC20;

    IERC20 private immutable _BNBx;
    IwBNBx private immutable _wrappedBNBx;

    /**
     * @dev The zero address may be passed as wBNBx to safely disable this module
     * @param wBNBx - the address of Lido's wrapped wBNBx contract
     */
    constructor(IERC20 wBNBx) {
        // Safely disable BNBx wrapping if no address has been passed for wBNBx
        _BNBx = wBNBx != IERC20(0) ? IwBNBx(address(wBNBx)).bnbx() : IERC20(0);
        _wrappedBNBx = IwBNBx(address(wBNBx));
    }

    function wrapBNBx(
        address sender,
        address recipient,
        uint256 amount,
        uint256 outputReference
    ) external payable {
        if (_isChainedReference(amount)) {
            amount = _getChainedReferenceValue(amount);
        }

        // The wrap caller is the implicit token sender, so if the goal is for the tokens
        // to be sourced from outside the relayer, we must first pull them here.
        if (sender != address(this)) {
            require(sender == msg.sender, "Incorrect sender");
            _pullToken(sender, _BNBx, amount);
        }

        IERC20(_BNBx).safeApprove(address(_wrappedBNBx), amount);
        uint256 result = IwBNBx(_wrappedBNBx).wrap(amount);

        if (recipient != address(this)) {
            IERC20(_wrappedBNBx).safeTransfer(recipient, result);
        }

        if (_isChainedReference(outputReference)) {
            _setChainedReferenceValue(outputReference, result);
        }
    }

    function unwrapBNBx(
        address sender,
        address recipient,
        uint256 amount,
        uint256 outputReference
    ) external payable {
        if (_isChainedReference(amount)) {
            amount = _getChainedReferenceValue(amount);
        }

        // The unwrap caller is the implicit token sender, so if the goal is for the tokens
        // to be sourced from outside the relayer, we must first pull them here.
        if (sender != address(this)) {
            require(sender == msg.sender, "Incorrect sender");
            _pullToken(sender, _wrappedBNBx, amount);
        }

        // No approval is needed here, as wBNBx is burned directly from the relayer's account
        uint256 result = _wrappedBNBx.unwrap(amount);

        if (recipient != address(this)) {
            IERC20(_BNBx).safeTransfer(recipient, result);
        }

        if (_isChainedReference(outputReference)) {
            _setChainedReferenceValue(outputReference, result);
        }
    }
}
