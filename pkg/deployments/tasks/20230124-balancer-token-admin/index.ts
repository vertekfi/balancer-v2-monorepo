import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { TokenAdminDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TokenAdminDeployment;

  const args = [input.Vault, input.GovernanceToken, input.initialMintAllowance];
  await task.deployAndVerify('BalancerTokenAdmin', args, from, force);
};