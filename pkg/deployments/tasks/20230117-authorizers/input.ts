import { WEEK } from '@balancer-labs/v2-helpers/src/time';
import Task, { TaskMode } from '../../src/task';

export type AuthorizersInput = {
  Vault: string;
  MockBasicAuthorizer: string;
  rootTransferDelay: number;
};

const vaultTask = new Task('20230117-vault', TaskMode.READ_ONLY);
export default {
  Vault: vaultTask,
  MockBasicAuthorizer: vaultTask,
  rootTransferDelay: WEEK,
};
