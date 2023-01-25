import Task, { TaskMode } from '../../src/task';

export type SingleRecipientFactoryDelegationDeployment = {
  BalancerMinter: string;
};

export default {
  BalancerMinter: new Task('20230124-balancer-minter', TaskMode.READ_ONLY),
};
