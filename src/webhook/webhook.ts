import type { Verifier } from '../core/verify';
import type { CryptoUtils } from '../core/crypto';
import type {
  WebhookParams,
  WebhookVerificationResult,
  WebhookNotification
} from '../types/index';
import { logger } from '../core/debug';

export class Webhook {
  constructor(
    private verifier: Verifier,
    private crypto: CryptoUtils,
    private instance: object
  ) {}

  async verify(params: WebhookParams): Promise<WebhookVerificationResult> {
    logger.log(this.instance, 'Verifying webhook:', {
      timestamp: params.headers['wechatpay-timestamp'],
      nonce: params.headers['wechatpay-nonce'],
      serial: params.headers['wechatpay-serial']
    });

    const isValid = await this.verifier.verify(
      params.headers['wechatpay-timestamp'],
      params.headers['wechatpay-nonce'],
      params.body,
      params.headers['wechatpay-signature'],
      params.headers['wechatpay-serial']
    );

    if (!isValid) {
      logger.error(this.instance, 'Webhook signature verification failed');
      return { success: false };
    }

    const notification = JSON.parse(params.body) as WebhookNotification;

    const decryptedData = this.crypto.decryptWebhookData(
      notification.resource.ciphertext,
      notification.resource.associated_data,
      notification.resource.nonce
    );

    logger.log(this.instance, 'Webhook verified successfully:', {
      eventType: notification.event_type,
      orderId: decryptedData.out_trade_no
    });

    return {
      success: true,
      eventType: notification.event_type as any,
      decryptedData
    };
  }
}
