import { Injectable } from "@nestjs/common";
import { ethers } from "ethers";
import { NonceManager } from "@ethersproject/experimental";

@Injectable()
export class SignerService {

  private readonly signers = new Map<string, NonceManager>();

  /**
   * Returns a NonceManager signer that is shared across the node
   * Nonce's are managed centrally from the NonceManager per network
   * @param privateKey
   * @param rpcUrl
   */
  getManagedSignerFor(privateKey: string, rpcUrl: string) {
    const key = `${privateKey}-${rpcUrl}`;
    if (!this.signers.has(key)) {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const nonceManaged = new NonceManager(wallet);
      this.signers.set(key, nonceManaged);
    }
    return this.signers.get(key);
  }
}