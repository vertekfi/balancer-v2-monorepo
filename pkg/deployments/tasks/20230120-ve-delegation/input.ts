import Task, { TaskMode } from '../../src/task';

export type VotingEscrowDelegationDeployment = {
  Vault: string;
  VotingEscrow: string;
};

export default {
  Vault: new Task('20230117-vault', TaskMode.READ_ONLY),
  VotingEscrow: new Task('20230120-voting-escrow', TaskMode.READ_ONLY),
};
