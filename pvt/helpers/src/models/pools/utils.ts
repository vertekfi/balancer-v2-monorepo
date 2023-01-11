import { getAddress } from 'ethers/lib/utils';
import { ZERO_ADDRESS } from '../../constants';
import {
  BasePoolCreationConfig,
  BasePoolTokenInfo,
  PoolGaugeConfig,
  PoolType,
  StablePoolCreationConfig,
  StablePoolDeploymentArgs,
  WeightedPoolCreationConfig,
  WeightedPoolDeploymentArgs,
} from './types';
import assert from 'assert';

/**
 * Util to sort the token info for a pool according to token addresses as required by the vault.
 * Allows for all attached and or required info to be "index aligned" to the token.
 * Would have a busted pool if these items do not line up with their associated token.
 * @param tokens
 * @returns
 */
export function sortTokensWithInfo<T extends BasePoolTokenInfo>(tokens: T[]): T[] {
  return tokens.sort((t1, t2) => (getAddress(t1.address) < getAddress(t2.address) ? -1 : 1));
}

/**
 * Util to set the values needed for weighted pool creation arguments for the factory.
 * Items need to be index aligned based on each tokens resulting index.
 * Uses `sortTokensWithInfo` to help with this.
 */
export function getWeightedDeploymentArgs(poolConfig: WeightedPoolCreationConfig): WeightedPoolDeploymentArgs {
  const sortedInfo = sortTokensWithInfo(poolConfig.tokenInfo);

  return {
    name: poolConfig.deploymentArgs.name,
    symbol: poolConfig.deploymentArgs.symbol,
    swapFeePercentage: poolConfig.deploymentArgs.swapFeePercentage,
    owner: poolConfig.deploymentArgs.owner,
    tokens: sortedInfo.map((info) => info.address),
    weights: sortedInfo.map((info) => info.weight),
    initialBalances: sortedInfo.map((info) => info.initialBalance),
    assetManagers: sortedInfo.map((info) =>
      poolConfig.assetManager ? poolConfig.assetManager : info.assetManager || ZERO_ADDRESS
    ),
    rateProviders: sortedInfo.map((info) => info.rateProvider || ZERO_ADDRESS),
  };
}

export function getStableDeploymentArgs(poolConfig: StablePoolCreationConfig): StablePoolDeploymentArgs {
  const sortedInfo = sortTokensWithInfo(poolConfig.tokenInfo);

  return {
    name: poolConfig.deploymentArgs.name,
    symbol: poolConfig.deploymentArgs.symbol,
    swapFeePercentage: poolConfig.deploymentArgs.swapFeePercentage,
    owner: poolConfig.deploymentArgs.owner,
    amplificationParameter: poolConfig.amplificationParameter,
    tokens: sortedInfo.map((info) => info.address),
    initialBalances: sortedInfo.map((info) => info.initialBalance),
    assetManagers: sortedInfo.map((info) =>
      poolConfig.assetManager ? poolConfig.assetManager : poolConfig.assetManager || ZERO_ADDRESS
    ),
  };
}

export function validateBasePoolConfig(pool: BasePoolCreationConfig) {
  assert(pool.type, '!pool type');
  assert(pool.type in PoolType, '!invalid pool type');

  pool.tokenInfo.forEach((info) => {
    // Gov token gets auto added later
    if (!pool.isVePool) {
      assert(info.address, '!token info address');
    }

    assert(info.initialBalance?.length, '!token info init balance');
  });

  assert(pool.deploymentArgs.swapFeePercentage, `!swapFeePercentage`);
  assert(pool.deploymentArgs.name, `!name`);
  assert(pool.deploymentArgs.symbol, `!symbol`);
  assert(pool.deploymentArgs.owner, `!symownerbol`);

  validatePoolGaugeConfig(pool.gauge);
}

export function validateWeightedPoolConfig(pool: WeightedPoolCreationConfig) {
  assert(pool.type === PoolType.Weighted, '!invalid pool type');
  validateBasePoolConfig(pool);
  pool.tokenInfo.forEach((info) => {
    assert(info.weight, '!token info weight');
  });
}

export function validateStablePoolConfig(pool: StablePoolCreationConfig) {
  assert(pool.type === PoolType.Stable, '!invalid pool type');
  validateBasePoolConfig(pool);
  assert(pool.amplificationParameter, '!amplificationParameter');
}

export function validatePoolGaugeConfig(config: PoolGaugeConfig) {
  assert(config, '!gauge config not added');
  assert(config.startingWeight, '!gauge startingWeight');
}
