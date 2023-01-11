import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const governanceToken = await task.deployAndVerify('GovernanceToken', ['Vertek', 'VRTK'], from, force);
  await task.save({ GovernanceToken: governanceToken.address });
};
