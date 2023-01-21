import Task, { TaskMode } from '../../src/task';

export type AuthorizersInput = {
  Vault: string;
  rootTransferDelay: number;
};

const vaultTask = new Task('20230117-vault', TaskMode.READ_ONLY);
export default {
  Vault: vaultTask,
  rootTransferDelay: 0,
};
