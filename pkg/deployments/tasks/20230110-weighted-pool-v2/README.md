# 2022-01-10 - Weighted Pool Factory V2

Deployment of the `WeightedPoolFactory`, which allows creating Weighted Pools which include a number of improvements, including:

- Optimized `FixedPoint.powDown` for cheaper swaps in common token weight ratios.
- Paying protocol fees in BPT.
- Awareness of yield-bearing tokens.

Note this version takes advantage of the new configurable pause/buffer window feature

## Useful Files

- [BSC mainnet addresses](./output/bsc.json)
- [Goerli testnet addresses](./output/goerli.json)
- [`WeightedPool` artifact](./artifact/WeightedPool.json)
- [`WeightedPoolFactory` artifact](./artifact/WeightedPoolFactory.json)
