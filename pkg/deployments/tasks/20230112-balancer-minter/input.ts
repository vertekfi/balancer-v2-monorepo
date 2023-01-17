import Task, { TaskMode } from '../../src/task';

export type BalMinterDeployment = {
  BalancerTokenAdmin: string;
  GaugeController: string;
};

export default {
  goerli: {
    BalancerTokenAdmin: new Task('20230111-balancer-token-admin', TaskMode.READ_ONLY),
    GaugeController: new Task('20230112-gauge-controller', TaskMode.READ_ONLY),
  },
};
