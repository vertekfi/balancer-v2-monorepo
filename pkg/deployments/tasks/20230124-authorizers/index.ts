import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import { getSigner } from '../../src/signers';
import { AuthorizersInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as AuthorizersInput;

  const admin = await getSigner();

  const authorizerAdaptor = await task.deployAndVerify('AuthorizerAdaptor', [input.Vault]);
  const adaptorEntrypoint = await task.deployAndVerify('AuthorizerAdaptorEntrypoint', [authorizerAdaptor.address]);
  const timelockAuth = await task.deployAndVerify('TimelockAuthorizer', [
    admin.address,
    adaptorEntrypoint.address,
    input.rootTransferDelay,
  ]);

  // TimelockAuthorizer deploys TimelockExecutor so verify it as well
  const executor = await timelockAuth.getExecutor();
  await task.save({ TimelockExecutor: executor });
  await task.verify('TimelockExecutor', executor, []);
};
