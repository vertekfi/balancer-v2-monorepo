import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import WeightedPool from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPool';
import { fp, fromFp, toFp } from '@balancer-labs/v2-helpers/src/numbers';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { WeightedPoolType } from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';
import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { Contract } from 'ethers';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import Token from '@balancer-labs/v2-helpers/src/models/tokens/Token';
import { expect } from 'chai';
import { formatEther } from 'ethers/lib/utils';
import { calcOutGivenIn } from '@balancer-labs/v2-helpers/src/models/pools/weighted/math';
import { expectEqualWithError } from '@balancer-labs/v2-helpers/src/test/relativeError';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

describe('WeightedRateProviders', function () {
  let tokens: TokenList;
  let owner: SignerWithAddress;
  let cGoldRateProvider: Contract;
  let pool: WeightedPool;

  // CGOLD token
  let CGOLD: Token;
  let BUSD: Token;

  // Test price for 1oz of gold
  const PRICE_ONE_OZ_OF_GOLD = toFp(2000); // $2000

  // Gold uses "Troy" ounce instead of 28g ounces
  const GRAMS_IN_ONE_TROY_OUNCE = toFp(31.1035);

  // Token is to be: 1 CGOLD = 1g of gold
  // So 1 / 31.1035 = 0.0321507226
  const CGOLD_RATIO_TO_GOLD = toFp(1).div(GRAMS_IN_ONE_TROY_OUNCE); // TODO: may need to normalize this

  // Given $2000 this should be 64.3014452
  const CGOLD_TARGET_PRICE = CGOLD_RATIO_TO_GOLD.mul(PRICE_ONE_OZ_OF_GOLD);

  // Weights and balances set for 80/20 going for ~$64.30 CGOLD token value at start
  const WEIGHTS = [80, 20];

  // $10k in * 0.8 = 8000 / 64.3(target price) = 124.4167.. initial balance in
  // using calcOutGivenIn actual amount to use for precision is ~121.9 = 64.303402...
  // Target price division results in 64.301445..., close enough
  const initialBalances = [fp(121.9), fp(2000)];

  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);

  before('setup signers', async () => {
    [owner] = await ethers.getSigners();
  });

  sharedBeforeEach('deploy tokens', async () => {
    tokens = await TokenList.create(2, { sorted: true });
    CGOLD = tokens.first;
    BUSD = tokens.second;

    await CGOLD.mint(owner, initialBalances[0]);
    await BUSD.mint(owner, initialBalances[1]);
  });

  sharedBeforeEach('deploy pool', async () => {
    tokens = await TokenList.create(2, { sorted: true });
    cGoldRateProvider = await deploy('v2-pool-utils/MockRateProvider');

    pool = await WeightedPool.create({
      poolType: WeightedPoolType.WEIGHTED_POOL,
      tokens,
      weights: WEIGHTS,
      swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
      rateProviders: [cGoldRateProvider, ZERO_ADDRESS], // rate is concerned with CGOLD -> BUSD, so BUSD does not need a provider
    });

    // setRate before init, since init will set initial athRate
    await cGoldRateProvider.mockRate(fp(CGOLD_RATIO_TO_GOLD));

    await pool.init({ initialBalances, recipient: owner });
  });

  it('should add initial liquidity close to target price', async () => {
    await cGoldRateProvider.mockRate(fp(CGOLD_RATIO_TO_GOLD));

    const [poolTokens, normalizedWeights] = await Promise.all([
      pool.vault.getPoolTokens(pool.poolId),
      pool.getNormalizedWeights(),
    ]);

    const amountOut = fp(
      calcOutGivenIn(poolTokens.balances[0], normalizedWeights[0], poolTokens.balances[1], normalizedWeights[1], fp(1))
    );

    expectEqualWithError(amountOut, fp(CGOLD_TARGET_PRICE), 0.001);
  });

  it('updates the rate provided', async () => {
    // You will want to use rateProviders for some assets in your pool when you have rates that directly convert
    // between the assets. If we have tokens A and B and a rate provider that gives the price of A WITH RESPECT TO B, then the
    // rateProvider corresponding to token A would get the A:B price feed, and the rateProvider corresponding to token B would be the zero address.
    // The rate provider will need to get the CGOLD to BUSD price feed.
    //
    // How does this influence the pricing in the pool? Without updating pool balances?
    // What contract shows how the provided rate effects the result in/out for trades?
    //
    // Protocol fees are still taken. Tokens with a rate provider can increase pool value through external means. (eg. Price of gold goes up, value of CGOLD goes up relative to BUSD)
    //
    // _getRateFactor() is called on like 300 of WeightedPoolProtocolFees, which is where a providers `getRate()` is actually called.
    // This happens as a part of calculating protocol fees that are a result in "yield"(external means (possibly)increasing the value of the pool)
    //
    // End goal is how to correlate price of 1 gram of gold to BUSD. Weights factor in? When how why where does this effect pool pricing?

    // Need to get the gold price, determine what 1 gram is worth, and return how that correlates to busd. (1 / 1g price?)
    // _getRateProduct() gets multilplied sum for each tokens provider.getRate()
    // _getYieldProtocolFeesPoolPercentage() uses this to see if the current rate product > all time high rate product, to assess charging fees
    // How does this effect balances or pricing though?
    //
    // onInitialPool sets the init athRate
    //  if (!_isExemptFromYieldProtocolFees()) _updateATHRateProduct(_getRateProduct(_getNormalizedWeights()));
    // So getRate() will be called from pool initialization, through _getRateProduct()
    // _beforeJoinExit() also touches this directly
    //
    // * outGiven is still only concerned with pool balances and does not account for rate items...
    // 1 cgolg should output the correlated busd value according to how much 1g gold is...
    //
    // await cGoldRateProvider.mockRate();

    console.log(formatEther(await pool.getATHRateProduct()));
  });
});
