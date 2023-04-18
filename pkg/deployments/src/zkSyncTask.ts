import { Contract } from 'ethers';
import { Libraries, Network, Param } from './types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import Task, { TaskMode } from './task';
import Verifier from './verifier';

export class zkSyncTask extends Task {
  constructor(idAlias: string, mode: TaskMode, network?: Network, verifier?: Verifier) {
    if (network !== 'zkSync' && network !== 'zkSyncTestnet') {
      throw new Error('zkSyncTask: Network must be zkSync or xkSyncTestnet');
    }

    super(idAlias, mode, mode === TaskMode.LIVE ? 'zkSync' : 'zkSyncTestnet', verifier);
  }

  async run() {
    //
  }

  async deploy(name: string, args: Array<Param>, from?: SignerWithAddress, force?: boolean, libs?: Libraries) {
    return new Contract('', []);
  }

  async deployAndVerify(name: string, args: Array<Param>, from?: SignerWithAddress, force?: boolean, libs?: Libraries) {
    return new Contract('', []);
  }

  async verify(name: string, address: string, constructorArguments: string | unknown[], libs?: Libraries) {}
}
