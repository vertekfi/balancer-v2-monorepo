import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  veAddress: string;
  AuthorizerAdaptor: string;
};

const network = 'goerli';

export default {
  veAddress: new Task('20230112-voting-escrow', TaskMode.READ_ONLY, network).output().VotingEscrow,
  AuthorizerAdaptor: new Task('20221229-vault', TaskMode.READ_ONLY, network).output().AuthorizerAdaptor,
};
