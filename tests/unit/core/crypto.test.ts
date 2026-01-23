import { describe, it, expect, beforeEach } from 'vitest';
import { createCipheriv } from 'crypto';
import { CryptoUtils } from '../../../src/core/crypto';
import type { WeChatPayConfig } from '../../../src/types';
import { createMockConfig } from '../../utils/test-helpers';

describe('CryptoUtils', () => {
  let cryptoUtils: CryptoUtils;
  let config: WeChatPayConfig;

  beforeEach(() => {
    config = createMockConfig({
      apiKey: '12345678901234567890123456789012'
    });
    cryptoUtils = new CryptoUtils(config);
  });

  it('should decrypt webhook data successfully', () => {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(config.apiKey, 'utf8');
    const nonce = '0123456789ab';
    const associatedData = 'test_aad';
    const plaintext = JSON.stringify({ test: 'value' });

    const cipher = createCipheriv(algorithm, key, nonce);
    cipher.setAAD(Buffer.from(associatedData));
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const ciphertext = Buffer.concat([
      Buffer.from(encrypted, 'hex'),
      authTag
    ]).toString('base64');

    const result = cryptoUtils.decryptWebhookData(ciphertext, associatedData, nonce);
    expect(result).toEqual({ test: 'value' });
  });

  it('should handle string decryption', () => {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(config.apiKey, 'utf8');
    const nonce = 'abcdef012345';
    const associatedData = '';
    const plaintext = 'plain text string';

    const cipher = createCipheriv(algorithm, key, nonce);
    cipher.setAAD(Buffer.from(associatedData));
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const ciphertext = Buffer.concat([
      Buffer.from(encrypted, 'hex'),
      authTag
    ]).toString('base64');

    const result = cryptoUtils.decryptWebhookData(ciphertext, associatedData, nonce);
    expect(result).toBe(plaintext);
  });
});
