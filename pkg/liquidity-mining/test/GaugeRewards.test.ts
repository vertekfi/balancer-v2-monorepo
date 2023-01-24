import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Contract } from 'ethers';
import { ethers } from 'hardhat';

import { deploy, deployedAt } from '@balancer-labs/v2-helpers/src/contract';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { expect } from 'chai';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

describe('GaugeRewards', () => {
  let vault: Vault;
  let gaugeFactory: Contract;
  let lpToken: Contract;
  let rewardToken: Contract;

  let admin: SignerWithAddress, other: SignerWithAddress;

  before('setup signers', async () => {
    [, admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach('setup mock contracts', async () => {
    vault = await Vault.create({ admin });

    rewardToken = await deploy('v2-solidity-utils/ERC20Mock', {
      args: ['', ''],
    });

    lpToken = await deploy('v2-solidity-utils/ERC20Mock', {
      args: ['', ''],
    });

    const votingEscrow = await deploy('VotingEscrow', {
      args: [lpToken.address, '', '', vault.authorizerAdaptor.address],
    });
    // Can't use zero for ve contract here
    const gaugeController = await deploy('MockGaugeController', {
      args: [votingEscrow.address, vault.authorizerAdaptor.address],
    });

    const balToken = await deploy('TestBalancerToken', {
      args: [admin.address, 'TestBalancerToken', 'TestBalancerToken'],
    });

    const tokenAdmin = await deploy('MockBalancerTokenAdmin', {
      args: [vault.address, balToken.address],
    });

    const balMinter = await deploy('MockBalancerMinter', {
      args: [tokenAdmin.address, gaugeController.address],
    });

    const veDelegation = await deploy('MockVeDelegation');

    // Factor and gauge are not mocked here

    const gaugeImplementation = await deploy('LiquidityGaugeV5', {
      args: [balMinter.address, veDelegation.address, vault.authorizerAdaptor.address],
    });

    gaugeFactory = await deploy('LiquidityGaugeFactory', { args: [gaugeImplementation.address] });
  });

  async function authorizeCall(gauge: Contract, functionName: string) {
    const action = await actionId(vault.authorizerAdaptor, functionName, gauge.interface);
    await vault.grantPermissionsGlobally([action], admin);
  }

  async function deployGauge(): Promise<Contract> {
    const tx = await gaugeFactory.create(lpToken.address, BigNumber.from(0));
    const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
    const gauge = await deployedAt('LiquidityGaugeV5', event.args.gauge);
    return gauge;
  }

  describe('Adding reward to gauge', () => {
    let gauge: Contract;

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
    });

    sharedBeforeEach('authorize to add reward token', async () => {
      await authorizeCall(gauge, 'add_reward');
    });

    it('adds a reward token to a gauge', async () => {
      const calldata = gauge.interface.encodeFunctionData('add_reward', [rewardToken.address, admin.address]);
      await vault.authorizerAdaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
    });

    it('deposits a reward token to a gauge', async () => {
      console.log(gauge.address);
      console.log(vault.authorizerAdaptorEntrypoint.address);
      console.log(vault.authorizerAdaptor.address);

      const calldata = gauge.interface.encodeFunctionData('add_reward', [rewardToken.address, admin.address]);
      await vault.authorizerAdaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);

      const amount = fp(100);
      await rewardToken.mint(admin.address, amount);
      await rewardToken.connect(admin).approve(gauge.address, amount);
      await gauge.connect(admin).deposit_reward_token(rewardToken.address, amount);
    });
  });
});
