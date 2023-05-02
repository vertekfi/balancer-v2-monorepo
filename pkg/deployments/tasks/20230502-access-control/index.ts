import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import { AccessControlInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as AccessControlInput;

  const Authorizer = await task.deploy('Authorizer', [input.admin]);

  await task.save({ Authorizer: Authorizer.address });
};
