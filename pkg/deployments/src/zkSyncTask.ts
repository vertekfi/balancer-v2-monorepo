import { Wallet } from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Contract } from 'ethers';
import { Libraries, Network, Param } from './types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import Task, { TaskMode } from './task';
import Verifier from './verifier';
import logger from './logger';
import { saveContractDeploymentTransactionHash } from './network';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env') });

export class zkSyncTask extends Task {
  hre: HardhatRuntimeEnvironment | undefined;

  constructor(idAlias: string, mode: TaskMode, network?: Network, verifier?: Verifier) {
    if (network !== 'zkSync' && network !== 'zkSyncTestnet' && network !== 'zkSyncLocal') {
      throw new Error('zkSyncTask: Network must be zkSync | zkSyncTestnet | zkSyncLocal');
    }

    super(idAlias, mode, network, verifier);
  }

  setHRE(hre: HardhatRuntimeEnvironment) {
    this.hre = hre;
  }

  async deploy(
    name: string,
    args: Array<Param> = [],
    from?: SignerWithAddress,
    force?: boolean,
    libs?: Libraries
  ): Promise<any> {
    if (!this.hre) {
      throw Error(`HardhatRuntimeEnvironment not set. setHRE()`);
    }

    // if (name.split('/').length < 2) {
    //   throw Error(`zkSyncTask: deploy needs contract file path`);
    // }

    if (this.mode == TaskMode.CHECK) {
      return await this.check(name, args, libs);
    }

    if (this.mode !== TaskMode.LIVE && this.mode !== TaskMode.TEST) {
      throw Error(`Cannot deploy in tasks of mode ${TaskMode[this.mode]}`);
    }

    let instance = null;
    const output = this.output({ ensure: false });

    if ((force || !output[name]) && this.hre) {
      try {
        const wallet = new Wallet(process.env.DEV_KEY || '');

        // Create deployer object and load the artifact of the contract we want to deploy.
        const deployer = new Deployer(this.hre, wallet);

        // const artifact = await deployer.loadArtifact(name);
        // this.artifact() will get the correct file
        const artifact = this.artifact(name) as any; // ZkSyncArtifact

        instance = await deployer.deploy(artifact, args, {
          gasLimit: 500000,
        }); //   { libraries: libs }
        this.save({ [name]: instance });

        const contractAddress = instance.address;
        logger.success(
          `zkSyncTask: ${artifact.contractName} was deployed to ${contractAddress}. Network: ${this._network}`
        );

        if (this.mode === TaskMode.LIVE) {
          console.log(`zkSyncTask: "${instance.address}" - txHash: "${instance.deployTransaction.hash}"`);
          saveContractDeploymentTransactionHash(instance.address, instance.deployTransaction.hash, this.network);
        }
      } catch (error: any) {
        console.log(error);
        // for (const prop in error) {
        //   console.log(prop);
        // }
      }
    } else {
      logger.info(`${name} already deployed at ${output[name]}`);
      instance = await this.instanceAt(name, output[name]);
    }

    return instance;
  }

  async deployAndVerify(name: string, args: Array<Param>, from?: SignerWithAddress, force?: boolean, libs?: Libraries) {
    return new Contract('', []);
  }

  async verify(name: string, address: string, constructorArguments: string | unknown[], libs?: Libraries) {}
}
