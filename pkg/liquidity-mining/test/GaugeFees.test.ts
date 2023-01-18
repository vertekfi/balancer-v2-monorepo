import { ethers } from 'hardhat';
import { BigNumber, Contract, ContractReceipt } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { expectEqualWithError } from '@balancer-labs/v2-helpers/src/test/relativeError';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { deploy, deployedAt } from '@balancer-labs/v2-helpers/src/contract';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import { expect } from 'chai';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { formatEther } from 'ethers/lib/utils';

const FEE_DENOMINATOR = 10000000;

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

  async function doOtherUserDeposit(gauge: Contract, amount: BigNumber) {
    // Give user tokens to deposit
    await lpToken.mint(other.address, amount);
    await lpToken.connect(other).approve(gauge.address, amount);
    await gauge.connect(other)['deposit(uint256)'](amount);
  }

  async function authorizeAndSetFeeAmount(
    gauge: Contract,
    feeSetterFunctionName: string,
    fee: number
  ): Promise<ContractReceipt> {
    const action = await actionId(vault.authorizerAdaptor, feeSetterFunctionName, gauge.interface);
    await vault.grantPermissionsGlobally([action], admin);

    const calldata = gauge.interface.encodeFunctionData(feeSetterFunctionName, [fee]);
    const tx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
    return await tx.wait();
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
      it('sets the deposit fee', async () => {
        const fee = 100;
        await authorizeAndSetFeeAmount(gauge, 'setDepositFee', fee);

        expect(await gauge.getDepositFee()).to.equal(fee);
      });

      it('can not be set above max cap', async () => {
        const max = (await gauge.getMaxDepositFee()).toNumber();
        const aboveMaxFee = max + 1;

        await expect(authorizeAndSetFeeAmount(gauge, 'setDepositFee', aboveMaxFee)).to.be.revertedWith(
          'Fee exceeds allowed maximum'
        );
      });

      it('emits deposit fee update event', async () => {
        const fee = 100;
        const receipt = await authorizeAndSetFeeAmount(gauge, 'setDepositFee', fee);

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'DepositFeeChanged', {
          new_deposit_fee: fee,
        });
      });
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
      it('sets the withdraw fee', async () => {
        const fee = 100;
        await authorizeAndSetFeeAmount(gauge, 'setWithdrawFee', fee);

        expect(await gauge.getWithdrawFee()).to.equal(fee);
      });

      it('can not be set above max cap', async () => {
        const maxWithdraw = (await gauge.getMaxWithdrawFee()).toNumber();
        const fee = maxWithdraw + 1;

        await expect(authorizeAndSetFeeAmount(gauge, 'setWithdrawFee', fee)).to.be.revertedWith(
          'Fee exceeds allowed maximum'
        );
      });

      it('emits withdraw fee update event', async () => {
        const fee = 100;
        const receipt = await authorizeAndSetFeeAmount(gauge, 'setWithdrawFee', fee);

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'WithdrawFeeChanged', {
          new_withdraw_fee: fee,
        });
      });
    });
  });

  describe('user deposit', () => {
    let gauge: Contract;

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
    });

    context('when deposit fee is not set', () => {
      it('does not takes a deposit fee', async () => {
        // sanity check
        expect(await gauge.getDepositFee()).to.equal(0);

        const amount = fp(100);
        await doOtherUserDeposit(gauge, amount);
        expect(await gauge.balanceOf(other.address)).to.equal(amount);
      });
    });

    context('when deposit fee is set', () => {
      sharedBeforeEach('create gauge', async () => {
        gauge = await deployGauge();
      });

      it('takes the current deposit fee', async () => {
        const depositFee = 500000; // 5%
        await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);

        const userDepositAmount = fp(100);
        await doOtherUserDeposit(gauge, userDepositAmount);

        // 5% of the 100 deposit should have be taken from user balance
        // before user balance state being set by the gauge
        const feeDeductionAmount = userDepositAmount.mul(depositFee).div(FEE_DENOMINATOR);
        const expectedBalanceAfterFees = userDepositAmount.sub(feeDeductionAmount);
        const userActualDepositBalance = await gauge.balanceOf(other.address);

        expect(userActualDepositBalance).to.equal(expectedBalanceAfterFees);
      });

      it('correctly updates gauge total supply', async () => {
        // // sanity check
        // expect(await gauge.getDepositFee()).to.equal(0);

        // regular deposit with no fees
        const userDepositAmount = fp(10);
        await doOtherUserDeposit(gauge, userDepositAmount);
        expect(await gauge.totalSupply()).to.equal(userDepositAmount);

        // set fee before next deposit
        const depositFee = 100000; // 1%
        await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);

        // deposit again after fee is set
        const userAdditionalDepositAmount = fp(20);
        await doOtherUserDeposit(gauge, userAdditionalDepositAmount);

        // assert expected total supply
        const userTotalIn = userDepositAmount.add(userAdditionalDepositAmount);
        const actualTotalSupply = await gauge.totalSupply();
        const userBalance = await gauge.balanceOf(other.address);
        const pendingFees = await gauge.getAccumulatedFees();

        // These should line up, as totaly supply is directly tied to amounts deposited (accounting for fees)
        expect(actualTotalSupply).to.equal(userBalance);
        expect(actualTotalSupply.add(pendingFees)).to.equal(userTotalIn);
      });

      it('updates user balance over multiple deposits and fee updates', async () => {
        // // for user and gauge since both are effect in the same way
        // // regular deposit with no fees
        // const userDepositAmount = fp(10);
        // await doOtherUserDeposit(gauge, userDepositAmount);
        // expect(await gauge.balanceOf(other.address)).to.equal(userDepositAmount);
        // expect(await gauge.totalSupply()).to.equal(userDepositAmount);
        // // set fee before next deposit
        // const depositFee = 100; // 1%
        // await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);
        // // deposit again after fee is set
        // const userAdditionalDepositAmount = fp(20);
        // await doOtherUserDeposit(gauge, userAdditionalDepositAmount);
        // // assert expected total supply
        // const expectedFeeDeductionAmount = userDepositAmount.mul(depositFee).div(FEE_DENOMINATOR);
        // const userCurrentTotalIn = userDepositAmount.add(userAdditionalDepositAmount);
        // const userCurrentTotalInAfterFees = userCurrentTotalIn.sub(expectedFeeDeductionAmount);
        // const actualUserBalance = await gauge.balanceOf(other.address);
        // expectEqualWithError(actualUserBalance, userCurrentTotalInAfterFees);
        // expect(await gauge.balanceOf(other.address)).to.equal(userCurrentTotalInAfterFees);
      });

      it('correctly credits user lp token balance', async () => {});

      it('updates pending accumulated protocol fees', async () => {});
    });

    context('when gauge is killed', () => {
      it('does not takes a deposit fee', async () => {});
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
