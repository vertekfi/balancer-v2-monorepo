import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { ZERO_ADDRESS } from '../../../constants';
import { BigNumberish } from '../../../numbers';
import TokenList from '../../tokens/TokenList';
import Vault from '../../vault/Vault';
import { PoolFeeConfig, WeightedPoolType, RawWeightedTwoTokenFeePoolDeployment } from './types';
import WeightedPool from './WeightedPool';
import WeightedTwoTokenFeePoolDeployer from './WeightedTwoTokenFeePoolDeployer';

export class WeightedTwoTokenFeePool extends WeightedPool {
  readonly feeConfig: PoolFeeConfig;

  constructor(
    instance: Contract,
    poolId: string,
    vault: Vault,
    tokens: TokenList,
    weights: BigNumberish[],
    rateProviders: string[],
    assetManagers: string[],
    swapFeePercentage: BigNumberish,
    poolType: WeightedPoolType,
    feeConfig: PoolFeeConfig,
    owner?: SignerWithAddress
  ) {
    super(
      instance,
      poolId,
      vault,
      tokens,
      weights,
      rateProviders,
      assetManagers,
      swapFeePercentage,
      poolType,
      true,
      false,
      0,
      ZERO_ADDRESS,
      '1',
      owner
    );

    this.feeConfig = feeConfig;
  }

  static async create(params: RawWeightedTwoTokenFeePoolDeployment): Promise<WeightedTwoTokenFeePool> {
    return WeightedTwoTokenFeePoolDeployer.deploy(params);
  }

  async getPoolConfig() {
    return this.instance.getPoolConfig();
  }
}
