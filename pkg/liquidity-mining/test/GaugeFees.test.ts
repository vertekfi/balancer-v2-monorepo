import { ethers } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { deploy, deployedAt } from '@balancer-labs/v2-helpers/src/contract';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import { expect } from 'chai';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { formatEther } from 'ethers/lib/utils';

describe('LiquidityGaugeV5', () => {
  let vault: Vault;
  let gaugeController: Contract;
  let gaugeFactory: Contract;
  let adaptorEntrypoint: Contract;
  let lpToken: Contract;

  let admin: SignerWithAddress, other: SignerWithAddress;

  before('setup signers', async () => {
    [, admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach('setup mock contracts', async () => {
    vault = await Vault.create({ admin });
    const adaptor = vault.authorizerAdaptor;
    adaptorEntrypoint = vault.authorizerAdaptorEntrypoint;

    // Mock items not relevant to current fee testing

    lpToken = await deploy('v2-solidity-utils/ERC20Mock', {
      args: ['token', 'token'],
    });

    const votingEscrow = await deploy('VotingEscrow', {
      args: [lpToken.address, '', '', adaptor.address],
    });
    // Can't use zero for ve contract here
    gaugeController = await deploy('MockGaugeController', { args: [votingEscrow.address, adaptor.address] });

    const veDelegation = await deploy('MockVeDelegation');
    const balToken = await deploy('TestBalancerToken', {
      args: [admin.address, 'TestBalancerToken', 'TestBalancerToken'],
    });
    const tokenAdmin = await deploy('MockBalancerTokenAdmin', {
      args: [vault.address, balToken.address],
    });

    const balMinter = await deploy('MockBalancerMinter', {
      args: [tokenAdmin.address, gaugeController.address],
    });

    const gaugeImplementation = await deploy('LiquidityGaugeV5', {
      args: [balMinter.address, veDelegation.address, adaptor.address],
    });

    gaugeFactory = await deploy('MockLiquidityGaugeFactory', { args: [gaugeImplementation.address] });
    await gaugeController.add_type('Ethereum', 0);
  });

  async function deployGauge(): Promise<Contract> {
    // cap doesn't matter for this
    const tx = await gaugeFactory.create(lpToken.address, BigNumber.from(0));
    const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');

    const gauge = await deployedAt('LiquidityGaugeV5', event.args.gauge);

    // Throw it on mock controller while we're here
    await gaugeController.add_gauge(gauge.address, 0);

    return gauge;
  }

  async function doUserDeposit(gauge: Contract, amount: BigNumber) {
    // Give user tokens to deposit
    await lpToken.mint(other.address, amount);
    await lpToken.connect(other).approve(gauge.address, amount);

    await gauge.connect(other)['deposit(uint256)'](amount);

    // expect(await gauge.balanceOf(other.address)).to.equal(amount);
  }

  describe('setting deposit fee', () => {
    let gauge: Contract;

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
    });

    it('starts at zero', async () => {
      expect(await gauge.getDepositFee()).to.equal(0);
    });

    context('when caller is not authorized', () => {
      it('reverts', async () => {
        await expect(gauge.connect(other).setDepositFee(0)).to.be.revertedWith('Unauthorized');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        const setDepositFeeAction = await actionId(vault.authorizerAdaptor, 'setDepositFee', gauge.interface);

        await vault.grantPermissionsGlobally([setDepositFeeAction], admin);
      });

      it('sets the deposit fee', async () => {
        const fee = 100;
        const calldata = gauge.interface.encodeFunctionData('setDepositFee', [fee]);
        await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);

        expect(await gauge.getDepositFee()).to.equal(fee);
      });

      it('can not be set above max cap', async () => {
        const max = (await gauge.getMaxDepositFee()).toNumber();
        const fee = max + 1;
        const calldata = gauge.interface.encodeFunctionData('setDepositFee', [fee]);

        await expect(adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata)).to.be.revertedWith(
          'Fee exceeds allowed maximum'
        );
      });

      it('emits fee update event', async () => {});
    });
  });

  describe('setting withdraw fee', () => {
    let gauge: Contract;

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
    });

    it('starts at zero', async () => {
      expect(await gauge.getWithdrawFee()).to.equal(0);
    });

    context('when caller is not authorized', () => {
      it('reverts', async () => {
        await expect(gauge.connect(other).setWithdrawFee(0)).to.be.revertedWith('Unauthorized');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        const setWithdrawFeeAction = await actionId(vault.authorizerAdaptor, 'setWithdrawFee', gauge.interface);
        await vault.grantPermissionsGlobally([setWithdrawFeeAction], admin);
      });

      it('sets the withdraw fee', async () => {
        const fee = 100;
        const calldata = gauge.interface.encodeFunctionData('setWithdrawFee', [fee]);
        await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);

        expect(await gauge.getWithdrawFee()).to.equal(fee);
      });

      it('can not be set above max cap', async () => {
        const maxWithdraw = (await gauge.getMaxWithdrawFee()).toNumber();
        const fee = maxWithdraw + 1;
        const calldata = gauge.interface.encodeFunctionData('setWithdrawFee', [fee]);

        await expect(adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata)).to.be.revertedWith(
          'Fee exceeds allowed maximum'
        );
      });

      it('emits fee update event', async () => {});
    });
  });

  describe('user deposit', () => {
    let gauge: Contract;
    const amount = fp(100);

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
      await doUserDeposit(gauge, amount);
    });

    context('when deposit fee is not set', () => {
      it('does not takes a deposit fee', async () => {
        // sanity check
        expect(await gauge.getDepositFee()).to.equal(0);
      });
    });

    context('when deposit fee is set', () => {
      it('takes the current deposit fee', async () => {});

      it('correctly credits user lp token balance', async () => {});

      it('updates pending accumulated protocol fees', async () => {});
    });
  });

  describe('user withdraw', () => {
    let gauge: Contract;

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
    });

    context('when withdraw fee is not set', () => {
      it('does not takes a withdraw fee', async () => {
        // sanity check
        expect(await gauge.getWithdrawFee()).to.equal(0);
      });

      it('gives the user the correct lp token amount', async () => {});
    });

    context('when withdraw fee is set', () => {
      it('takes the current withdraw fee', async () => {});

      it('gives the user the correct lp token amount', async () => {});

      it('updates pending accumulated protocol fees', async () => {});
    });
  });

  describe('withdrawing accumulated fees', () => {
    context('when caller is not authorized', () => {
      it('reverts', async () => {
        // await expect(gaugeAdder.connect(other).addEthereumGauge(gauge)).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        // const action = await actionId(gaugeAdder, 'addEthereumGauge');
        // await vault.grantPermissionsGlobally([action], admin);
      });

      it('transfers pending accumulated fees to the protocol fees collector', async () => {
        // there is a withdrawCollectedFees on the Vault class instance for this
      });

      it('sets pending accumulated fees to zero', async () => {});
    });
  });
});
