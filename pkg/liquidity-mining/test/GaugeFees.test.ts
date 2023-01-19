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
    return await tx.wait();
  }

  async function updateFeeExemption(gauge: Contract, exempt: boolean) {
    await authorizeCall(gauge, 'updateFeeExempt');
    const calldata = gauge.interface.encodeFunctionData('updateFeeExempt', [other.address, exempt]);
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

      it('updates user balance over multiple deposits and fee updates', async () => {});

      it('accounts for decimal precision', async () => {});

      it('updates pending accumulated protocol fees', async () => {});

      context('when account is fee exempt', () => {
        sharedBeforeEach('authorizing updateFeeExempt', async () => {
          await authorizeCall(gauge, 'updateFeeExempt');
        });

        it('does not take a fee', async () => {
          // Set exempt first
          await updateFeeExemption(gauge, true);

          // Doesn't matter what fee is, just as long as one is set
          await authorizeAndSetFeeAmount(gauge, 'setDepositFee', 100);

          // Use should get credited for full deposit amount despite fee being set
          const amount = fp(100);
          await doOtherUserDeposit(gauge, amount);
          expect(await gauge.balanceOf(other.address)).to.equal(amount);
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

      it('gives the user the correct lp token amount', async () => {});
    });

    context('when withdraw fee is set', () => {
      it('takes the current withdraw fee', async () => {});

      it('gives the user the correct lp token amount', async () => {});

      it('accounts for decimal precision', async () => {});

      it('updates pending accumulated protocol fees', async () => {});

      context('when gauge is killed', () => {
        it('does not take a deposit fee', async () => {});
      });

      context('when account is fee exempt', () => {
        sharedBeforeEach('authorizing updateFeeExempt', async () => {
          await authorizeCall(gauge, 'updateFeeExempt');
        });

        it('does not take a fee', async () => {});
      });
    });
  });

  describe('withdrawing accumulated fees', () => {
    context('when caller is not authorized', () => {
      it('reverts', async () => {});
    });

    context('when caller is authorized', () => {
      sharedBeforeEach('authorize caller', async () => {});

      it('transfers pending accumulated fees to the protocol fees collector', async () => {});

      it('sets pending accumulated fees to zero', async () => {});
    });
  });

  describe('fee exemption', () => {
    describe('setting fee exemptions', () => {
      context('when caller is not authorized', () => {
        it('reverts', async () => {});
      });

      context('when caller is authorized', () => {
        it('reverts', async () => {});
      });
    });

    describe('account actions', () => {
      context('when address is not fee exempt', () => {
        it('charges a fee', async () => {});
      });

      context('when address is fee exempt', () => {
        it('does dont charge a fee', async () => {});
      });
    });
  });
});
