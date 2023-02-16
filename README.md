# CRC Relayer

<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

## Description

CRC Relayer node that handles Light Client Optimistic/Finality updates, requests ZKPs from
a [CRC-Prover API](https://github.com/LimeChain/crc-prover) and updates the on-chain LightClient contract.

## Installation

```bash
$ npm install
```

## Running the app

**Prerequisite**

Populate the ENV variables
```markdown
cp example.env .env
```

**Scripts**

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
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

TODO License
