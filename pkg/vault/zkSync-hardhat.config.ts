import 'hardhat-local-networks-config-plugin';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { hardhatBaseConfig } from '@balancer-labs/v2-common';

import { name } from '../../package.json';

export const zksolc = {
  version: '1.3.8',
  compilerSource: 'binary',
  settings: {},
};

// TODO: Might not need these if networks.json file works with zkSync
export const zkSyncNetworks = {
  zkSyncTestnet: {
    url: 'https://testnet.era.zksync.dev', // The testnet RPC URL of zkSync Era network.
    ethNetwork: 'goerli', // The identifier of the network (e.g. `mainnet` or `goerli`)
    zksync: true, // Set to true to target zkSync Era.
  },
  zkSync: {
    url: 'https://mainnet.era.zksync.io', // The testnet RPC URL of zkSync Era network.
    ethNetwork: 'mainnet', // The identifier of the network (e.g. `mainnet` or `goerli`)
    zksync: true, // Set to true to target zkSync Era.
  },
};

export default {
  solidity: {
    compilers: hardhatBaseConfig.compilers,
    overrides: { ...hardhatBaseConfig.overrides(name) },
  },
  defaultNetwork: 'zkSyncTestnet',
  zksolc,
  networks: {
    ...zkSyncNetworks,
  },
};
