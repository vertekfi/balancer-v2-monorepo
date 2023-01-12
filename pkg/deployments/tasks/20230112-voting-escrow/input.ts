import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  BPT: string;
  AuthorizerAdaptor: string;
};

const network = 'goerli';

const AuthorizerAdaptor = new Task('20221229-vault', TaskMode.READ_ONLY, network).output().AuthorizerAdaptor;

export default {
  AuthorizerAdaptor,
  mainnet: {
    BPT: '', // BPT of the canonical 80-20 BAL-WETH Pool
  },
  goerli: {
    BPT: '0x3e9f7B85E8Ee2107aeca28677b6B416fA60b6200', // BPT of an 80-20 BAL-WETH Pool using test BAL
  },
};
