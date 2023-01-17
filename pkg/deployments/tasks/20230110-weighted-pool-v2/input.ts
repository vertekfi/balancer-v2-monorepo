import { DAY } from '@balancer-labs/v2-helpers/src/time';
import Task, { TaskMode } from '../../src/task';

export type WeightedPoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  initialPauseWindowDuration: number;
  bufferPeriodDuration: number;
};

const vaultTask = new Task('20221229-vault', TaskMode.READ_ONLY);

export default {
  Vault: vaultTask,
  ProtocolFeePercentagesProvider: vaultTask,
  initialPauseWindowDuration: DAY * 270,
  bufferPeriodDuration: DAY * 90,
};
