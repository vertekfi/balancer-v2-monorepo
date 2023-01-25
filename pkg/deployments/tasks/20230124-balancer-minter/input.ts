import Task, { TaskMode } from '../../src/task';

export type BalMinterDeployment = {
  BalancerTokenAdmin: string;
  GaugeController: string;
};

export default {
  BalancerTokenAdmin: new Task('20230124-balancer-token-admin', TaskMode.READ_ONLY),
  GaugeController: new Task('20230124-gauge-controller', TaskMode.READ_ONLY),
};
