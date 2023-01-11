import { Contract, BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export { Artifact, Libraries } from 'hardhat/types';

import Task from './task';

export const NETWORKS = ['goerli', 'mainnet', 'polygon', 'arbitrum', 'optimism', 'gnosis', 'bsc'];

export const NETWORK_KEYS: { [chainId: number]: Network } = {
  5: 'goerli',
  56: 'bsc',
};

export type Network = typeof NETWORKS[number];

export type TaskRunOptions = {
  force?: boolean;
  from?: SignerWithAddress;
};

export type NAry<T> = T | Array<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Param = boolean | string | number | BigNumber | any;

export type Input = {
  [key: string]: NAry<Param>;
};

export type RawInputByNetwork = {
  [key in Network]: RawInputKeyValue;
};

export type RawInputKeyValue = {
  [key: string]: NAry<Param> | Output | Task;
};

export type RawInput = RawInputKeyValue | RawInputByNetwork;

export type Output = {
  [key: string]: string;
};

export type RawOutput = {
  [key: string]: string | Contract;
};

export type FactoryContracts =
  | 'WeightedPoolFactory'
  | 'LiquidityBootstrappingPoolFactory'
  | 'ERC4626LinearPoolFactory'
  | 'StablePoolFactory';

type VaulContracts =
  | 'Vault'
  | 'TimelockAuthorizer'
  | 'AuthorizerAdaptor'
  | 'AuthorizerAdaptorEntrypoint'
  | 'MockBasicAuthorizer';

type GovernanceContracts = 'GovernanceToken' | 'BalancerTokenAdmin' | 'BalancerMinter';

type GaugeContracts =
  | 'VotingEscrow'
  | 'GaugeController'
  | 'LiquidityGaugeFactory'
  | 'LiquidityGaugeV5'
  | 'BoostV2'
  | 'VotingEscrowDelegationProxy'
  | 'SingleRecipientGaugeFactory'
  | 'BALTokenHolder'
  | 'FeeDistributor'
  | 'GaugeControllerQuerier';

export type DeployedContract = FactoryContracts | VaulContracts | GovernanceContracts | GaugeContracts | 'AssetManager';
