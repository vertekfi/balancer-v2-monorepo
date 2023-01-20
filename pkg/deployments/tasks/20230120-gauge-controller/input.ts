import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  VotingEscrow: string;
  AuthorizerAdaptor: string;
};

export default {
  VotingEscrow: new Task('20230120-voting-escrow', TaskMode.READ_ONLY),
  AuthorizerAdaptor: new Task('20230117-authorizers', TaskMode.READ_ONLY),
};
