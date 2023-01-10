import { RawVaultDeployment } from '@balancer-labs/v2-helpers/src/models/vault/types';
import { MONTH, WEEK } from '@balancer-labs/v2-helpers/src/time';

const input: RawVaultDeployment = {
  pauseWindowDuration: 3 * MONTH,
  bufferPeriodDuration: MONTH,
  rootTransferDelay: WEEK,
};

export default input;
