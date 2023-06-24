import Task, { TaskMode } from '../../src/task';

export type BatchRelayerDeployment = {
  Vault: string;
  wstETH: string;
  BalancerMinter: string;
};

const Vault = new Task('20230124-vault', TaskMode.READ_ONLY);

export default {
  Vault,
  arbitrum: {
    wstETH: '0x5979D7b546E38E414F7E9822514be443A4800529',
    BalancerMinter: '0x0000000000000000000000000000000000000000',
  },
  optimism: {
    wstETH: '0x0000000000000000000000000000000000000000',
    BalancerMinter: '0x0000000000000000000000000000000000000000',
  },
  bsc: {
    wstETH: '0x0000000000000000000000000000000000000000',
    BalancerMinter: '0x0000000000000000000000000000000000000000',
  },
};
