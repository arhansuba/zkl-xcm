import * as eccrypto from 'eccrypto';
import * as secp256k1 from 'secp256k1';
import * as crypto from 'crypto';

export class EC {
  static compressPublicKey(publicKey: Buffer): string {
    return Buffer.from(secp256k1.publicKeyConvert(publicKey, true)).toString('hex');
  }

  static decompressPublicKey(compressedKey: string): Buffer {
    const pubKeyBuffer = Buffer.from(compressedKey, 'hex');
    return Buffer.from(secp256k1.publicKeyConvert(pubKeyBuffer, false));
  }

  static async generateKeyPair(): Promise<{ privateKey: Buffer; publicKey: Buffer }> {
    let privateKey: Buffer;
    do {
      privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));
    
    const publicKey = secp256k1.publicKeyCreate(privateKey);
    return { privateKey, publicKey: Buffer.from(publicKey) };
  }

  static async encrypt(publicKeyTo: Buffer, msg: Buffer): Promise<Buffer> {
    return await eccrypto.encrypt(publicKeyTo, msg);
  }

  static async decrypt(privateKey: Buffer, encryptedMsg: Buffer): Promise<Buffer> {
    return await eccrypto.decrypt(privateKey, encryptedMsg);
  }
}

// File: sdk/src/crypto/base64.ts
export class Base64 {
  static encode(data: string | Buffer): string {
    if (typeof data === 'string') {
      return Buffer.from(data).toString('base64');
    }
    return data.toString('base64');
  }

  static decode(encodedData: string): string {
    return Buffer.from(encodedData, 'base64').toString('utf8');
  }
}