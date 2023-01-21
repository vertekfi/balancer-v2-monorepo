import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { VeBalHelperInput } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VeBalHelperInput;

  const veBALHelperArgs = [input.GaugeController];
  await task.deployAndVerify('GaugeControllerQuerier', veBALHelperArgs, from, force);
};
