import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { BalMinterDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalMinterDeployment;

  const balMinterArgs = [input.BalancerTokenAdmin, input.GaugeController];
  await task.deployAndVerify('BalancerMinter', balMinterArgs, from, force);
};
