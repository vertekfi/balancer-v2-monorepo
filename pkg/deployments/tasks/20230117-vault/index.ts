import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import { RawVaultDeployment } from '@balancer-labs/v2-helpers/src/models/vault/types';
import { getSigner } from '../../src/signers';
import TypesConverter from '@balancer-labs/v2-helpers/src/models/types/TypesConverter';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as RawVaultDeployment;

  const admin = await getSigner();

  const deployment = TypesConverter.toVaultDeployment({
    ...input,
    admin,
  });

  const basicAuthorizer = await VaultDeployer._deployBasicAuthorizer(admin);
  await task.save({ MockBasicAuthorizer: basicAuthorizer.address });

  const vault = await VaultDeployer._deployReal(deployment, basicAuthorizer.address);
  await task.save({ Vault: vault.address });
  await task.verify('Vault', vault.address, [
    basicAuthorizer.address,
    input.WETH,
    input.pauseWindowDuration,
    input.bufferPeriodDuration,
  ]);

  // The vault automatically also deploys the protocol fees collector: we must verify it
  const feeCollectorAddress = await vault.getProtocolFeesCollector();
  const feeCollectorArgs = [vault.address]; // See ProtocolFeesCollector constructor
  await task.save({ ProtocolFeesCollector: feeCollectorAddress });
  await task.verify('ProtocolFeesCollector', feeCollectorAddress, feeCollectorArgs);
};
