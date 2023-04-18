import { MONTH } from '@balancer-labs/v2-helpers/src/time';

export default {
  pauseWindowDuration: 3 * MONTH,
  bufferPeriodDuration: MONTH,
  bsc: {
    WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
  goerli: {
    WETH: '0xe4E96Cf369D4d604Bedc4d7962F94D53E4B5e3C6',
  },
  arbitrum: {
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  zkSyncTestnet: {
    WETH: '',
  },
};
