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

import "@balancer-labs/v2-interfaces/contracts/standalone-utils/IProtocolFeePercentagesProvider.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";

import "@balancer-labs/v2-pool-utils/contracts/factories/BasePoolFactory.sol";
import "@balancer-labs/v2-pool-utils/contracts/factories/FactoryWidePauseWindow.sol";
import "@balancer-labs/v2-pool-utils/contracts/controllers/AssetManagedLBPController.sol";

import "./AssetManagedLiquidityBootstrappingPool.sol";

contract UnseededLiquidityBootstrappingPoolFactory is BasePoolFactory, FactoryWidePauseWindow {
    constructor(IVault vault, IProtocolFeePercentagesProvider protocolFeeProvider)
        BasePoolFactory(vault, protocolFeeProvider, type(AssetManagedLiquidityBootstrappingPool).creationCode)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function create(
        AssetManagedLiquidityBootstrappingPool.NewPoolParams calldata poolParams,
        BasePoolController.BasePoolRights calldata basePoolRights,
        address manager
    ) external returns (address pool) {
        BasePoolController poolController = new AssetManagedLBPController(
            basePoolRights,
            getVault(),
            poolParams.projectToken,
            poolParams.reserveToken,
            manager
        );

        (uint256 pauseWindowDuration, uint256 bufferPeriodDuration) = getPauseConfiguration();

        pool = _create(
            abi.encode(
                poolParams,
                getVault(),
                pauseWindowDuration,
                bufferPeriodDuration,
                address(poolController), // owner
                address(poolController) // asset manager
            )
        );

        poolController.initialize(pool);
    }
}