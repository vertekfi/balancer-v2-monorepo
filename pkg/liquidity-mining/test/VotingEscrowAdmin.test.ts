import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { expect } from 'chai';
import { sharedBeforeEach } from '@balancer-labs/v2-common/sharedBeforeEach';
import { MAX_UINT256 } from '@balancer-labs/v2-helpers/src/constants';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { WEEK } from '@balancer-labs/v2-helpers/src/time';
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

  function getCalldata(instance: Contract, method: string, args: any[] = []) {
    return instance.interface.encodeFunctionData(method, args);
  }

  async function setStakingAdmin(votingEscrow: Contract) {
    await authorizeCall(votingEscrow, 'setStakingAdmin');
    const calldata = getCalldata(votingEscrow, 'setStakingAdmin', [admin.address]);
    await vault.authorizerAdaptorEntrypoint.performAction(votingEscrow.address, calldata);
  }

  describe('Locking for users', () => {
    let votingEscrow: Contract;

    sharedBeforeEach('create voting escrow', async () => {
      votingEscrow = await deployVotingEscrow();
      await setStakingAdmin(votingEscrow);
    });

    context('creating locks for users', () => {
      sharedBeforeEach('create voting escrow', async () => {
        votingEscrow = await deployVotingEscrow();
        await authorizeCall(votingEscrow, 'admin_create_lock_for');
      });

      it('creates a lock for a user', async () => {
        const lockAmount = fp(100);
        const lockEndTime = (await time.latest()) + WEEK * 2;
        const calldata = getCalldata(votingEscrow, 'admin_create_lock_for', [other.address, lockAmount, lockEndTime]);
        await vault.authorizerAdaptorEntrypoint.connect(admin).performAction(votingEscrow.address, calldata);
      });
    });
  });
});
