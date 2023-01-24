import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import { getSigner } from '../../src/signers';
import { AuthorizersInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as AuthorizersInput;

  const admin = await getSigner();

  // AuthorizerAdaptor
  const authorizerAdaptor = await VaultDeployer._deployAuthorizerAdaptor(input.Vault, admin);
  await task.save({ AuthorizerAdaptor: authorizerAdaptor.address });

  // AuthorizerAdaptorEntrypoint
  const adaptorEntrypoint = await VaultDeployer._deployAuthorizerAdaptorEntrypoint(authorizerAdaptor.address);
  await task.save({ AuthorizerAdaptorEntrypoint: adaptorEntrypoint.address });

  // TimelockAuthorizer
  const timelockAuth = await VaultDeployer._deployAuthorizer(admin, adaptorEntrypoint.address, input.rootTransferDelay);
  await task.save({ TimelockAuthorizer: timelockAuth.address });
  // TimelockAuthorizer deploys TimelockExecutor so verify it as well
  const executor = await timelockAuth.getExecutor();
  await task.save({ TimelockExecutor: executor });

  // Attempt verifications then
  await task.verify('AuthorizerAdaptor', authorizerAdaptor.address, [input.Vault]);
  await task.verify('AuthorizerAdaptorEntrypoint', adaptorEntrypoint.address, [authorizerAdaptor.address]);
  await task.verify('TimelockAuthorizer', timelockAuth.address, [
    admin.address,
    adaptorEntrypoint.address,
    input.rootTransferDelay,
  ]);
  await task.verify('TimelockExecutor', executor, []);
};
