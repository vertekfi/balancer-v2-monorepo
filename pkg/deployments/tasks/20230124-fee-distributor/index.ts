import { WEEK } from '@balancer-labs/v2-helpers/src/time';
import { getSigner } from '../../src/signers';
import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { FeeDistributorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as FeeDistributorDeployment;

  const signer = await getSigner();
  const block = await signer.provider?.getBlock(await signer?.provider.getBlockNumber());
  // One week from, now
  // const startTime = Math.round(((block?.timestamp || 0) / WEEK) * WEEK) + 1;

  const args = [input.VotingEscrow, input.startTime];
  await task.deployAndVerify('FeeDistributor', args, from, force);
};
