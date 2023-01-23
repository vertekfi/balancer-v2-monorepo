import Task, { TaskMode } from '../../src/task';

export type FeeDistributorDeployment = {
  VotingEscrow: string;
  startTime: number;
};

export default {
  VotingEscrow: new Task('20230120-voting-escrow', TaskMode.READ_ONLY),
  // mainnet: {
  //   startTime: 1657756800, // Thursday, July 14 2022 00:00:00 UTC
  // },
  goerli: {
    startTime: 1674455329, // testing Jan 23 2023 ~1:30AM EST
  },
};
