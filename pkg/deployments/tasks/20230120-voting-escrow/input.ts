import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  BPT: string;
  AuthorizerAdaptor: string;
};

const AuthorizerAdaptor = new Task('20230117-authorizers', TaskMode.READ_ONLY);

export default {
  AuthorizerAdaptor,
  mainnet: {
    BPT: '', // BPT of the canonical 80-20 BAL-WETH Pool
  },
  goerli: {
    BPT: '0x762b77980Ea2d624CDc5F774352F25C598E469CE', // BPT of an 80-20 BAL-WETH Pool using test BAL
  },
};
