import { BigNumber } from 'ethers';

export type ProtocolFeePercentagesInput = {
  Vault: string;
  maxYieldValue: BigNumber;
  maxAUMValue: BigNumber;
};
