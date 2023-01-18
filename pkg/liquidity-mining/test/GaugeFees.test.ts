import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import { expect } from 'chai';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { ANY_ADDRESS, ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { GaugeType } from '@balancer-labs/balancer-js/src/types';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';

describe('LiquidityGaugeV5', () => {
  let vault: Vault;
  let gaugeController: Contract;
  let gaugeImplementation: Contract;
  let gaugeFactory: Contract;
  let adaptorEntrypoint: Contract;

  let admin: SignerWithAddress, other: SignerWithAddress;

  before('setup signers', async () => {
    [, admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach('create gauge', async () => {
    vault = await Vault.create({ admin });
    const adaptor = vault.authorizerAdaptor;
    adaptorEntrypoint = vault.authorizerAdaptorEntrypoint;

    // Mock items not relevant to current fee testing

    gaugeController = await deploy('MockGaugeController', { args: [ZERO_ADDRESS, adaptor.address] });

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

    gaugeImplementation = await deploy('LiquidityGaugeV5', {
      args: [balMinter.address, veDelegation.address, adaptor.address],
    });
    gaugeFactory = await deploy('MockLiquidityGaugeFactory', { args: [gaugeImplementation.address] });

    await gaugeController.add_type('Ethereum', 0);
    await gaugeController.add_gauge(gaugeImplementation.address, 0);
  });

  describe('setting deposit fee', () => {
    it('starts at zero', async () => {
      expect(await gaugeImplementation.getDepositFee()).to.equal(0);
    });

    context('when caller is not authorized', () => {
      it('reverts', async () => {
        await expect(gaugeImplementation.connect(other).setDepositFee(0)).to.be.revertedWith('Unauthorized');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        const setDepositFeeAction = await actionId(
          vault.authorizerAdaptor,
          'setDepositFee',
          gaugeImplementation.interface
        );

        await vault.grantPermissionsGlobally([setDepositFeeAction], admin);
      });

      it('sets the deposit fee', async () => {
        const fee = 100;
        const calldata = gaugeImplementation.interface.encodeFunctionData('setDepositFee', [fee]);
        await adaptorEntrypoint.connect(admin).performAction(gaugeImplementation.address, calldata);

        expect(await gaugeImplementation.getDepositFee()).to.equal(fee);
      });

      it('can not be set above max cap', async () => {
        const max = (await gaugeImplementation.getMaxDepositFee()).toNumber();
        const fee = max + 1;
        const calldata = gaugeImplementation.interface.encodeFunctionData('setDepositFee', [fee]);

        await expect(
          adaptorEntrypoint.connect(admin).performAction(gaugeImplementation.address, calldata)
        ).to.be.revertedWith('Fee exceeds allowed maximum');
      });
    });
  });

  describe('setting withdraw fee', () => {
    it('starts at zero', async () => {
      expect(await gaugeImplementation.getWithdrawFee()).to.equal(0);
    });

    context('when caller is not authorized', () => {
      it('reverts', async () => {
        await expect(gaugeImplementation.connect(other).setWithdrawFee(0)).to.be.revertedWith('Unauthorized');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        const setWithdrawFeeAction = await actionId(
          vault.authorizerAdaptor,
          'setWithdrawFee',
          gaugeImplementation.interface
        );
        await vault.grantPermissionsGlobally([setWithdrawFeeAction], admin);
      });

      it('sets the withdraw fee', async () => {
        const fee = 100;
        const calldata = gaugeImplementation.interface.encodeFunctionData('setWithdrawFee', [fee]);
        await adaptorEntrypoint.connect(admin).performAction(gaugeImplementation.address, calldata);

        expect(await gaugeImplementation.getWithdrawFee()).to.equal(fee);
      });

      it('can not be set above max cap', async () => {
        const maxWithdraw = (await gaugeImplementation.getMaxWithdrawFee()).toNumber();
        const fee = maxWithdraw + 1;
        const calldata = gaugeImplementation.interface.encodeFunctionData('setWithdrawFee', [fee]);

        await expect(
          adaptorEntrypoint.connect(admin).performAction(gaugeImplementation.address, calldata)
        ).to.be.revertedWith('Fee exceeds allowed maximum');
      });
    });
  });

  describe('user deposit', () => {
    context('when deposit fee is not set', () => {
      it('does not takes a deposit fee', async () => {});

      it('correctly credits user lp token balance', async () => {});
    });

    context('when deposit fee is set', () => {
      it('takes the current deposit fee', async () => {});

      it('correctly credits user lp token balance', async () => {});

      it('updates pending accumulated protocol fees', async () => {});
    });
  });

  describe('user withdraw', () => {
    context('when withdraw fee is not set', () => {
      it('does not takes a withdraw fee', async () => {});

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

      it('transfers pending accumulated fees to the protocol fee collector', async () => {
        // there is a withdrawCollectedFees on the Vault class instance for this
      });

      it('sets pending accumulated fees to zero', async () => {});
    });
  });
});
