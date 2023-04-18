import { Contract, BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export { Artifact, Libraries } from 'hardhat/types';

import Task from './task';
import { Libraries } from '@nomiclabs/hardhat-ethers/types';

export const NETWORKS = ['goerli', 'mainnet', 'polygon', 'arbitrum', 'optimism', 'gnosis', 'bsc'];

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

export interface ITask {
  run: () => Promise<void>;

  deploy: (
    name: string,
    args: Array<Param>,
    from?: SignerWithAddress,
    force?: boolean,
    libs?: Libraries
  ) => Promise<any>;

  deployAndVerify: (
    name: string,
    args: Array<Param>,
    from?: SignerWithAddress,
    force?: boolean,
    libs?: Libraries
  ) => Promise<Contract>;

  verify: (name: string, address: string, constructorArguments: string | unknown[], libs?: Libraries) => Promise<void>;
}
