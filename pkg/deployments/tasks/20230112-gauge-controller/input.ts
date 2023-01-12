import Task, { TaskMode } from '../../src/task';

export type GaugeSystemDeployment = {
  BPT: string;
  BalancerTokenAdmin: string;
  AuthorizerAdaptor: string;
};

const AuthorizerAdaptor = new Task('20221229-vault', TaskMode.READ_ONLY).output().AuthorizerAdaptor;
const BalancerTokenAdmin = new Task('20230111-balancer-token-admin', TaskMode.READ_ONLY).output().AuthorizerAdaptor;

export default {
  AuthorizerAdaptor,
  BalancerTokenAdmin,
  mainnet: {
    BPT: '', // BPT of the canonical 80-20 BAL-WETH Pool
  },
  goerli: {
    BPT: '0x3e9f7B85E8Ee2107aeca28677b6B416fA60b6200', // BPT of an 80-20 BAL-WETH Pool using test BAL
  },
};
