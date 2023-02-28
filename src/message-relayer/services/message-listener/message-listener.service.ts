import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATA_LAYER_SERVICE, EVENT_MESSAGE_SENT } from '../../../constants';
import { IDataLayer } from 'src/data-layer/IDataLayer';
import { MessageDTO } from "../../dtos/message.dto";
import * as Outbox from '../../../../abis/Outbox.json';
import { Contract, ethers } from 'ethers';

@Injectable()
export class MessageListener {
  private readonly logger = new Logger(MessageListener.name);
  private outBoxContract: Contract;

  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private readonly rollup: Contract,
  ) {
    if (rollup.outgoing.supported) {
      const provider = new ethers.providers.JsonRpcProvider(
        rollup.rpcUrl,
      ) as ethers.providers.Web3Provider;

      this.outBoxContract = new ethers.Contract(
        rollup.outgoing.outboxContract,
        Outbox,
        provider,
      );

      this.logger.log(
        `${MessageListener.name} initialized for ${rollup.name} network`,
      );
      this.outBoxContract.on(EVENT_MESSAGE_SENT, async (...args) => {
        const tx = args[args.length - 1];
        const {
          version,
          nonce,
          user,
          payload,
          extra,
          stateRelayFee,
          deliveryFee,
          target,
        } = await this.outBoxContract.getMessageByIndex(tx.args.messageIndex);

        const message: MessageDTO = {
          version,
          nonce,
          user,
          payload,
          extra,
          stateRelayFee,
          deliveryFee,
          L2BlockNumber: tx.blockNumber,
          target,
          destinationChainId: tx.args.destinationChainId,
          messageHash: tx.args.hash,
          messageIndex: tx.args.messageIndex,
          L1BlockNumber: null,
          sentHash: null,
        };

        this.dataLayerService.createMessage(message);

        this.logger.log(`Messages: ${JSON.stringify(message)}}`);
      });
    }
  }
}
