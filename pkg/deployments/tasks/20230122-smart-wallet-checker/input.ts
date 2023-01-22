import Task, { TaskMode } from '../../src/task';

export type SmartWalletCheckerDeployment = {
  Vault: string;
  InitialAllowedAddresses: string[];
};

export default {
  Vault: new Task('20230117-vault', TaskMode.READ_ONLY),
  mainnet: {
    InitialAllowedAddresses: [],
  },
  goerli: {
    InitialAllowedAddresses: [],
  },
};
