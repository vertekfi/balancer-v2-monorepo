import hre from 'hardhat';
import { expect } from 'chai';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '../../../src';
import { Contract } from '@ethersproject/contracts';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { getAddress } from '@ethersproject/address';

describeForkTest('BalancerTokenAdmin', 'goerli', 8294247, function () {
  let owner: SignerWithAddress;
  let task: Task;
  let tokenAdmin: Contract;
  let vault: Contract;
  let govToken: Contract;

  before('run task', async () => {
    task = new Task('20230111-balancer-token-admin', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    const govTokenTask = new Task('20230111-governance-token', TaskMode.TEST, getForkedNetwork(hre));
    vault = await new Task('20221229-vault', TaskMode.TEST, getForkedNetwork(hre)).deployedInstance('Vault');

    govToken = await govTokenTask.deployedInstance('GovernanceToken');
    tokenAdmin = await task.deployedInstance('BalancerTokenAdmin');
  });

  before('load signers', async () => {
    owner = await getSigner();
  });

  it('was given the correct constructor arguments', async () => {
    expect(getAddress(await tokenAdmin.getBalancerToken())).to.equal(getAddress(govToken.address));
    expect(getAddress(await tokenAdmin.getVault())).to.equal(getAddress(vault.address));
  });
});
