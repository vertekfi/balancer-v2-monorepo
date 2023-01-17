import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import { ProtocolFeePercentagesInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as ProtocolFeePercentagesInput;

  // // ProtocolFeePercentagesProvider
  // const feesProvider = vault.getFeesProvider(); // We know it was added in this case, so no error worries
  // await task.save({ ProtocolFeePercentagesProvider: feesProvider.address });
  // await task.verify('ProtocolFeePercentagesProvider', feesProvider.address, [
  //   vault.address,
  //   input.maxYieldValue,
  //   input.maxAUMValue,
  // ]);
};
