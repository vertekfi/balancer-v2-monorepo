import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { TokenAdminDeployment } from './input';
import { sleep } from '../../src/utils';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TokenAdminDeployment;

  const args = [input.Vault, input.GovernanceToken, input.initialMintAllowance];
  const tokenAdmin = await task.deploy('BalancerTokenAdmin', args, from, force);
  await sleep();
  await task.verify('BalancerTokenAdmin', tokenAdmin.address, args);
};