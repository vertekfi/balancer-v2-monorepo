import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import WeightedPool from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPool';
import { fp, toFp } from '@balancer-labs/v2-helpers/src/numbers';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { WeightedPoolType } from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';
import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { Contract } from 'ethers';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import Token from '@balancer-labs/v2-helpers/src/models/tokens/Token';
import { expect } from 'chai';
import { parseUnits } from 'ethers/lib/utils';
import { range } from 'lodash';

describe('WeightedRateProviders', function () {
  let tokens: TokenList;
  let lp: SignerWithAddress;
  let rateProviders: Contract[];

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
  // const WEIGHTS = [parseUnits('0.8'), parseUnits('0.2')];
  const WEIGHTS = range(1000, 1000 + MAX_TOKENS);

  // $10k in * 0.8 = 8000 / 64.3 target price = 124.4167..
  const initialBalances = [fp(124.416796), fp(2000)];

  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);

  before('setup signers', async () => {
    [, lp] = await ethers.getSigners();
  });

  describe('deploying the pool', async () => {
    let pool: WeightedPool;

    tokens = await TokenList.create(2, { sorted: true });
    CGOLD = tokens.first;

    rateProviders = await tokens.asyncMap(() => deploy('v2-pool-utils/MockRateProvider'));

    sharedBeforeEach('deploy pool', async () => {
      pool = await WeightedPool.create({
        poolType: WeightedPoolType.WEIGHTED_POOL,
        tokens,
        weights: WEIGHTS,
        swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
        rateProviders: rateProviders.map((r) => r.address),
      });

      await pool.init({ initialBalances, recipient: lp });
    });
  });

  it('should ', () => {
    expect(true).to.be.true;
  });
});
