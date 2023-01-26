import Task, { TaskMode } from '../../src/task';

export type TokenHolderInput = {
  BAL: string;
  Vault: string;
};

export default {
  Vault: new Task('20230124-vault', TaskMode.READ_ONLY),
  bsc: {
    BAL: '0xeD236c32f695c83Efde232c288701d6f9C23E60E',
  },
  goerli: {
    BAL: '0x5E1D334E7CFF8436bA39E24d452eB6E8451B5F9b',
  },
};
