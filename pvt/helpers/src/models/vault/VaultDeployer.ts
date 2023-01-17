import { ethers } from 'hardhat';
import { BigNumberish, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { deploy } from '../../contract';
import { MONTH } from '../../time';
import { RawVaultDeployment, VaultDeployment } from './types';

import Vault from './Vault';
import TypesConverter from '../types/TypesConverter';
import TokensDeployer from '../tokens/TokensDeployer';
import { actionId } from '../misc/actions';

export default {
  async deploy(params: RawVaultDeployment): Promise<Vault> {
    const deployment = TypesConverter.toVaultDeployment(params);

    let { admin } = deployment;
    const { from, mocked } = deployment;
    if (!admin) admin = from || (await ethers.getSigners())[0];

    // This sequence breaks the circular dependency between authorizer, vault, adaptor and entrypoint.
    // First we deploy the vault, adaptor and entrypoint with a basic authorizer.
    const basicAuthorizer = await this._deployBasicAuthorizer(admin);
    const vault = await (mocked ? this._deployMocked : this._deployReal)(deployment, basicAuthorizer);
    const authorizerAdaptor = await this._deployAuthorizerAdaptor(vault.address, from);
    const adaptorEntrypoint = await this._deployAuthorizerAdaptorEntrypoint(authorizerAdaptor.address);
    const protocolFeeProvider = await this._deployProtocolFeeProvider(
      vault.address,
      deployment.maxYieldValue,
      deployment.maxAUMValue
    );

    // Then, with the entrypoint correctly deployed, we create the actual authorizer to be used and set it in the vault.
    const authorizer = await this._deployAuthorizer(
      admin,
      adaptorEntrypoint.address,
      deployment.rootTransferDelay,
      from
    );

    // Do the switcharoo
    await this._giveVaultProperAuthorizer(vault, basicAuthorizer, authorizer.address, admin);

    return new Vault(
      mocked,
      vault,
      authorizer,
      authorizerAdaptor,
      adaptorEntrypoint,
      protocolFeeProvider,
      basicAuthorizer,
      admin
    );
  },

  async _giveVaultProperAuthorizer(
    vault: Contract,
    basicAuthorizer: Contract,
    timelockAuthAddress: string,
    admin: SignerWithAddress
  ) {
    const setAuthorizerActionId = await actionId(vault, 'setAuthorizer');
    await basicAuthorizer.grantRolesToMany([setAuthorizerActionId], [admin.address]);
    await vault.connect(admin).setAuthorizer(timelockAuthAddress);
  },

  async _deployReal(deployment: VaultDeployment, authorizer: Contract): Promise<Contract> {
    const { from, pauseWindowDuration, bufferPeriodDuration } = deployment;
    // const weth = await TokensDeployer.deployToken({ symbol: 'WETH' });

    const args = [authorizer.address, deployment.WETH, pauseWindowDuration, bufferPeriodDuration];
    return deploy('v2-vault/Vault', { args, from });
  },

  async _deployMocked({ from }: VaultDeployment, authorizer: Contract): Promise<Contract> {
    return deploy('v2-pool-utils/MockVault', { from, args: [authorizer.address] });
  },

  async _deployBasicAuthorizer(admin: SignerWithAddress): Promise<Contract> {
    return deploy('v2-vault/MockBasicAuthorizer', { args: [], from: admin });
  },

  async _deployAuthorizer(
    admin: SignerWithAddress,
    authorizerAdaptorEntrypoint: string,
    rootTransferDelay: number,
    from?: SignerWithAddress
  ): Promise<Contract> {
    return deploy('v2-vault/TimelockAuthorizer', {
      args: [admin.address, authorizerAdaptorEntrypoint, rootTransferDelay],
      from,
    });
  },

  async _deployAuthorizerAdaptor(vault: string, from?: SignerWithAddress): Promise<Contract> {
    return deploy('v2-liquidity-mining/AuthorizerAdaptor', { args: [vault], from });
  },

  async _deployAuthorizerAdaptorEntrypoint(adaptor: string, from?: SignerWithAddress): Promise<Contract> {
    return deploy('v2-liquidity-mining/AuthorizerAdaptorEntrypoint', { args: [adaptor], from });
  },

  async _deployProtocolFeeProvider(
    vault: string,
    maxYieldValue: BigNumberish,
    maxAUMValue: BigNumberish
  ): Promise<Contract> {
    return deploy('v2-standalone-utils/ProtocolFeePercentagesProvider', {
      args: [vault, maxYieldValue, maxAUMValue],
    });
  },
};
