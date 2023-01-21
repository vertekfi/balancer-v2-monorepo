import { FP_100_PCT } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { Task, TaskMode } from '../../src';

export type ProtocolFeePercentagesInput = {
  Vault: string;
  maxYieldValue: BigNumber;
  maxAUMValue: BigNumber;
};

export default {
  Vault: new Task('20230117-vault', TaskMode.READ_ONLY),
  maxYieldValue: FP_100_PCT.div(2),
  maxAUMValue: FP_100_PCT.div(2),
};
