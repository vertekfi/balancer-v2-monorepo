import { Contract, Event } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { deployedAt } from '../../../contract';
import { WeightedPoolCreationConfig } from '../types';
import { getWeightedDeploymentArgs, validateWeightedPoolConfig } from '../utils';

export async function createWeightedPool(poolConfig: WeightedPoolCreationConfig, weightedFactory: Contract) {
  validateWeightedPoolConfig(poolConfig);

  const deploymentArgs = getWeightedDeploymentArgs(poolConfig);
  // const weightedFactory = await deployedAt('v2-pool-weighted/WeightedPoolFactory', weightedFactoryAddress);

  const receipt = await weightedFactory.create(
    deploymentArgs.name,
    deploymentArgs.symbol,
    deploymentArgs.tokens,
    deploymentArgs.weights.map((w) => parseUnits(w)),
    deploymentArgs.rateProviders,
    parseUnits(deploymentArgs.swapFeePercentage),
    deploymentArgs.owner
  );

  const events = receipt.events.filter((e: Event) => e.event === 'PoolCreated');
  const poolAddress = events[0].args.pool;
  return deployedAt('v2-pool-weighted/WeightedPool', poolAddress);
}
