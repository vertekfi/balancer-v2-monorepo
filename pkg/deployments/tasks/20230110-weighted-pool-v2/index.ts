import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { WeightedPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedPoolDeployment;

  const factory = await task.deployAndVerify(
    'WeightedPoolFactory',
    [input.Vault, input.ProtocolFeePercentagesProvider, input.initialPauseWindowDuration, input.bufferPeriodDuration],
    from,
    force
  );
  await task.save({ WeightedPoolFactory: factory.address });
};
