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
import { calcOutGivenIn, calculateInvariant } from '@balancer-labs/v2-helpers/src/models/pools/weighted/math';
import { expectEqualWithError } from '@balancer-labs/v2-helpers/src/test/relativeError';

describe('WeightedRateProviders', function () {
  let tokens: TokenList;
  let lp: SignerWithAddress;
  let rateProviders: Contract[];
  let cGoldRateProvider: Contract;
  let pool: WeightedPool;

  const MAX_TOKENS = 2;

  // CGOLD token
  let CGOLD: Token;

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
    [, lp] = await ethers.getSigners();
  });

  sharedBeforeEach('deploy pool', async () => {
    tokens = await TokenList.create(2, { sorted: true });
    rateProviders = await tokens.asyncMap(() => deploy('v2-pool-utils/MockRateProvider'));

    CGOLD = tokens.first;
    cGoldRateProvider = rateProviders[0];

    pool = await WeightedPool.create({
      poolType: WeightedPoolType.WEIGHTED_POOL,
      tokens,
      weights: WEIGHTS,
      swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
      rateProviders: rateProviders.map((r) => r.address),
    });

    await pool.init({ initialBalances, recipient: lp });
  });

  it('should add initial liquidity close to target price', async () => {
    const [poolTokens, normalizedWeights] = await Promise.all([
      pool.vault.getPoolTokens(pool.poolId),
      pool.getNormalizedWeights(),
    ]);

    const amountOut = calcOutGivenIn(
      poolTokens.balances[0],
      normalizedWeights[0],
      poolTokens.balances[1],
      normalizedWeights[1],
      fp(1)
    );

    // const invariant = calculateInvariant(poolTokens.balances, normalizedWeights);
    // console.log('invariant: ' + formatEther(invariant));

    expectEqualWithError(fp(amountOut), fp(CGOLD_TARGET_PRICE), 0.001);
  });
});
