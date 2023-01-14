import { Contract } from 'ethers';
import { deploy } from '../../../contract';
import Vault from '../../vault/Vault';
import VaultDeployer from '../../vault/VaultDeployer';
import TypesConverter from '../../types/TypesConverter';
import { RawWeightedTwoTokenFeePoolDeployment, WeightedTwoTokenFeePoolDeployment } from './types';
import { WeightedTwoTokenFeePool } from './WeightedTwoTokenFeePool';

const NAME = 'Balancer Pool Token';
const SYMBOL = 'BPT';

export default {
  async deploy(params: RawWeightedTwoTokenFeePoolDeployment): Promise<WeightedTwoTokenFeePool> {
    const deployment = TypesConverter.toWeightedTwoTokenFeePoolDeployment(params);
    const vault = params?.vault ?? (await VaultDeployer.deploy(TypesConverter.toRawVaultDeployment(params)));
    const pool = await this._deployStandalone(deployment, vault);
    const poolId = await pool.getPoolId();

    const { tokens, weights, rateProviders, assetManagers, swapFeePercentage, poolType } = deployment;

    return new WeightedTwoTokenFeePool(
      pool,
      poolId,
      vault,
      tokens,
      weights,
      TypesConverter.toAddresses(rateProviders),
      assetManagers,
      swapFeePercentage,
      poolType,
      deployment.feeConfig
    );
  },

  async _deployStandalone(params: WeightedTwoTokenFeePoolDeployment, vault: Vault): Promise<Contract> {
    const {
      tokens,
      weights,
      rateProviders,
      assetManagers,
      swapFeePercentage,
      pauseWindowDuration,
      bufferPeriodDuration,
      owner,
      from,
      feeConfig,
    } = params;

    return deploy('v2-pool-weighted/WeightedTwoTokenFeePool', {
      args: [
        {
          name: NAME,
          symbol: SYMBOL,
          tokens: tokens.addresses,
          normalizedWeights: weights,
          rateProviders: rateProviders,
          assetManagers: assetManagers,
          swapFeePercentage: swapFeePercentage,
        },
        vault.address,
        vault.protocolFeesProvider.address,
        pauseWindowDuration,
        bufferPeriodDuration,
        owner,
        feeConfig,
      ],
      from,
    });
  },
};
