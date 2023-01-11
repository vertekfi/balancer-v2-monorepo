import { createWeightedPool } from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPoolCreation';
import { CreateWeightedPoolInfo } from '../../../src/pools';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as CreateWeightedPoolInfo;

  const weightedFactory = await input.weightedFactoryTask.deployedInstanceTyped('WeightedPoolFactory');
  const pool = await createWeightedPool(input.poolConfig, weightedFactory);
};
