import Task, { TaskMode } from '../../src/task';

export type VotingEscrowDelegationDeployment = {
  Vault: string;
  VotingEscrow: string;
};

const VaultTask = new Task('20221229-vault', TaskMode.READ_ONLY);
const VotingEscrowTask = new Task('20230112-voting-escrow', TaskMode.READ_ONLY);

export default {
  Vault: VaultTask,
  VotingEscrow: VotingEscrowTask,
};
