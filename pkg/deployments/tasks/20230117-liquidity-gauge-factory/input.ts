import Task, { TaskMode } from '../../src/task';

export type LiquidityGaugeFactoryDeployment = {
  AuthorizerAdaptor: string;
  BalancerMinter: string;
  VotingEscrowDelegationProxy: string;
};

const AuthorizerAdaptor = new Task('20221229-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20230112-balancer-minter', TaskMode.READ_ONLY);
const VotingEscrowDelegationProxy = new Task('20230117-ve-delegation', TaskMode.READ_ONLY);

export default {
  AuthorizerAdaptor,
  BalancerMinter,
  VotingEscrowDelegationProxy,
};
