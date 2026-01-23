import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Webhook } from '../../../src/webhook/webhook';
import type { WeChatPayConfig } from '../../../src/types';
import { createMockConfig } from '../../utils/test-helpers';

describe('Webhook', () => {
  let webhook: Webhook;
  let mockVerifier: any;
  let mockCrypto: any;
  let config: WeChatPayConfig;

  beforeEach(() => {
    config = createMockConfig();
    mockVerifier = {
      verify: vi.fn().mockResolvedValue(true)
    };
    mockCrypto = {
      decryptWebhookData: vi.fn().mockReturnValue({
        out_trade_no: 'order123',
        transaction_id: 'txn123'
      })
    };

    webhook = new Webhook(mockVerifier, mockCrypto, {});
  });

  it('should verify webhook successfully', async () => {
    const params = {
      headers: {
        'wechatpay-signature': 'sig123',
        'wechatpay-timestamp': '1234567890',
        'wechatpay-nonce': 'nonce123',
        'wechatpay-serial': 'serial123'
      },
      body: JSON.stringify({
        id: 'webhook123',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          ciphertext: 'encrypted',
          associated_data: 'aad',
          nonce: 'nonce'
        }
      })
    };

    const result = await webhook.verify(params);

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('TRANSACTION.SUCCESS');
    expect(result.decryptedData).toEqual({
      out_trade_no: 'order123',
      transaction_id: 'txn123'
    });
  });

  it('should fail on invalid signature', async () => {
    mockVerifier.verify.mockResolvedValue(false);

    const params = {
      headers: {
        'wechatpay-signature': 'invalid',
        'wechatpay-timestamp': '1234567890',
        'wechatpay-nonce': 'nonce123',
        'wechatpay-serial': 'serial123'
      },
      body: '{}'
    };

    const result = await webhook.verify(params);

    expect(result.success).toBe(false);
  });
});
