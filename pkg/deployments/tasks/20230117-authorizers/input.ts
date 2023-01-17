import { FP_100_PCT } from '@balancer-labs/v2-helpers/src/numbers';
import { WEEK } from '@balancer-labs/v2-helpers/src/time';
import { BigNumber } from 'ethers';
import Task, { TaskMode } from '../../src/task';

export type AuthorizersInput = {
  Vault: string;
  MockBasicAuthorizer: string;
  maxYieldValue: BigNumber;
  maxAUMValue: BigNumber;
  rootTransferDelay: number;
};

const vaultTask = new Task('20230117-vault', TaskMode.READ_ONLY);
export default {
  Vault: vaultTask,
  MockBasicAuthorizer: vaultTask,
  maxYieldValue: FP_100_PCT,
  maxAUMValue: FP_100_PCT,
  rootTransferDelay: WEEK,
};
