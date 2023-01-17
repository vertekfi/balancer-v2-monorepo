import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { sleep } from '../../src/utils';
import { WeightedPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedPoolDeployment;

  const args = [
    input.Vault,
    input.ProtocolFeePercentagesProvider,
    input.initialPauseWindowDuration,
    input.bufferPeriodDuration,
  ];
  const factory = await task.deploy('WeightedPoolFactory', args, from, force);
  await task.save({ WeightedPoolFactory: factory.address });
  await sleep(5000);
  await task.verify('', factory.address, args);
};
