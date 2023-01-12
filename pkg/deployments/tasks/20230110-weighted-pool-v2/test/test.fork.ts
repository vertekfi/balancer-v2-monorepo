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
  let factory: Contract;
  let vault: Contract;
  let authorizer: Contract;

  const NAME = 'Weighted Pool';
  const SYMBOL = NAME;
  const WBNB = '0xe4E96Cf369D4d604Bedc4d7962F94D53E4B5e3C6';
  const BUSD = '0x7faA8158FaA037CC7516eF1f6864af44d75654AE';

  const tokens = [BUSD, WBNB];
  const weights = [fp(0.5), fp(0.5)];
  const rateProviders = [ZERO_ADDRESS, ZERO_ADDRESS];
  const swapFeePercentage = fp(0.01);

  before('run task', async () => {
    task = new Task('20230110-weighted-pool-v2', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance('WeightedPoolFactory');
  });

  before('load signers', async () => {
    owner = await getSigner();
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20221229-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    authorizer = await vaultTask.deployedInstance('TimelockAuthorizer');
  });

  it('deploys', async () => {
    expect(await factory.isDisabled()).to.be.false;
  });

  describe('create and swap', () => {
    let pool: Contract;
    let poolId: string;

    it('deploys a weighted pool', async () => {
      const tx = await factory.create(NAME, SYMBOL, tokens, weights, rateProviders, swapFeePercentage, owner.address);
      const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');

      pool = await task.instanceAt('WeightedPool', event.args.pool);
      expect(await factory.isPoolFromFactory(pool.address)).to.be.true;

      poolId = await pool.getPoolId();
      const [registeredAddress] = await vault.getPool(poolId);
      expect(registeredAddress).to.equal(pool.address);
    });
  });
});
