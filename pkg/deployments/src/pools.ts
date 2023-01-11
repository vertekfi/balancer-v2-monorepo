import { join } from 'path';
import { getChainId } from './signers';
import { NETWORK_KEYS } from './types';
import { parseFileSync } from './utils';
import { PoolConfigType, WeightedPoolCreationConfig } from '@balancer-labs/v2-helpers/src/models/pools/types';
import Task from './task';

export type CreateWeightedPoolInfo = {
  poolConfig: WeightedPoolCreationConfig;
  weightedFactoryTask: Task;
};

export function getPoolConfigPath() {
  return join(process.cwd(), 'pkg/deployments/pools', `${NETWORK_KEYS[getChainId()]}-pools.json`);
}

export function getAllPoolConfigs(): PoolConfigType[] {
  return parseFileSync(getPoolConfigPath());
}

// VRTK-BNB config
export function getMainPoolConfig(): WeightedPoolCreationConfig {
  const poolConfigs = getAllPoolConfigs();
  const pool = poolConfigs.find((p) => p.isVePool);
  if (!pool) {
    throw new Error('Main pool not found in lookup');
  }

  return pool as WeightedPoolCreationConfig;
}
