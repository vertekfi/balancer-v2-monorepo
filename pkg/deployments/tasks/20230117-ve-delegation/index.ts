import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { VotingEscrowDelegationDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VotingEscrowDelegationDeployment;

  const args = [ZERO_ADDRESS, input.VotingEscrow];
  const votingEscrowDelegation = await task.deploy('VeBoostV2', args, from);

  const proxyArgs = [input.Vault, input.VotingEscrow, votingEscrowDelegation.address];
  await task.deployAndVerify('VotingEscrowDelegationProxy', proxyArgs, from, force);
};
