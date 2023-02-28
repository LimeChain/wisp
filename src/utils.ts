import { PointG1 } from "@noble/bls12-381";
import { SLOTS_PER_SYNC_PERIOD } from "./constants/constants";

const N: number = 55; // The number of bits to use per register
const K: number = 7; // The number of registers

export namespace Utils {
  export function remove0x(str: string): string {
    if (str.startsWith("0x")) {
      str = str.slice(2);
    }
    return str;
  }

  export function pointToBigInt(point: PointG1): [bigint, bigint] {
    let [x, y] = point.toAffine();
    return [x.value, y.value];
  }

  export function bigIntToArray(x: bigint) {
    let mod: bigint = 1n;
    for (let idx = 0; idx < N; idx++) {
      mod = mod * 2n;
    }

    let ret: string[] = [];
    let x_temp: bigint = x;
    for (let idx = 0; idx < K; idx++) {
      ret.push((x_temp % mod).toString());
      x_temp = x_temp / mod;
    }
    return ret;
  }

  export function hexToIntArray(hex: string): string[] {
    hex = remove0x(hex);
    if (hex.length % 2) {
      throw new Error("hexToBytes: received invalid not padded hex");
    }
    const array = [];
    for (let i = 0; i < hex.length / 2; i++) {
      const j = i * 2;
      const hexByte = hex.slice(j, j + 2);
      if (hexByte.length !== 2) throw new Error("Invalid byte sequence");
      const byte = Number.parseInt(hexByte, 16);
      if (Number.isNaN(byte) || byte < 0) {
        console.log(hexByte, byte);
        throw new Error("Invalid byte sequence");
      }
      array.push(BigInt(byte).toString());
    }
    return array;
  }

  export function padBitsToUint8Length(str: string): string {
    while (str.length < 8) {
      str = "0" + str;
    }
    return str;
  }

  export function toLittleEndian(number: number): Buffer {
    let buf = Buffer.alloc(32);
    buf.writeUInt32LE(number);
    return buf;
  }

  // Cannot iterate or get length of SSZ Types for some reason
  export function asUint8Array(sszType: any, length): Uint8Array {
    let arr = [];
    for (let i = 0; i < length; i++) {
      arr.push(sszType[i]);
    }
    return new Uint8Array(arr);
  }

  export function syncCommitteePeriodFor(slot: number): number {
    return Math.floor(slot / SLOTS_PER_SYNC_PERIOD);
  }

  export function syncCommitteeBytes2bits(syncCommitteeBytes: any): number[] {
    let result = [];
    // SyncCommittee Bytes are 64. Cannot get length of BitArray
    for (let i = 0; i < syncCommitteeBytes.bitLen / 8; i++) {
      let uint8Bits = syncCommitteeBytes.uint8Array[i].toString(2);
      uint8Bits = Utils.padBitsToUint8Length(uint8Bits);
      result = result.concat(uint8Bits.split("").reverse());
    }
    return result.map(e => {
      return Number(e);
    });
  }

  export function getSyncPeriodForSlot(slot: number): number {
    return Math.floor(slot / SLOTS_PER_SYNC_PERIOD);
  }
}