import { FP_100_PCT } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { Task, TaskMode } from '../../src';

export type ProtocolFeePercentagesInput = {
  Vault: string;
  maxYieldValue: BigNumber;
  maxAUMValue: BigNumber;
};

const vaultTask = new Task('20230117-vault', TaskMode.READ_ONLY);
export default {
  Vault: vaultTask,
  maxYieldValue: FP_100_PCT,
  maxAUMValue: FP_100_PCT,
};
