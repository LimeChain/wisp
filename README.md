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

## Running the app

**Prerequisite**

Copy and example yaml and populate the ENV variables:

```markdown
cp ./config/example.yaml ./config/config.yaml
```

**Scripts**

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

The code in this project is free software under the [MIT License](LICENSE).
