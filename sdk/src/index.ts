export * from './wormhole/ethereum';
export * from './wormhole/solana';
export * from './crypto/aes';
export * from './crypto/ec';
export { Base64 as Base64FromCrypto } from './crypto/base64';
export * from './utils';

export interface WormholeMessage {
  pubKey1: string;
  pubKey2: string;
  encryptedData: string;
}