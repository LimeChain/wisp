import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DATA_LAYER_SERVICE,
  GOERLI_OPTIMISM_RPC_ENDPOINT,
  GOERLI_RPC_ENDPOINT,
  HEAD_UPDATE,
} from 'src/constants';
import * as Extractoor from 'extractoor';
import {
  BN,
  bufferToHex,
  keccak,
  setLengthLeft,
  toBuffer,
  unpadBuffer,
} from 'ethereumjs-util';
import { IDataLayer } from 'src/data-layer/IDataLayer';
import { Contract, ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import * as LightClient from '../../../../abis/SimpleLightClient.json';
import * as Inbox from '../../../../abis/OptimismInbox.json';

@Injectable()
export class LightClientListener {
  private readonly logger = new Logger(LightClientListener.name);

  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private readonly config: ConfigService,
  ) {
    // for each rollup that supports outgoing, create lightClientContract instance and listen for HeadUpdate
    // for each rollup that supports incoming, create inboxContract instance
    const rollups = config.get('rollups');
    let lightClientContract: Contract;
    let inboxContract: Contract;

    rollups.forEach((rollup) => {
      const provider = new ethers.providers.JsonRpcProvider(
        rollup.rpcUrl,
      ) as ethers.providers.Web3Provider;

      if (rollup.outgoing.supported) {
        lightClientContract = new ethers.Contract(
          rollup.outgoing.lightClientContract,
          LightClient,
          provider,
        );
      }

      if (rollup.incoming.supported) {
        const provider = new ethers.providers.JsonRpcProvider(
          rollup.rpcUrl,
        ) as ethers.providers.Web3Provider;

        const signer = new ethers.Wallet(rollup.privateKey, provider);

        inboxContract = new ethers.Contract(
          rollup.incoming.inboxContract,
          Inbox,
          signer,
        );
      }

      if (lightClientContract && inboxContract) {
        lightClientContract.on(HEAD_UPDATE, async (...args) => {
          const tx = args[args.length - 1];
          const newBlockHeaderNumber = tx.args.blockNumber.toNumber();
          const messages = await this.dataLayerService.getMessages();

          // Create Optimism Extractoor client
          const fetcher = new Extractoor.OptimismExtractoorClient(
            GOERLI_OPTIMISM_RPC_ENDPOINT,
            GOERLI_RPC_ENDPOINT,
          );

          // Step 1 - Derive the storage slot from the array definition and index of the array
          const arrayDefinitionHash = keccak(setLengthLeft(toBuffer(0), 32));
          const arrayDefinitionBN = new BN(arrayDefinitionHash);
          const indexBN = new BN(0);
          const slotBN = arrayDefinitionBN.add(indexBN);
          const slot = `0x${slotBN.toString('hex')}`;

          for (const message of messages) {
            if (newBlockHeaderNumber >= message.L1BlockNumber) {
              this.logger.log(
                `${LightClientListener.name}: receiving flow triggered`,
              );

              // Step 2 - Get all the information needed for the Optimism Output Root inclusion inside L1 proof
              const output = await fetcher.generateLatestOutputData(
                `0x${newBlockHeaderNumber.toString(16)}`,
              );

              // Step 3 - Get all the information needed for the Merkle inclusion proof inside Optimism
              const getProofRes = await fetcher.optimism.getProof(
                rollup.outgoing.outBoxContract,
                slot,
                bufferToHex(unpadBuffer(toBuffer(output.blockNum))),
              );

              // Step 4 - RLP encode the Proof from Step 3
              const inclusionProof =
                Extractoor.MPTProofsEncoder.rlpEncodeProofs([
                  getProofRes.accountProof,
                  getProofRes.storageProof[0].proof,
                ]);

              const {
                version,
                destinationChainId,
                nonce,
                target,
                payload,
                extra,
                user,
                stateRelayFee,
                deliveryFee,
              } = message;

              const envelope = {
                message: {
                  version,
                  destinationChainId,
                  nonce,
                  user,
                  target,
                  payload,
                  stateRelayFee,
                  deliveryFee,
                  extra,
                },
                sender: target,
              };

              const outputProof = {
                outputRootProof: {
                  stateRoot: output.optimismStateRoot,
                  withdrawalStorageRoot: output.withdrawalStorageRoot,
                  latestBlockhash: output.blockHash,
                },
                optimismStateProofsBlob: output.outputRootRLPProof,
              };
              const MPTInclusionProof = {
                address: rollup.outgoing.outBoxContract,
                slotPositon: slot,
                proofsBlob: inclusionProof,
              };

              console.log(envelope);
              console.log(newBlockHeaderNumber);
              console.log(output.outputIndex);
              console.log(outputProof);
              console.log(MPTInclusionProof);

              try {
                const receipt = await inboxContract.receiveMessage(
                  envelope,
                  newBlockHeaderNumber,
                  ethers.BigNumber.from(output.outputIndex).toNumber(),
                  outputProof,
                  MPTInclusionProof,
                );
                console.log(receipt);
              } catch (error) {
                console.error(error);
              }
            }
          }
        });
      }
    });
  }
}
