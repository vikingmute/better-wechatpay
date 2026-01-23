import { describe, it, expect, beforeEach } from 'vitest';
import { generateKeyPairSync } from 'crypto';
import { Signer } from '../../../src/core/sign';
import type { WeChatPayConfig } from '../../../src/types';
import { createMockConfig } from '../../utils/test-helpers';

describe('Signer', () => {
  let signer: Signer;
  let config: WeChatPayConfig;

  beforeEach(() => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048
    });
    config = createMockConfig({
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' })
    });
    signer = new Signer(config);
  });

  it('should generate RSA signature', () => {
    const signature = signer.sign(
      'POST',
      '/v3/pay/transactions/native',
      '1234567890',
      'abc123',
      JSON.stringify({ test: 'data' })
    );

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should handle empty body', () => {
    const signature = signer.sign(
      'GET',
      '/v3/pay/transactions/out-trade-no/123',
      '1234567890',
      'abc123'
    );

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
  });
});
