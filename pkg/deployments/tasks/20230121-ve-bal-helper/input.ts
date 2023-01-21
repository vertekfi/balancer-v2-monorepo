import Task, { TaskMode } from '../../src/task';

export type VeBalHelperInput = {
  GaugeController: string;
};

export default {
  GaugeController: new Task('20230120-gauge-controller', TaskMode.READ_ONLY),
};
