export enum PoolType {
  Weighted = 'Weighted',
  Stable = 'Stable',
  ComposableStable = 'ComposableStable',
  LiquidityBootstrappingPool = 'LiquidityBootstrappingPool',
}

export interface BasePoolDeploymentArgs {
  name: string;
  symbol: string;
  tokens: string[];
  swapFeePercentage: string;
  owner: string;
  assetManagers: string[];
  initialBalances: string[];
}

export interface WeightedPoolDeploymentArgs extends BasePoolDeploymentArgs {
  weights: string[];
  rateProviders: string[];
}

export interface StablePoolDeploymentArgs extends BasePoolDeploymentArgs {
  amplificationParameter: number;
}

export interface BasePoolTokenInfo {
  address: string;
  symbol: string;
  initialBalance: string;
  assetManager?: string;
}

export interface WeightedPoolTokenInfo extends BasePoolTokenInfo {
  weight: string;
  rateProvider: string;
}

export interface PoolGaugeConfig {
  address: string;
  startingWeight: string;
  added: Boolean;
  txHash: string;
  controllerTxHash?: string;
}

export interface BasePoolCreationConfig {
  created: boolean;
  initJoinComplete: boolean;
  doInitJoin: boolean;
  isVePool?: boolean;
  txHash: string;
  chainId: number;
  type: PoolType;
  poolId: string;
  poolAddress: string;
  creationDate: string;
  assetManager?: string;
  tokenInfo: BasePoolTokenInfo[];
  deploymentArgs: BasePoolDeploymentArgs;
  gauge: PoolGaugeConfig;
}

export interface WeightedPoolCreationConfig extends BasePoolCreationConfig {
  tokenInfo: WeightedPoolTokenInfo[];
  deploymentArgs: WeightedPoolDeploymentArgs;
}

export interface StablePoolCreationConfig extends BasePoolCreationConfig {
  amplificationParameter: number;
  deploymentArgs: StablePoolDeploymentArgs;
}

export type PoolConfigType = WeightedPoolCreationConfig | StablePoolCreationConfig;
