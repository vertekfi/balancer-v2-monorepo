import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';

import VaultDeployer from '@balancer-labs/v2-helpers/src/models/vault/VaultDeployer';
import { RawVaultDeployment } from '@balancer-labs/v2-helpers/src/models/vault/types';
import { getSigner } from '../../src/signers';
import TypesConverter from '@balancer-labs/v2-helpers/src/models/types/TypesConverter';
import logger from '../../src/logger';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  let input = task.input() as RawVaultDeployment;

  const admin = await getSigner();

  const deployment = TypesConverter.toVaultDeployment({
    ...input,
    admin,
  });

  logger.info('Deploying MockBasicAuthorizer');
  const basicAuthorizer = await VaultDeployer._deployBasicAuthorizer(admin);
  await task.save({ MockBasicAuthorizer: basicAuthorizer.address });

  logger.success('success');

  logger.info('Deploying Vault');
  const vault = await VaultDeployer._deployReal(deployment, basicAuthorizer);
  await task.save({ Vault: vault.address });
  await task.verify('Vault', vault.address, [
    basicAuthorizer.address,
    input.WETH,
    input.pauseWindowDuration,
    input.bufferPeriodDuration,
  ]);
  logger.success('success');

  // The vault automatically also deploys the protocol fees collector: we must verify it
  const feeCollector = await vault.getFeesCollector();
  const feeCollectorArgs = [vault.address]; // See ProtocolFeesCollector constructor
  await task.save({ ProtocolFeesCollector: feeCollector.address });
  await task.verify('ProtocolFeesCollector', feeCollector.address, feeCollectorArgs);

  // const authorizerAdaptor = await VaultDeployer._deployAuthorizerAdaptor(vault.address, admin);
  // const authAdaptorAddress = authorizerAdaptor.address;
  // await task.save({ AuthorizerAdaptor: authAdaptorAddress });
  // await task.verify('AuthorizerAdaptor', authAdaptorAddress, [vault]);

  // const adaptorEntrypoint = await VaultDeployer._deployAuthorizerAdaptorEntrypoint(authorizerAdaptor.address);
  // await task.save({ AuthorizerAdaptorEntrypoint: adaptorEntrypoint.address });
  // await task.verify('AuthorizerAdaptorEntrypoint', adaptorEntrypoint.address, [authAdaptorAddress]);

  // // TimelockAuthorizer
  // await task.save({ TimelockAuthorizer: vault.authorizer.address });
  // await task.verify('TimelockAuthorizer', vault.authorizer.address, [
  //   admin.address,
  //   entryAdapterAddress,
  //   input.rootTransferDelay,
  // ]);

  // // TimelockAuthorizer deploys TimelockExecutor so verify it as well
  // const executor = await vault.authorizer.getExecutor();
  // await task.save({ TimelockExecutor: executor });
  // await task.verify('TimelockExecutor', executor, []);

  // // ProtocolFeesCollector
  // const feesCollector = await vault.getFeesCollector();
  // await task.save({ ProtocolFeesCollector: feesCollector.address });
  // await task.verify('ProtocolFeesCollector', feesCollector.address, [vault.address]);

  // // ProtocolFeePercentagesProvider
  // const feesProvider = vault.getFeesProvider(); // We know it was added in this case, so no error worries
  // await task.save({ ProtocolFeePercentagesProvider: feesProvider.address });
  // await task.verify('ProtocolFeePercentagesProvider', feesProvider.address, [
  //   vault.address,
  //   input.maxYieldValue,
  //   input.maxAUMValue,
  // ]);

  // // AuthorizerAdaptor
  // await task.save({ AuthorizerAdaptor: vault.authorizerAdaptor.address });
  // await task.verify('AuthorizerAdaptor', vault.authorizerAdaptor.address, [vault.address]);

  // // AuthorizerAdaptorEntrypoint
  // await task.save({ AuthorizerAdaptorEntrypoint: vault.authorizerAdaptorEntrypoint.address });
  // await task.verify('AuthorizerAdaptorEntrypoint', vault.authorizerAdaptorEntrypoint.address, [
  //   vault.authorizerAdaptor.address,
  // ]);

  // // Needed for vault verification since the dummy auth is used at first. Not really worth verifying
  // await task.save({ MockBasicAuthorizer: vault.basicAuthorizer.address });
};
