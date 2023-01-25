import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { TokenHolderInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TokenHolderInput;

  const args = [input.BAL, input.Vault, 'BALTokenHolder'];
  await task.deployAndVerify('BALTokenHolder', args, from, force);
};
