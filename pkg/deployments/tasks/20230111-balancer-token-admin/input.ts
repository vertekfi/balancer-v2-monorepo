import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { BigNumber } from 'ethers';
import { Task, TaskMode } from '../../src';

export type TokenAdminDeployment = {
  vault: string;
  governanceToken: string;
  initialMintAllowance: BigNumber;
};

const govTokenTask = new Task('20230111-governance-token', TaskMode.READ_ONLY, 'goerli');
const vaultTask = new Task('20221229-vault', TaskMode.READ_ONLY, 'goerli');

const input: TokenAdminDeployment = {
  vault: vaultTask.output({ ensure: true, network: 'goerli' }).Vault,
  governanceToken: govTokenTask.output({ ensure: true, network: 'goerli' }).GovernanceToken,
  initialMintAllowance: fp(1250000),
};

export default input;
