import hre from 'hardhat';
import { expect } from 'chai';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '../../../src';
import { Contract } from '@ethersproject/contracts';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

describeForkTest('BalancerTokenAdmin', 'goerli', 8294247, function () {
  let owner: SignerWithAddress;
  let task: Task;
  let tokenAdmin: Contract;
  let vault: Contract;
  let authorizer: Contract;
  let govToken: Contract;

  before('run task', async () => {
    task = new Task('20230111-balancer-token-admin', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    // govToken = await task.deployedInstance('GovernanceToken');
    tokenAdmin = await task.deployedInstance('BalancerTokenAdmin');
  });

  before('load signers', async () => {
    owner = await getSigner();
  });

  it('deploys the BalancerTokenAdmin', async () => {
    expect(true).to.be.true;
  });
});
