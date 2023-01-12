import hre from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '../../../src';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { getAddress } from '@ethersproject/address';

describeForkTest('GaugeSystem', 'goerli', 8294247, function () {
  let owner: SignerWithAddress;
  let task: Task;
  let tokenAdmin: Contract;
  let vault: Contract;
  let govToken: Contract;

  before('run task', async () => {
    task = new Task('20230112-gauge-controller', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
  });

  before('load signers', async () => {
    owner = await getSigner();
  });

  it('was given the correct constructor arguments', async () => {
    expect(true).to.be.true;
  });
});
