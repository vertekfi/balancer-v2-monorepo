import hre from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '../../../src';

// Sanity check

describeForkTest('WeightedPoolFactory', 'goerli', 8294247, function () {
  let task: Task;

  before('run task', async () => {
    task = new Task('20230110-weighted-pool-v2', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
  });

  it('should deploy', async () => {
    const instance = await task.deployedInstance('WeightedPoolFactory');
    expect(await instance.isDisabled()).to.be.false;
  });
});
