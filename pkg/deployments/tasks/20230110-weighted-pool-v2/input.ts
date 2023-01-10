import { DAY } from '@balancer-labs/v2-helpers/src/time';
import Task, { TaskMode } from '../../src/task';

export type WeightedPoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  initialPauseWindowDuration: number;
  bufferPeriodDuration: number;
};

const data = new Task('20221229-vault', TaskMode.READ_ONLY).output({
  ensure: true,
  network: 'goerli',
});

const input: WeightedPoolDeployment = {
  Vault: data['Vault'],
  ProtocolFeePercentagesProvider: data['ProtocolFeePercentagesProvider'],
  initialPauseWindowDuration: DAY * 270,
  bufferPeriodDuration: DAY * 90,
};

export default input;
