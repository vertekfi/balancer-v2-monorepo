import Task, { TaskMode } from '../../src/task';

export type TokenHolderInput = {
  BAL: string;
  Vault: string;
};

export default {
  Vault: new Task('20230124-vault', TaskMode.READ_ONLY),
  bsc: {
    BAL: '0x5Be975013095AEa033dB098787C56e5867107060',
  },
  goerli: {
    BAL: '0x5E1D334E7CFF8436bA39E24d452eB6E8451B5F9b',
  },
};
