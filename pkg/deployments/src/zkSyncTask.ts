import { Contract } from 'ethers';
import { ITask, Libraries, Network, Param } from './types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import Task, { TaskMode } from './task';
import Verifier from './verifier';

export class zkSyncTask extends Task implements ITask {
  constructor(idAlias: string, mode: TaskMode, network?: Network, verifier?: Verifier) {
    super(idAlias, mode, network, verifier);
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
