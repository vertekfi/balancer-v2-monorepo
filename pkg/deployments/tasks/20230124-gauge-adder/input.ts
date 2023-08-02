import Task, { TaskMode } from '../../src/task';

export type GaugeAdderDeployment = {
  GaugeController: string;
  AuthorizerAdaptorEntrypoint: string;
};

export default {
  GaugeController: new Task('20230124-gauge-controller', TaskMode.READ_ONLY),
  AuthorizerAdaptorEntrypoint: new Task('20230124-authorizers', TaskMode.READ_ONLY),
};