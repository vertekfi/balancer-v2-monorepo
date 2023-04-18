import 'hardhat-local-networks-config-plugin';
import 'hardhat-ignore-warnings';

import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-vyper';

import { hardhatBaseConfig } from '@balancer-labs/v2-common';

import { name } from '../../package.json';

export default {
  mocha: {
    timeout: 600000,
  },
  solidity: {
    compilers: hardhatBaseConfig.compilers,
    overrides: { ...hardhatBaseConfig.overrides(name) },
  },
  paths: {
    sources: './tasks',
  },
  warnings: hardhatBaseConfig.warnings,
};
