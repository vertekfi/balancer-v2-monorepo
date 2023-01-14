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

import "./WeightedPoolProtocolFees.sol";
import "./BaseWeightedPool.sol";

contract WeightedTwoTokenFeePool is BaseWeightedPool, WeightedPoolProtocolFees {
    using FixedPoint for uint256;

    struct NewPoolParams {
        string name;
        string symbol;
        IERC20[] tokens;
        uint256[] normalizedWeights;
        IRateProvider[] rateProviders;
        address[] assetManagers;
        uint256 swapFeePercentage;
    }

    struct FeePoolConfig {
        uint256 buyFee;
        uint256 sellFee;
        uint256 bptJoinFee; // not sure if this something to keep
        uint256 bptExitFee;
        address coreToken;
        address feeReceiver;
    }

    uint256 private constant _MAX_TOKENS = 2;
    uint256 private constant _MAX_BUY_FEE = 10000;
    uint256 private constant _MAX_SELL_FEE = 25000;
    uint256 private constant _MAX_TOTAL_FEE = _MAX_BUY_FEE + _MAX_SELL_FEE;
    uint256 private constant _MAX_BPT_JOIN_FEE = 10000;
    uint256 private constant _MAX_BPT_EXIT_FEE = 10000;
    uint256 private constant _FEE_DENOMINATOR = 1000;

    FeePoolConfig private _poolConfig;

    IERC20 internal immutable _token0;
    IERC20 internal immutable _token1;

    address internal immutable _coreToken;
    uint256 internal immutable _coreTokenIndex;

    // All token balances are normalized to behave as if the token had 18 decimals. We assume a token's decimals will
    // not change throughout its lifetime, and store the corresponding scaling factor for each at construction time.
    // These factors are always greater than or equal to one: tokens with more than 18 decimals are not supported.

    uint256 internal immutable _scalingFactor0;
    uint256 internal immutable _scalingFactor1;

    uint256 internal immutable _normalizedWeight0;
    uint256 internal immutable _normalizedWeight1;

    constructor(
        NewPoolParams memory params,
        IVault vault,
        IProtocolFeePercentagesProvider protocolFeeProvider,
        uint256 pauseWindowDuration,
        uint256 bufferPeriodDuration,
        address owner,
        FeePoolConfig memory poolConfig
    )
        BaseWeightedPool(
            vault,
            params.name,
            params.symbol,
            params.tokens,
            params.assetManagers,
            params.swapFeePercentage,
            pauseWindowDuration,
            bufferPeriodDuration,
            owner,
            false
        )
        ProtocolFeeCache(
            protocolFeeProvider,
            ProviderFeeIDs({ swap: ProtocolFeeType.SWAP, yield: ProtocolFeeType.YIELD, aum: ProtocolFeeType.AUM })
        )
        WeightedPoolProtocolFees(params.tokens.length, params.rateProviders)
    {
        _require(params.tokens.length == 2, Errors.MAX_TOKENS);
        InputHelpers.ensureInputLengthMatch(_MAX_TOKENS, params.normalizedWeights.length);

        // validate config
        _require(poolConfig.coreToken != address(0), Errors.ZERO_TOKEN);
        require(poolConfig.buyFee <= _MAX_BUY_FEE, "Buy fee too high");
        require(poolConfig.sellFee <= _MAX_SELL_FEE, "Sell fee too high");
        require(poolConfig.bptJoinFee <= _MAX_BPT_JOIN_FEE, "BPT join fee too high");
        require(poolConfig.bptExitFee <= _MAX_BPT_EXIT_FEE, "BPT exit fee too high");
        require(poolConfig.feeReceiver != address(0), "Fee receiver not set");

        _poolConfig = poolConfig;

        // Set tokens
        _coreToken = poolConfig.coreToken;
        _coreTokenIndex = address(params.tokens[0]) == address(poolConfig.coreToken) ? 0 : 1;

        _token0 = params.tokens[0]; // these zero checked somewhere back in the chain?
        _token1 = params.tokens[1];

        _scalingFactor0 = _computeScalingFactor(params.tokens[0]);
        _scalingFactor1 = _computeScalingFactor(params.tokens[1]);

        // Set weights
        uint256 normalizedWeight0 = params.normalizedWeights[0];
        uint256 normalizedWeight1 = params.normalizedWeights[1];
        _require(normalizedWeight0 >= WeightedMath._MIN_WEIGHT, Errors.MIN_WEIGHT);
        _require(normalizedWeight1 >= WeightedMath._MIN_WEIGHT, Errors.MIN_WEIGHT);
        // Ensure that the normalized weights sum to ONE
        _require(normalizedWeight0.add(normalizedWeight1) == FixedPoint.ONE, Errors.NORMALIZED_WEIGHT_INVARIANT);

        _normalizedWeight0 = normalizedWeight0;
        _normalizedWeight1 = normalizedWeight1;
    }

    function getPoolConfig() public view returns (FeePoolConfig memory) {
        return _poolConfig;
    }

    // Swap overrides

    function _onSwapGivenIn(
        SwapRequest memory swapRequest,
        uint256 currentBalanceTokenIn,
        uint256 currentBalanceTokenOut
    ) internal override returns (uint256) {
        uint256 amountOut = super._onSwapGivenIn(swapRequest, currentBalanceTokenIn, currentBalanceTokenOut);
        (uint256 feeAmount, ) = getSwapFeeForAction(swapRequest, _poolConfig);

        return amountOut - feeAmount;
    }

    function getSwapFeeForAction(SwapRequest memory swapRequest, FeePoolConfig memory feeConfig)
        public
        pure
        returns (uint256 feeAmount, bool isSell)
    {
        // Is it a buy or sell of the token
        // GivenIn so if token in is core token then we know it's a sell
        isSell = address(swapRequest.tokenIn) == feeConfig.coreToken;
        uint256 fee = isSell ? feeConfig.sellFee : feeConfig.buyFee;

        // What are the "scaling" concerns here?
        // Base contract will scale down before going back to the vault
        feeAmount = swapRequest.amount.mulUp(fee).divDown(_FEE_DENOMINATOR);
    }

    // Join/Exit overrides

    function _onInitializePool(
        bytes32 poolId,
        address sender,
        address recipient,
        uint256[] memory scalingFactors,
        bytes memory userData
    ) internal virtual override returns (uint256, uint256[] memory) {
        // TODO: Any other setup concerns here?

        // Initialize `_athRateProduct` if the Pool will pay protocol fees on yield.
        // Not initializing this here properly will cause all joins/exits to revert.
        if (!_isExemptFromYieldProtocolFees()) _updateATHRateProduct(_getRateProduct(_getNormalizedWeights()));

        return super._onInitializePool(poolId, sender, recipient, scalingFactors, userData);
    }

    /**
     * @dev Called after any regular join or exit operation. Empty by default, but derived contracts
     * may choose to add custom behavior at these steps. This often has to do with protocol fee processing.
     *
     * If performing a join operation, balanceDeltas are the amounts in: otherwise they are the amounts out.
     *
     * This function is free to mutate the `preBalances` array.
     */
    function _afterJoinExit(
        uint256 preJoinExitInvariant,
        uint256[] memory preBalances,
        uint256[] memory balanceDeltas,
        uint256[] memory normalizedWeights,
        uint256 preJoinExitSupply,
        uint256 postJoinExitSupply
    ) internal virtual override {
        // solhint-disable-previous-line no-empty-blocks
    }

    // Derived contracts may call this to update state after a join or exit.
    function _updatePostJoinExit(uint256 postJoinExitInvariant)
        internal
        override(BaseWeightedPool, WeightedPoolProtocolFees)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @notice Returns the effective BPT supply.
     *
     * @dev This would be the same as `totalSupply` however the Pool owes debt to the Protocol in the form of unminted
     * BPT, which will be minted immediately before the next join or exit. We need to take these into account since,
     * even if they don't yet exist, they will effectively be included in any Pool operation that involves BPT.
     *
     * In the vast majority of cases, this function should be used instead of `totalSupply()`.
     */
    function getActualSupply() public view returns (uint256) {
        uint256 supply = totalSupply();

        (uint256 protocolFeesToBeMinted, ) = _getPreJoinExitProtocolFees(
            getInvariant(),
            _getNormalizedWeights(),
            supply
        );

        return supply.add(protocolFeesToBeMinted);
    }

    /**
     * @dev Returns the normalized weight of `token`. Weights are fixed point numbers that sum to FixedPoint.ONE.
     */
    function _getNormalizedWeight(IERC20 token) internal view override returns (uint256) {
        // prettier-ignore
        if (token == _token0) { return _normalizedWeight0; }
        else if (token == _token1) { return _normalizedWeight1; }
        else {
            _revert(Errors.INVALID_TOKEN);
        }
    }

    /**
     * @dev Returns all normalized weights, in the same order as the Pool's tokens.
     */
    function _getNormalizedWeights() internal view override returns (uint256[] memory) {
        uint256[] memory normalizedWeights = new uint256[](_MAX_TOKENS);
        normalizedWeights[0] = _normalizedWeight0;
        normalizedWeights[1] = _normalizedWeight1;
        return normalizedWeights;
    }

    function _getMaxTokens() internal pure virtual override returns (uint256) {
        return _MAX_TOKENS;
    }

    function _getTotalTokens() internal view virtual override returns (uint256) {
        return _MAX_TOKENS;
    }

    /**
     * @dev Returns the scaling factor for one of the Pool's tokens. Reverts if `token` is not a token registered by the
     * Pool.
     */
    function _scalingFactor(IERC20 token) internal view virtual override returns (uint256) {
        // prettier-ignore
        if (token == _token0) { return _getScalingFactor0(); }
        else if (token == _token1) { return _getScalingFactor1(); }
        else {
            _revert(Errors.INVALID_TOKEN);
        }
    }

    function _scalingFactors() internal view virtual override returns (uint256[] memory) {
        uint256[] memory scalingFactors = new uint256[](_MAX_TOKENS);
        scalingFactors[0] = _getScalingFactor0();
        scalingFactors[1] = _getScalingFactor1();
        return scalingFactors;
    }

    function _getScalingFactor0() internal view returns (uint256) {
        return _scalingFactor0;
    }

    function _getScalingFactor1() internal view returns (uint256) {
        return _scalingFactor1;
    }

    function _isOwnerOnlyAction(bytes32 actionId)
        internal
        view
        virtual
        override(BasePool, WeightedPoolProtocolFees)
        returns (bool)
    {
        return super._isOwnerOnlyAction(actionId);
    }
}
