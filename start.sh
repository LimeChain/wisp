#bin/bash

export CHECKPOINT_ROOT=$(curl https://lodestar-goerli.chainsafe.io/eth/v1/beacon/states/finalized/finality_checkpoints | jq ".data.finalized.root" | tr -d '"')
docker-compose up -d