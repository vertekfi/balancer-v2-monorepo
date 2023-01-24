import { DAY } from '@balancer-labs/v2-helpers/src/time';
import Task, { TaskMode } from '../../src/task';

export type WeightedPoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  initialPauseWindowDuration: number;
  bufferPeriodDuration: number;
};

export default {
  Vault: new Task('20230124-vault', TaskMode.READ_ONLY),
  ProtocolFeePercentagesProvider: new Task('20230124-protocol-fees-provider', TaskMode.READ_ONLY),
  initialPauseWindowDuration: DAY * 270, // using new max values
  bufferPeriodDuration: DAY * 90,
};
