import Task, { TaskMode } from '../../src/task';

export type BalMinterDeployment = {
  BalancerTokenAdmin: string;
  GaugeController: string;
};

export default {
  goerli: {
    BalancerTokenAdmin: new Task('20230117-balancer-token-admin', TaskMode.READ_ONLY),
    GaugeController: new Task('20230120-gauge-controller', TaskMode.READ_ONLY),
  },
};
