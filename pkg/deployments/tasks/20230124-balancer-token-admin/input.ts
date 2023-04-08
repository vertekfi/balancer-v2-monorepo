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
    GovernanceToken: '0xeD236c32f695c83Efde232c288701d6f9C23E60E',
  },
  arbitrum: {
    GovernanceToken: '0x412A1ab6A00B50A7ad2306C994ae609Bd823ad87',
  },
  goerli: {
    GovernanceToken: '0x5E1D334E7CFF8436bA39E24d452eB6E8451B5F9b',
  },
  initialMintAllowance: fp(1250000),
};
