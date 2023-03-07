# Wisp Relayer

<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

## Description

Wisp Relayer node that:
- Handles Light Client Optimistic/Finality updates, requests ZKPs from
a [Wisp-Prover API](https://github.com/LimeChain/wisp-prover) and updates the on-chain LightClient contract
- Watches `Outbox` contracts for Cross-Rollup Messages and relays them to `Inbox` contracts once Light Client state is updated

## Installation

```bash
$ npm install
```

## Development

**Prerequisite**

Copy and example yaml and populate the ENV variables:

```markdown
cp ./config/example.yaml ./config/config.yaml
```

### Docker

Execute the following script
```bash
bash ./start.sh
```

### From Source

**Scripts**

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

**Note**

In order for the relayer to receive light client finality updates, LimeChain's forked lodestar must be started:
1. Get the current `checkpointRoot` by executing:
    ```bash
   curl https://lodestar-goerli.chainsafe.io/eth/v1/beacon/states/finalized/finality_checkpoints | jq ".data.finalized.root" | tr -d '"'
    ```
2. Start the `lodestar-wisp1:0` image, populating the returned `checkpointRoot:
    ```bash
     docker run limechain/lodestar-wisp:1.0 lightclient --network goerli --beaconApiUrl=https://lodestar-goerli.chainsafe.io --checkpointRoot=${CHECKPOINT_ROOT} --crcApiUrl=http://relayer:8080
    ```

## License

The code in this project is free software under the [MIT License](LICENSE).
