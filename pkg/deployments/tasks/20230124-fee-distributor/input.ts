import Task, { TaskMode } from '../../src/task';

export type FeeDistributorDeployment = {
  VotingEscrow: string;
  startTime: number;
};

export default {
  VotingEscrow: new Task('20230124-voting-escrow', TaskMode.READ_ONLY),
  arbitrum: {
    startTime: 1681948800, // Thursday 4/20 00:00:oo UTC
  },
  bsc: {
    startTime: 1674691200, // Thursday, January 26 2024 00:00:00 UTC - 2023-01-26T00:00:00Z
  },
  goerli: {
    startTime: 1674455329, // testing Monday, Jan 23 2023 ~1:30AM EST
  },
};
