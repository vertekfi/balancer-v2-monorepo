import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import { ProtocolFeePercentagesInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as ProtocolFeePercentagesInput;

  await task.deployAndVerify('ProtocolFeePercentagesProvider', [input.Vault, input.maxYieldValue, input.maxAUMValue]);
};
