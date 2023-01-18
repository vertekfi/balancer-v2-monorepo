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

  sharedBeforeEach('deploy authorizer', async () => {
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
  });

  sharedBeforeEach('set up permissions', async () => {
    const setDepositFeeAction = await actionId(adaptorEntrypoint, 'setDepositFee', gaugeImplementation.interface);
    await vault.grantPermissionsGlobally([setDepositFeeAction], gaugeImplementation);

    const setWithdrawFeeAction = await actionId(adaptorEntrypoint, 'setWithdrawFee', gaugeImplementation.interface);
    await vault.grantPermissionsGlobally([setWithdrawFeeAction], gaugeImplementation);
  });

  describe('user deposit', () => {
    context('when deposit fee is set', () => {
      it('takes the deposit fee', async () => {
        // await expect(
        //   gaugeAdder.connect(other).addGaugeFactory(gaugeFactory.address, GaugeType.Ethereum)
        // ).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });

    context('when deposit fee is not set', () => {
      it('does not takes a deposit fee', async () => {
        // await expect(
        //   gaugeAdder.connect(other).addGaugeFactory(gaugeFactory.address, GaugeType.Ethereum)
        // ).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });
  });

  describe('user withdraw', () => {
    context('when withdraw fee is set', () => {
      it('takes the correct withdraw fee', async () => {
        // await expect(
        //   gaugeAdder.connect(other).addGaugeFactory(gaugeFactory.address, GaugeType.Ethereum)
        // ).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });

    context('when withdraw fee is not set', () => {
      it('does not takes a withdraw fee', async () => {
        // await expect(
        //   gaugeAdder.connect(other).addGaugeFactory(gaugeFactory.address, GaugeType.Ethereum)
        // ).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });
  });

  describe('setting deposit fee', () => {
    context('when caller is not authorized', () => {
      it('reverts', async () => {
        //  await expect(gaugeAdder.connect(other).addEthereumGauge(gauge)).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        // const action = await actionId(gaugeAdder, 'addEthereumGauge');
        // await vault.grantPermissionsGlobally([action], admin);
      });

      it('sets the deposit fee', async () => {});
    });
  });

  describe('setting withdraw fee', () => {
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

      it('sets the withdraw fee', async () => {});
    });
  });
});
