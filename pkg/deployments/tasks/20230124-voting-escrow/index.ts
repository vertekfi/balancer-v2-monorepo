import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { GaugeSystemDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as GaugeSystemDeployment;

  const veBALArgs = [input.BPT, 'Vote Escrowed Vertek VPT', 'veVRTK', input.AuthorizerAdaptor];
  await task.deployAndVerify('VotingEscrow', veBALArgs, from, force);
};
