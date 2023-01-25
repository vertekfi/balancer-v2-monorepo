import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { Task, TaskMode } from '../../src';

export type TokenAdminDeployment = {
  Vault: string;
  GovernanceToken: string;
  initialMintAllowance: BigNumber;
};

export default {
  Vault: new Task('20230124-vault', TaskMode.READ_ONLY),
  bsc: {
    GovernanceToken: '0x5Be975013095AEa033dB098787C56e5867107060',
  },
  goerli: {
    GovernanceToken: '0x5E1D334E7CFF8436bA39E24d452eB6E8451B5F9b',
  },
  initialMintAllowance: fp(1250000),
};
