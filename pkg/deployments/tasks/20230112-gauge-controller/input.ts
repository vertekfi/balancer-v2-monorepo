import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  veAddress: string;
  AuthorizerAdaptor: string;
};

export default {
  veAddress: new Task('20230112-voting-escrow', TaskMode.READ_ONLY).output().VotingEscrow,
  AuthorizerAdaptor: new Task('20221229-vault', TaskMode.READ_ONLY).output().AuthorizerAdaptor,
};
