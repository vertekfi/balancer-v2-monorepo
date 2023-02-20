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

pragma solidity >=0.7.0 <0.9.0;

import "../solidity-utils/openzeppelin/IERC20.sol";

// solhint-disable-next-line max-line-length
// Based on https://github.com/lidofinance/lido-dao/blob/816bf1d0995ba5cfdfc264de4acda34a7fe93eba/contracts/0.4.24/Lido.sol

interface IwBNBx is IERC20 {
    function bnbx() external returns (IERC20);

    /**
     * @notice Exchanges BNBx to wBNBx
     * @param bnbxAmount amount of BNBx to wrap in exchange for wBNBx
     * @dev Requirements:
     *  - `bnbxAmount` must be non-zero
     *  - msg.sender must approve at least `bnbxAmount` BNBx to this
     *    contract.
     *  - msg.sender must have at least `bnbxAmount` of BNBx.
     * User should first approve bnbxAmount to the wBNBx contract
     * @return Amount of wBNBx user receives after wrap
     */
    function wrap(uint256 bnbxAmount) external returns (uint256);

    /**
     * @notice Exchanges BNBx to wBNBx
     * @param wBNBxAmount amount of wBNBx to uwrap in exchange for BNBx
     * @dev Requirements:
     *  - `wBNBxAmount` must be non-zero
     *  - msg.sender must have at least `wBNBxAmount` wBNBx.
     * @return Amount of BNBx user receives after unwrap
     */
    function unwrap(uint256 wBNBxAmount) external returns (uint256);
}
