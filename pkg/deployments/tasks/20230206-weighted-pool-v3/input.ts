import Task, { TaskMode } from '../../src/task';

export type WeightedPoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  FactoryVersion: string;
  PoolVersion: string;
  WETH: string;
  BAL: string;
};

const Vault = new Task('20230124-vault', TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new Task('20230124-protocol-fees-provider', TaskMode.READ_ONLY);
// const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
// const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 3, deployment: '20230206-weighted-pool-v3' };

export default {
  Vault,
  ProtocolFeePercentagesProvider,
  bsc: {
    WETH: '',
    BAL: '',
  },
  arbitrum: {
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    BAL: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC for test pool (Our token version isn't on arb yet)
  },
  arbitrumTestServer: {
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    BAL: '0x0c0B0FeF3f8E19F0d23Bc68941F429E849d4430b', // ARTK
  },
  FactoryVersion: JSON.stringify({ name: 'WeightedPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'WeightedPool', ...BaseVersion }),
};
