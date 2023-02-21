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

### TODOs for a functioning CRC Light Client

**Step 1 (CRC-Relay):**

- [X] Make it so that `ssz` package can be used in CRC-relayer
- [X] Extend beacon service to be able to get block by ID
- [X] Add logic for preparing `LightClientUpdate` struct
    - [X] Get MerkleInclusion Proof for `ExecutionStateRoot` being part of `BeaconBlockBody`

**Step 2 (Contracts):**

- [X] Deploy the Contracts (PolygonZKEVM)
    - [X] Script for computing current `ssz` `syncCommitteeRoot` <---
    - [X] Script for computing current `ssz` `syncCommitteeRootPoseidon`
    - [X] Deploy script
- [X] Commit contract changes + update tests

**Step 3 (CRC-Relay):**

- [X] Convert `ENV` to `YAML` config
    - [X] Add config for on-chain-light-clients: `contractAddress`, `pk`, `rpcUrl`
- [X] Add `broadcast` service
    - [X] is able to broadcast to every on-chain-lightclient the finalized header update

**Step 4 (CRC-Relay):**

- [ ] Create SyncCommittee service
- [ ] Add background job for updating the sync committee
    - [ ] Get BeaconBlockState from debug endpoint
    - [ ] Get SyncCommittee and compute `branch`
- [ ] Call prover to request sync committee commitment proof as-well
- [ ] Add `syncCommitteeRoot` and `syncCommitteeRootNodes` to `LightClientUpdate` struct or Call Sync Committee Update
  directly

**SyncCommittee Algorithm on Startup:**

1. For every supported contract from `broadcast`
    1. Get the latest sync committee period
2. Find `min(syncCommitteePeriods)`
    1. (temporary) If `syncCommittePeriod + 1 < currentSyncCommittee` -> throw exception that a sync committee has been
       missed and cannot be recovered (will happen if 2 days the relayer is offline)
    2. if `syncCommittePeriod=currentSyncCommittee` -> `syncCommitteeToSync=currentSyncCommittee+1`
    3. if `syncCommittePeriod+1=currentSyncCommittee` ->`syncCommitteeToSync=currentSyncCommittee`
    4. if `syncCommitteePeriod=currentSyncCommittee + 1` -> no sync needed
3. Pass the `syncCommitteeToSync` to the `sync-committee` service

**SyncCommittee Service Algo:**

1. Raise a flag that sync committee must be updated
    1. <---- once finalised update comes, sync committee update is triggered (modify `light-client` service to check for
       sync committee updates)
2. Compute the corresponding slot for `syncCommitteeToSync` (*8192)
3. Execute a GET query to `rpc-endpoint/eth/v2/debug/beacon/states/{slot}` and download all the data (180 MB)
4. Prepare a `syncCommittee` update object and request the Prover for proof
5. Compute the `root` and create Merkle Inclusion Proof
6. Once prover provides proof, pass it to the `light-client` service to be included in proofs

**Step 5 (Deployment):**

- [ ] Fix issue with Prover docker image
- [ ] Publish docker image
- [ ] Create cheaper instance for long-lasting prover VM to run the Docker Image

**Optional:**

- [ ] Modify lodestar to pass finality updates that are received on startup initial sync

**Steps on How to manually compute SyncCommittee**
1. create file to store beacon state: `touch goerli-21-feb`
2. CURL beacon state for slot: 
```
curl https://virulent-tiniest-fire.ethereum-goerli.discover.quiknode.pro/31f093d04fba05b99efe109e7cc443f12b282299/eth/v2/debug/beacon/states/5039675 > goerli-21-feb
```
3. Open the file and copy the `currentSyncCommittee` object (pubkeys + aggregate pub key);
4. Paste the object in `main.ts`
5. Include the following code:
```typescript
const sc = lodestar.ssz.altair.SyncCommittee.fromJson(currentSyncCommittee);
console.log("ROOT", ethers.utils.hexlify(lodestar.ssz.altair.SyncCommittee.hashTreeRoot(sc)));
const prover = app.get(ProverService);
prover.computeSyncCommitteeCommitmentProof(sc).then(console.log);
```