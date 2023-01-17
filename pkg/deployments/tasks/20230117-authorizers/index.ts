import Task, { TaskMode } from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import { getSigner } from '../../src/signers';
import { AuthorizersInput } from './input';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';

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

  // // Try to set the new authorizer
  // const vaultTask = new Task('20230117-vault', TaskMode.READ_ONLY, task.network);
  // const basicAuthorizer = await vaultTask.deployedInstance('MockBasicAuthorizer');
  // const vault = await vaultTask.deployedInstance('Vault');

  // const setAuthorizerActionId = await actionId(vault, 'setAuthorizer');
  // await basicAuthorizer.grantRolesToMany([setAuthorizerActionId], [admin.address]);
  // await vault.connect(admin).setAuthorizer('0x3d838DF4F4Ac0b28693771B83E40DB07F9b1ADe9');

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
