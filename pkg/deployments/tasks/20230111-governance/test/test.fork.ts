import hre from 'hardhat';
import { expect } from 'chai';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '../../../src';
import { Contract } from '@ethersproject/contracts';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

describeForkTest('WeightedPoolFactory', 'goerli', 8294247, function () {
  let owner: SignerWithAddress;
  let task: Task;
  let factory: Contract, vault: Contract, authorizer: Contract, wbnb: Contract, busd: Contract;

  before('run task', async () => {
    task = new Task('20230111-governance', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance('WeightedPoolFactory');
  });

  before('load signers', async () => {
    owner = await getSigner();
  });
});
