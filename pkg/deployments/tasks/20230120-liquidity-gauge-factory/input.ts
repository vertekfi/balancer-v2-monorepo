import Task, { TaskMode } from '../../src/task';

export type LiquidityGaugeFactoryDeployment = {
  AuthorizerAdaptor: string;
  BalancerMinter: string;
  VotingEscrowDelegationProxy: string;
};

export default {
  AuthorizerAdaptor: new Task('20230117-authorizers', TaskMode.READ_ONLY),
  BalancerMinter: new Task('20230120-balancer-minter', TaskMode.READ_ONLY),
  VotingEscrowDelegationProxy: new Task('20230120-ve-delegation', TaskMode.READ_ONLY),
};
