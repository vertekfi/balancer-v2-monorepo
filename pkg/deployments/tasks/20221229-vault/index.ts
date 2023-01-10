import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import { ethers } from 'hardhat';
import { RawVaultDeployment } from '@balancer-labs/v2-helpers/src/models/vault/types';
import TypesConverter from '@balancer-labs/v2-helpers/src/models/types/TypesConverter';
import { Contract } from 'ethers';
import { FP_100_PCT } from '@balancer-labs/v2-helpers/src/numbers';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as RawVaultDeployment;
  // Get defaults as needed
  input = TypesConverter.toVaultDeployment(task.input());

  const vault = await VaultDeployer.deploy(input);

  // The vault automatically also deploys the protocol fees collector: we must verify it
  const feeCollector = await vault.getFeesCollector();
  const feeCollectorArgs = [vault.address]; // See ProtocolFeesCollector constructor
  await task.save({ ProtocolFeesCollector: feeCollector.address });
  await task.verify('ProtocolFeesCollector', feeCollector.address, feeCollectorArgs);

  const authAdaptor = await VaultDeployer._deployAuthorizerAdaptor(vault.address);
  await task.save({ AuthorizerAdaptor: authAdaptor.address });
  await task.verify('AuthorizerAdaptor', authAdaptor.address, [vault]);

  const entryAdapter = await VaultDeployer._deployAuthorizerAdaptorEntrypoint(authAdaptor.address);
  await task.save({ AuthorizerAdaptorEntrypoint: entryAdapter.address });
  await task.verify('AuthorizerAdaptorEntrypoint', entryAdapter.address, [authAdaptor.addres]);

  /**
   * Save and verify as needed. Some contracts may deploy others during construction
   */

  const admin = (await ethers.getSigners())[0];

  // TimelockAuthorizer
  await task.save({ TimelockAuthorizer: vault.authorizer.address });
  await task.verify('TimelockAuthorizer', vault.authorizer.address, [
    admin.address,
    entryAdapter.address,
    input.rootTransferDelay,
  ]);

  // TimelockAuthorizer deploys TimelockExecutor so verify it as well
  const executor = await vault.authorizer.getExecutor();
  await task.save({ TimelockExecutor: executor });
  await task.verify('TimelockExecutor', executor, []);

  // ProtocolFeesCollector
  const feesCollector = await vault.getFeesCollector();
  await task.save({ ProtocolFeesCollector: feesCollector.address });
  await task.verify('ProtocolFeesCollector', feesCollector.address, [vault.address]);

  // ProtocolFeePercentagesProvider
  const feesProvider = vault.getFeesProvider(); // We know it was added in this case, so no error worries
  await task.save({ ProtocolFeePercentagesProvider: feesProvider.address });
  await task.verify('ProtocolFeePercentagesProvider', feesProvider.address, [
    vault.address,
    input.maxYieldValue,
    input.maxAUMValue,
  ]);

  // AuthorizerAdaptor
  await task.save({ AuthorizerAdaptor: vault.authorizerAdaptor.address });
  await task.verify('AuthorizerAdaptor', vault.authorizerAdaptor.address, [vault.address]);

  // AuthorizerAdaptorEntrypoint
  await task.save({ AuthorizerAdaptorEntrypoint: vault.authorizerAdaptorEntrypoint.address });
  await task.verify('AuthorizerAdaptorEntrypoint', vault.authorizerAdaptorEntrypoint.address, [
    vault.authorizerAdaptor.address,
  ]);

  // Needed for vault verification since the dummy auth is used at first. Not really worth verifying
  await task.save({ MockBasicAuthorizer: vault.basicAuthorizer.address });

  // Do the switcharoo
  await VaultDeployer._giveVaultProperAuthorizer(
    vault.instance,
    vault.basicAuthorizer,
    vault.authorizer.address,
    admin
  );

  const contract = new Contract(
    '0x6bff6a69ff157682d1fc0a8f4666b60234cd5cf1',
    ['function isValidFeeType(uint256) public view returns (bool)'],
    admin
  );
};
