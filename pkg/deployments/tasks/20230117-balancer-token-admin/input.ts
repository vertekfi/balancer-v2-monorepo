import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { Task, TaskMode } from '../../src';

export type TokenAdminDeployment = {
  Vault: string;
  GovernanceToken: string;
  initialMintAllowance: BigNumber;
};

export default {
  Vault: new Task('20221229-vault', TaskMode.READ_ONLY),
  GovernanceToken: new Task('20230111-governance-token', TaskMode.READ_ONLY),
  initialMintAllowance: fp(1250000),
};
