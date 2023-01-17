import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { sleep } from '../../src/utils';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const args = ['Vertek', 'VRTK'];
  const governanceToken = await task.deploy('GovernanceToken', args);
  await task.save({ GovernanceToken: governanceToken.address });
  await sleep(5000);
  await task.verify('GovernanceToken', governanceToken.address, args);
};
