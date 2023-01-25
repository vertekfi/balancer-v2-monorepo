import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  BPT: string;
  AuthorizerAdaptor: string;
};

export default {
  AuthorizerAdaptor: new Task('20230124-authorizers', TaskMode.READ_ONLY),
  bsc: {
    BPT: '0xDD64E2EC144571b4320f7BFB14a56b2b2cBF37ad', // BPT of the canonical 80-20 BAL-WETH Pool
  },
  goerli: {
    BPT: '0xD0F30B415C65B99904caF716ABc3da23f57d3cdd', // BPT of an 80-20 BAL-WETH Pool using test BAL
  },
};
