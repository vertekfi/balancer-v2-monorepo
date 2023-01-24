# Vault 2023-01-24

Deployment of the Vault, Balancer V2's core contract. Deploys all core contracts needed to get the base of the Vault system up and running.

Note this uses the pattern provided by the Bal team to break the circular dependency that has arisen for the Vault authorization setup.
A basic authorizer is initially given to the Vault at deployment. Once the needed adapters, followed by the TimelockAuthorizer, are deployed/setup,
then the TimelockAuthorizer is set as the authorizer for the Vault.

## Useful Files

- [BSC mainnet addresses](./output/bsc.json)
- [Goerli testnet addresses](./output/goerli.json)
- [`Vault` artifact](./artifact/Vault.json)
