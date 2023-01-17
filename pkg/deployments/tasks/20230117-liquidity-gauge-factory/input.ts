import Task, { TaskMode } from '../../src/task';

export type LiquidityGaugeFactoryDeployment = {
  AuthorizerAdaptor: string;
  BalancerMinter: string;
  VotingEscrowDelegationProxy: string;
};

const AuthorizerAdaptor = new Task('20221229-vault', TaskMode.READ_ONLY).output().AuthorizerAdaptor;
const BalancerMinter = new Task('20230112', TaskMode.READ_ONLY).output().BalancerMinter;
const VotingEscrowDelegationProxy = new Task('20230117-ve-delegation', TaskMode.READ_ONLY).output()
  .VotingEscrowDelegationProxy;

export default {
  AuthorizerAdaptor,
  BalancerMinter,
  VotingEscrowDelegationProxy,
};
