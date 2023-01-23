import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import { expectEqualWithError } from '@balancer-labs/v2-helpers/src/test/relativeError';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { expect } from 'chai';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { MAX_UINT256 } from '@balancer-labs/v2-helpers/src/constants';
import { BigNumber, fp } from '@balancer-labs/v2-helpers/src/numbers';
import { fromNow, ONE_YEAR_SECONDS } from '@balancer-labs/v2-helpers/src/time';
import { formatEther } from 'ethers/lib/utils';

describe('VE Admin', () => {
  let vault: Vault;
  let lpToken: Contract;

  let admin: SignerWithAddress;
  let other: SignerWithAddress;

  before('setup signers', async () => {
    [admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach('setup mock gauge system', async () => {
    vault = await Vault.create({ admin });
  });

  async function authorizeCall(instance: Contract, functionName: string) {
    const action = await actionId(vault.authorizerAdaptor, functionName, instance.interface);
    await vault.grantPermissionsGlobally([action], admin);
  }

  async function deployVotingEscrow() {
    lpToken = await deploy('v2-solidity-utils/ERC20Mock', {
      args: ['token', 'token'],
    });

    const votingEscrow = await deploy('VotingEscrow', {
      args: [lpToken.address, 'VE', 'VE', vault.authorizerAdaptor.address],
    });

    expect(await votingEscrow.token()).to.equal(lpToken.address);

    await lpToken.approve(votingEscrow.address, MAX_UINT256);
    await lpToken.mint(admin.address, fp(100000));

    return votingEscrow;
  }

  function logEther(value: BigNumber) {
    console.log(formatEther(value));
  }

  function getCalldata(instance: Contract, method: string, args: any[] = []) {
    return instance.interface.encodeFunctionData(method, args);
  }

  // async function setStakingAdmin(votingEscrow: Contract) {
  //   await authorizeCall(votingEscrow, 'setStakingAdmin');
  //   const calldata = getCalldata(votingEscrow, 'setStakingAdmin', [admin.address]);
  //   await vault.authorizerAdaptorEntrypoint.performAction(votingEscrow.address, calldata);
  // }

  async function doCreateOtherUserMaxLock(votingEscrow: Contract, lockAmount: BigNumber) {
    const lockEndTime = await fromNow(ONE_YEAR_SECONDS);
    const calldata = getCalldata(votingEscrow, 'admin_create_lock_for', [other.address, lockAmount, lockEndTime]);
    await vault.authorizerAdaptorEntrypoint.performAction(votingEscrow.address, calldata);
  }

  async function getOtherUserBalanceAtCurrentTimestamp(votingEscrow: Contract): Promise<BigNumber> {
    return votingEscrow['balanceOf(address, uint256)'](other.address, await time.latest());
  }

  describe('admin VE tasks', () => {
    describe('Initialization', () => {
      let votingEscrow: Contract;

      sharedBeforeEach('create voting escrow', async () => {
        votingEscrow = await deployVotingEscrow();
      });
      it('sets staking admin to message sender', async () => {
        expect(await votingEscrow.getStakingAdmin()).to.equal(admin.address);
      });
    });

    describe('creating locks for users', () => {
      let votingEscrow: Contract;

      context('creating locks for users', () => {
        sharedBeforeEach('create voting escrow', async () => {
          votingEscrow = await deployVotingEscrow();
        });

        sharedBeforeEach('authorize function calls', async () => {
          await authorizeCall(votingEscrow, 'admin_create_lock_for');
        });

        it('creates a lock for a user', async () => {
          const lockAmount = fp(1);
          await doCreateOtherUserMaxLock(votingEscrow, lockAmount);
          // Assert users new lock
          const otherBalance = await getOtherUserBalanceAtCurrentTimestamp(votingEscrow);

          // Not going for dead on precision here,
          // but right around some decimals without error works for this check
          expectEqualWithError(otherBalance, lockAmount, 0.02);
        });
      });
    });

    describe('updating lock amount for users', () => {
      let votingEscrow: Contract;

      context('updating users locked amount', () => {
        sharedBeforeEach('create voting escrow', async () => {
          votingEscrow = await deployVotingEscrow();
        });

        sharedBeforeEach('authorize function calls', async () => {
          await authorizeCall(votingEscrow, 'admin_create_lock_for');
          await authorizeCall(votingEscrow, 'admin_increase_amount_for');
        });

        it('updates lock amount for a user', async () => {
          const lockForIntialAmount = fp(1);
          await doCreateOtherUserMaxLock(votingEscrow, lockForIntialAmount);
          const userBalance = await getOtherUserBalanceAtCurrentTimestamp(votingEscrow);

          logEther(userBalance);

          expectEqualWithError(userBalance, lockForIntialAmount, 0.02);

          const lockForAdditionalAmount = fp(1);
          const calldata = getCalldata(votingEscrow, 'admin_increase_amount_for', [
            other.address,
            lockForAdditionalAmount,
          ]);
          await vault.authorizerAdaptorEntrypoint.performAction(votingEscrow.address, calldata);

          const userNewBalance = await getOtherUserBalanceAtCurrentTimestamp(votingEscrow);

          logEther(userNewBalance);

          // With no other users depositing, and using the same amount, this should hold true
          expectEqualWithError(userNewBalance, lockForIntialAmount.mul(2), 0.02);
        });
      });
    });

    describe('increasing total lock for users', () => {
      let votingEscrow: Contract;

      // context('enforce increasing stake restraints', () => {
      //   context('staking for a user who does not have a current lock', () => {
      //     it('reverts', async () => {});
      //   });

      //   context('increasing stake of an expired lock', () => {
      //     it('reverts', async () => {});
      //   });

      //   context('setting new unlock time in the past', () => {
      //     it('reverts', async () => {});
      //   });

      //   context('setting new unlock time beyond max allowed', () => {
      //     it('reverts', async () => {});
      //   });

      //   context('setting new unlock time earlier than current locks end time', () => {
      //     it('reverts', async () => {});
      //   });
      // });

      context('updating users locked amount and end time', () => {
        sharedBeforeEach('create voting escrow', async () => {
          votingEscrow = await deployVotingEscrow();
        });

        sharedBeforeEach('authorize function calls', async () => {
          await authorizeCall(votingEscrow, 'admin_create_lock_for');
          await authorizeCall(votingEscrow, 'admin_increase_total_stake_for');
        });

        it('updates lock amount for a user', async () => {
          // const lock = await votingEscrow.lock(other.address)
        });
      });
    });
  });
});
