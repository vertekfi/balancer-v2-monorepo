import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { GaugeSystemDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as GaugeSystemDeployment;

  const veBALArgs = [input.BPT, 'Vote Escrowed Balancer BPT', 'veBAL', input.AuthorizerAdaptor];
  await task.deploy('VotingEscrow', veBALArgs, from, force);
};
