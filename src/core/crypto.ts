import { createDecipheriv } from 'crypto';
import type { WeChatPayConfig } from '../types/index.js';

export class CryptoUtils {
  constructor(private config: WeChatPayConfig) {}

  decryptWebhookData<T = any>(
    ciphertext: string,
    associatedData: string,
    nonce: string
  ): T {
    const _ciphertext = Buffer.from(ciphertext, 'base64');

    const authTag = _ciphertext.subarray(_ciphertext.length - 16);
    const data = _ciphertext.subarray(0, _ciphertext.length - 16);

    const key = typeof this.config.apiKey === 'string'
      ? Buffer.from(this.config.apiKey, 'utf8')
      : this.config.apiKey;

    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(new Uint8Array(authTag));
    decipher.setAAD(new Uint8Array(Buffer.from(associatedData)));

    const decoded = decipher.update(new Uint8Array(data), undefined, 'utf8');

    try {
      return JSON.parse(decoded);
    } catch {
      return decoded as T;
    }
  }
}
