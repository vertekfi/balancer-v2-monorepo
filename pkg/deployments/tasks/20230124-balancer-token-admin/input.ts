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
    GovernanceToken: '0xa5694789C0BaED77d16ca36edC45C9366DBFe0A9',
  },
  initialMintAllowance: fp(1250000),
};
