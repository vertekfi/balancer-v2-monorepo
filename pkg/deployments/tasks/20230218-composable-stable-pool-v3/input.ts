import Task, { TaskMode } from '../../src/task';

export type ComposableStablePoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  FactoryVersion: string;
  PoolVersion: string;
  WETH: string;
  BAL: string;
};

// const Vault = new Task('20230124-vault', TaskMode.READ_ONLY);
// const ProtocolFeePercentagesProvider = new Task('20230124-protocol-fees-provider', TaskMode.READ_ONLY);
// const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
// const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 3, deployment: '20230206-composable-stable-pool-v3' };

export default {
  bsc: {
    WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    BAL: '0xeD236c32f695c83Efde232c288701d6f9C23E60E',
    Vault: '0x719488F4E859953967eFE963c6Bed059BaAab60c',
    ProtocolFeePercentagesProvider: '0xAf1D403ce21e7803D37B2E950Cc49235B71dfc34',
  },
  arbitrum: {
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    BAL: '',
    Vault: '0xe4E96Cf369D4d604Bedc4d7962F94D53E4B5e3C6',
    ProtocolFeePercentagesProvider: '0x2FB0822b926e823735A9bEF51d9cEa9c2F1bb523',
  },
  FactoryVersion: JSON.stringify({ name: 'ComposableStablePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'ComposableStablePool', ...BaseVersion }),
};
