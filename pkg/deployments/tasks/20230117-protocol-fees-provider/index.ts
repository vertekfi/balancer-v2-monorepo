import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import { ProtocolFeePercentagesInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as ProtocolFeePercentagesInput;

  const feesProvider = await VaultDeployer._deployProtocolFeeProvider(
    input.Vault,
    input.maxYieldValue,
    input.maxAUMValue
  );
  await task.save({ ProtocolFeePercentagesProvider: feesProvider.address });
  await task.verify('ProtocolFeePercentagesProvider', feesProvider.address, [
    input.Vault,
    input.maxYieldValue,
    input.maxAUMValue,
  ]);
};
