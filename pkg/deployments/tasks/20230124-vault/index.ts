import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { RawVaultDeployment } from '@balancer-labs/v2-helpers/src/models/vault/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as RawVaultDeployment;

  // const vault = await task.deployAndVerify('Vault', [
  //   '0x111C3E89Ce80e62EE88318C2804920D4c96f92bb',
  //   input.WETH,
  //   input.pauseWindowDuration,
  //   input.bufferPeriodDuration,
  // ]);

  const vault = await task.deploy('Vault', [
    '0x111C3E89Ce80e62EE88318C2804920D4c96f92bb',
    input.WETH,
    input.pauseWindowDuration,
    input.bufferPeriodDuration,
  ]);

  // The vault automatically also deploys the protocol fees collector: we must verify it
  const feeCollectorAddress = await vault.getProtocolFeesCollector();
  await task.save({ ProtocolFeesCollector: feeCollectorAddress });
};
