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
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

const FEE_DENOMINATOR = 10000;

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

  async function doOtherUserDeposit(gauge: Contract, amount: BigNumber): Promise<ContractReceipt> {
    // Give user tokens to deposit
    await lpToken.mint(other.address, amount);
    await lpToken.connect(other).approve(gauge.address, amount);
    const tx = await gauge.connect(other)['deposit(uint256)'](amount);
    return tx.wait();
  }

  async function authorizeCall(gauge: Contract, functionName: string) {
    const action = await actionId(vault.authorizerAdaptor, functionName, gauge.interface);
    await vault.grantPermissionsGlobally([action], admin);
  }

  async function authorizeAndSetFeeAmount(
    gauge: Contract,
    feeSetterFunctionName: string,
    fee: number
  ): Promise<ContractReceipt> {
    await authorizeCall(gauge, feeSetterFunctionName);
    const calldata = gauge.interface.encodeFunctionData(feeSetterFunctionName, [fee]);
    const tx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
    return tx.wait();
  }

  async function updateOtherUserFeeExemption(gauge: Contract, exempt: boolean) {
    await authorizeCall(gauge, 'updateFeeExempt');
    const calldata = gauge.interface.encodeFunctionData('updateFeeExempt', [other.address, exempt]);
    const tx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
    return tx.wait();
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

  describe('fee exemption', () => {
    let gauge: Contract;

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
    });

    describe('setting fee exemptions', () => {
      context('when caller is not authorized', () => {
        it('reverts', async () => {
          await expect(gauge.connect(other).updateFeeExempt(ZERO_ADDRESS, true)).to.be.revertedWith('Unauthorized');
        });
      });

      context('when caller is authorized', () => {
        it('updates fee exempt status', async () => {
          expect(await gauge.isFeeExempt(other.address)).to.be.false;
          await updateOtherUserFeeExemption(gauge, true);
          expect(await gauge.isFeeExempt(other.address)).to.be.true;
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
        const depositFee = 500; // 5%
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

      it('emits events with proper argument values', async () => {
        const depositFee = 500; // 5%
        await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);

        const userDepositAmount = fp(100);
        const receipt = await doOtherUserDeposit(gauge, userDepositAmount);

        const feeDeductionAmount = userDepositAmount.mul(depositFee).div(FEE_DENOMINATOR);

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'FeeCharged', {
          fee_amount: feeDeductionAmount,
          fee_type: 0,
        });
      });

      it('correctly updates gauge total supply', async () => {
        // regular deposit with no fees
        const userDepositAmount = fp(10);
        await doOtherUserDeposit(gauge, userDepositAmount);
        expect(await gauge.totalSupply()).to.equal(userDepositAmount);

        // set fee before next deposit
        const depositFee = 1000; // 10%
        await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);

        // deposit again after fee is set
        const userAdditionalDepositAmount = fp(20);
        await doOtherUserDeposit(gauge, userAdditionalDepositAmount);

        // assert expected total supply
        const actualTotalSupply = await gauge.totalSupply();
        const userBalance = await gauge.balanceOf(other.address);

        // These should line up, as totaly supply is directly tied to amounts deposited (accounting for fees)
        expect(actualTotalSupply).to.equal(userBalance);
      });

      it('updates pending accumulated protocol fees', async () => {
        const depositFee = 1000; // 10%
        await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);

        const totalUserDeposits = fp(100);
        await doOtherUserDeposit(gauge, totalUserDeposits);

        // Total supply should be the difference between user deposits minus any fees
        // So total supply plus pending fees should be equal to actual total user deposits
        const actualTotalSupply = await gauge.totalSupply();
        const pendingFees = await gauge.getAccumulatedFees();

        expect(actualTotalSupply.add(pendingFees)).to.equal(totalUserDeposits);
      });

      context('when account is fee exempt', () => {
        sharedBeforeEach('authorizing updateFeeExempt', async () => {
          await authorizeCall(gauge, 'updateFeeExempt');
        });

        it('does not take a fee', async () => {
          // Set exempt first
          await updateOtherUserFeeExemption(gauge, true);

          // Doesn't matter what fee is, just as long as one is set
          await authorizeAndSetFeeAmount(gauge, 'setDepositFee', 100);

          // Use should get credited for full deposit amount despite fee being set
          const amount = fp(100);
          await doOtherUserDeposit(gauge, amount);
          expect(await gauge.balanceOf(other.address)).to.equal(amount);
        });
      });

      context('when account is not fee exempt', () => {
        it('it takes a fee', async () => {
          const fee = 1000;
          await authorizeAndSetFeeAmount(gauge, 'setDepositFee', fee);

          const amount = fp(100);
          await doOtherUserDeposit(gauge, amount);
          // quick check since we already verified this behavior above
          const userBalance = await gauge.balanceOf(other.address);
          expect(userBalance.lt(amount)).to.be.true;
        });
      });
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

      it('gives the user the correct lp token amount', async () => {
        // do normal deposit
        // regular deposit with no fees
        const userDepositAmount = fp(10);
        await doOtherUserDeposit(gauge, userDepositAmount);
        expect(await lpToken.balanceOf(other.address)).to.equal(0);

        // do withdraw
        await gauge.connect(other)['withdraw(uint256)'](await gauge.balanceOf(other.address));
        // amount out should be same as in
        expect(await lpToken.balanceOf(other.address)).to.equal(userDepositAmount);
      });
    });

    context('when withdraw fee is set', () => {
      const withdrawFee = 1000;

      sharedBeforeEach('create gauge', async () => {
        await authorizeAndSetFeeAmount(gauge, 'setWithdrawFee', withdrawFee);
      });

      it('takes the current withdraw fee', async () => {
        const userDepositAmount = fp(10);
        await doOtherUserDeposit(gauge, userDepositAmount);

        await gauge.connect(other)['withdraw(uint256)'](await gauge.balanceOf(other.address));

        const walletBalance = await lpToken.balanceOf(other.address);
        const feeAmount = userDepositAmount.mul(withdrawFee).div(FEE_DENOMINATOR);
        // amount out should be original deposit amount minus fee
        const expectedWalledBalance = userDepositAmount.sub(feeAmount);
        expect(walletBalance).to.equal(expectedWalledBalance);
      });

      it('emits events with proper argument values', async () => {
        const userDepositAmount = fp(10);
        await doOtherUserDeposit(gauge, userDepositAmount);

        const tx = await gauge.connect(other)['withdraw(uint256)'](await gauge.balanceOf(other.address));
        const feeAmount = userDepositAmount.mul(withdrawFee).div(FEE_DENOMINATOR);

        const amountTransferedToUser = userDepositAmount.sub(feeAmount);
        const receipt = await tx.wait();

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'FeeCharged', {
          fee_amount: feeAmount,
          fee_type: 1,
        });

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'Transfer', {
          _value: amountTransferedToUser,
        });

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'Withdraw', {
          provider: other.address,
          value: userDepositAmount,
        });
      });

      it('updates the total supply', async () => {
        const userDepositAmount = fp(10);
        await doOtherUserDeposit(gauge, userDepositAmount);

        let totalSupply = await gauge.totalSupply();

        // No fee on deposit
        expect(totalSupply).to.equal(userDepositAmount);

        // user withdraws with fee set
        const withdrawAmount = await gauge.balanceOf(other.address);
        await gauge.connect(other)['withdraw(uint256)'](withdrawAmount);

        // total supply should be zero
        totalSupply = await gauge.totalSupply();
        expect(totalSupply).to.equal(0);
      });

      it('updates pending accumulated protocol fees', async () => {
        await doOtherUserDeposit(gauge, fp(100));

        // Partial withdraw amount to mix it up
        const withdrawAmount: BigNumber = (await gauge.balanceOf(other.address)).div(2);
        await gauge.connect(other)['withdraw(uint256)'](withdrawAmount);

        const pendingFees = await gauge.getAccumulatedFees();
        const expectedFeeAmount = withdrawAmount.mul(withdrawFee).div(FEE_DENOMINATOR);

        expect(pendingFees).to.equal(expectedFeeAmount);
      });

      context('when gauge is killed', () => {
        it('does not take a fee', async () => {
          const userDepositAmount = fp(10);
          await doOtherUserDeposit(gauge, userDepositAmount);

          await authorizeCall(gauge, 'killGauge');
          const calldata = gauge.interface.encodeFunctionData('killGauge');
          await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);

          // withdraw fee is set in sharedBeforeEach
          await gauge.connect(other)['withdraw(uint256)'](userDepositAmount);
          // even though fee is set user should still get full balance without a fee
          expect(await lpToken.balanceOf(other.address)).to.equal(userDepositAmount);
        });
      });

      context('when account is fee exempt', () => {
        sharedBeforeEach('authorizing updateFeeExempt', async () => {
          await authorizeCall(gauge, 'updateFeeExempt');
        });

        it('does not take a fee', async () => {
          // Set user exempt
          await updateOtherUserFeeExemption(gauge, true);

          const depositAmount = fp(100);
          await doOtherUserDeposit(gauge, depositAmount);
          await gauge.connect(other)['withdraw(uint256)'](depositAmount);

          // User should get credited for full withdraw amount despite fee being set
          expect(await lpToken.balanceOf(other.address)).to.equal(depositAmount);
        });
      });
    });
  });

  describe('withdrawing accumulated fees', () => {
    const depositFee = 500; // 5%
    const userDepositAmount = fp(100);
    let gauge: Contract;

    async function doFeeWithdraw() {
      const calldata = gauge.interface.encodeFunctionData('withdrawFees');
      const tx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
      return await tx.wait();
    }

    sharedBeforeEach('create gauge', async () => {
      gauge = await deployGauge();
      await authorizeAndSetFeeAmount(gauge, 'setDepositFee', depositFee);
    });

    context('when caller is not authorized', () => {
      it('reverts', async () => {
        await expect(gauge.connect(other).withdrawFees()).to.be.revertedWith('Unauthorized');
      });
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {
        await authorizeCall(gauge, 'withdrawFees');
      });

      it('transfers pending accumulated fees to the protocol fees collector', async () => {
        await doOtherUserDeposit(gauge, userDepositAmount);
        await doFeeWithdraw();

        const feeDeductionAmount = userDepositAmount.mul(depositFee).div(FEE_DENOMINATOR);
        expect(await lpToken.balanceOf(await gauge.getProtocolFeesCollector())).to.equal(feeDeductionAmount);
      });

      it('sets pending accumulated fees to zero', async () => {
        await doOtherUserDeposit(gauge, userDepositAmount);

        const feeDeductionAmount = userDepositAmount.mul(depositFee).div(FEE_DENOMINATOR);
        expect(await gauge.getAccumulatedFees()).to.equal(feeDeductionAmount);

        await doFeeWithdraw();
        expect(await gauge.getAccumulatedFees()).to.equal(0);
      });

      it('emits events with proper argument values', async () => {
        await doOtherUserDeposit(gauge, userDepositAmount);
        const receipt = await doFeeWithdraw();

        const feeDeductionAmount = userDepositAmount.mul(depositFee).div(FEE_DENOMINATOR);

        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'FeesWithdraw', {
          amount: feeDeductionAmount,
        });
      });
    });
  });
});
