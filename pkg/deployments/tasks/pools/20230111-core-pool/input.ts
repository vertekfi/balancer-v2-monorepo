import { CreateWeightedPoolInfo, getMainPoolConfig } from '../../../src/pools';
import Task, { TaskMode } from '../../../src/task';

const input: CreateWeightedPoolInfo = {
  poolConfig: getMainPoolConfig(),
  weightedFactoryTask: new Task('20230110-weighted-pool-v2', TaskMode.READ_ONLY),
};

export default input;
