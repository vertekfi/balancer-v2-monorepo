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
    BPT: '0x0d55eC026cDca38DF6dc03eE1E026422F885dd8B', // BPT of an 80-20 BAL-WETH Pool using test BAL
  },
};
