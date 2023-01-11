import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { TokenAdminDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TokenAdminDeployment;

  const tokenAdmin = await task.deployAndVerify(
    'BalancerTokenAdmin',
    [input.vault, input.governanceToken, input.initialMintAllowance],
    from,
    force
  );
  await task.save({ BalancerTokenAdmin: tokenAdmin.address });

  // grant default admin role

  // action id stuff to allow activate call
};
