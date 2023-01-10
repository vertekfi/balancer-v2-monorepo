import Task from '../../src/task';
import { VaultDeployment } from './input';
import { TaskRunOptions } from '../../src/types';

import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VaultDeployment;
  const vault = await VaultDeployer.deploy(input);

  // The vault automatically also deploys the protocol fees collector: we must verify it
  const feeCollector = await vault.getFeesCollector();
  const feeCollectorArgs = [vault.address]; // See ProtocolFeesCollector constructor
  await task.verify('ProtocolFeesCollector', feeCollector.address, feeCollectorArgs);
  await task.save({ ProtocolFeesCollector: feeCollector.address });

  const helpersArgs = [vault.address];
  await task.deployAndVerify('BalancerHelpers', helpersArgs, from, force);
};
