import { createSign } from 'crypto';
import type { WeChatPayConfig } from '../types/index.js';

export class Signer {
  constructor(private config: WeChatPayConfig) {
    this.privateKey = this.loadPrivateKey();
  }

  private privateKey: Buffer;

  private loadPrivateKey(): Buffer {
    if (typeof this.config.privateKey !== 'string') {
      return this.config.privateKey;
    }
    return Buffer.from(this.config.privateKey);
  }

  sign(method: string, path: string, timestamp: string, nonce: string, body?: string): string {
    const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body || ''}\n`;
    return createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64');
  }
}
