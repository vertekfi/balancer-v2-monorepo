import Task, { TaskMode } from '../../src/task';

export type BalMinterDeployment = {
  tokenAdmin: string;
  gaugeController: string;
};

export default {
  // bsc: {
  //   tokenAdmin: new Task('20230111-balancer-token-admin', TaskMode.READ_ONLY).output().BalancerTokenAdmin,
  //   gaugeController: new Task('20230112-gauge-controller', TaskMode.READ_ONLY).output().GaugeController,
  // },
  goerli: {
    tokenAdmin: new Task('20230111-balancer-token-admin', TaskMode.READ_ONLY).output().BalancerTokenAdmin,
    gaugeController: new Task('20230112-gauge-controller', TaskMode.READ_ONLY).output().GaugeController,
  },
};
