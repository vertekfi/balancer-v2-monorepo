import Task, { TaskMode } from '../../src/task';

export type BatchRelayerDeployment = {
  Vault: string;
  wstETH: string;
  BalancerMinter: string;
};

const Vault = new Task('20230124-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20230124-balancer-minter', TaskMode.READ_ONLY);

export default {
  Vault,
  // wstETH and BalancerMinter are only deployed on mainnet, and goerli.
  bsc: {
    wstETH: '0x0000000000000000000000000000000000000000', // This will be Stader BNBx for us then
    BalancerMinter,
  },
};
