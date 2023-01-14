import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { fp, fromFp, toFp } from '@balancer-labs/v2-helpers/src/numbers';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { PoolFeeConfig, WeightedPoolType } from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';
import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import Token from '@balancer-labs/v2-helpers/src/models/tokens/Token';
import { WeightedTwoTokenFeePool } from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedTwoTokenFeePool';

describe('WeightedTwoTokenFeePool', function () {
  let tokens: TokenList;
  let owner: SignerWithAddress;
  let pool: WeightedTwoTokenFeePool;

  let coreToken: Token;
  let BUSD: Token;

  const WEIGHTS = [80, 20];
  const initialBalances = [fp(4000), fp(6000)];

  const feeConfig: PoolFeeConfig = {
    buyFee: 10000,
    sellFee: 25000,
    bptJoinFee: 10000,
    bptExitFee: 10000,
    feeReceiver: '',
    coreToken: '',
  };

  before('setup signers', async () => {
    [owner] = await ethers.getSigners();
    feeConfig.feeReceiver = owner.address;
  });

  sharedBeforeEach('deploy tokens', async () => {
    tokens = await TokenList.create(2, { sorted: true });
    coreToken = tokens.first;
    BUSD = tokens.second;

    feeConfig.coreToken = coreToken.address;

    await coreToken.mint(owner, initialBalances[0]);
    await BUSD.mint(owner, initialBalances[1]);
  });

  sharedBeforeEach('deploy pool', async () => {
    tokens = await TokenList.create(2, { sorted: true });

    pool = await WeightedTwoTokenFeePool.create({
      poolType: WeightedPoolType.WEIGHTED_POOL,
      tokens,
      weights: WEIGHTS,
      feeConfig,
    });

    await pool.init({ initialBalances, recipient: owner });
  });

  it('should ', async () => {});
});
