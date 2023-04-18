import 'hardhat-local-networks-config-plugin';
// import 'hardhat-ignore-warnings';

import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { hardhatBaseConfig } from '@balancer-labs/v2-common';

import { name } from '../../package.json';

export default {
  solidity: {
    compilers: hardhatBaseConfig.compilers,
    overrides: { ...hardhatBaseConfig.overrides(name) },
  },
  defaultNetwork: 'zkSyncTestnet',
  zksolc: {
    version: '1.3.8',
    compilerSource: 'binary',
    settings: {},
  },
  //  warnings: hardhatBaseConfig.warnings, // 'hardhat-ignore-warnings' causes build  to fail
  networks: {
    zkSyncTestnet: {
      url: 'https://testnet.era.zksync.dev', // The testnet RPC URL of zkSync Era network.
      ethNetwork: 'goerli', // The identifier of the network (e.g. `mainnet` or `goerli`)
      zksync: true, // Set to true to target zkSync Era.
    },
  },
};
