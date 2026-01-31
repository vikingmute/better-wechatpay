import type { Verifier } from './verify.js';
import type { CryptoUtils } from './crypto.js';
import type { CertificateAPIResponse } from '../types/index.js';
import type { WeChatPayConfig } from '../types/index.js';
import { logger } from './debug.js';

export class CertificateManager {
  constructor(
    private config: WeChatPayConfig,
    private verifier: Verifier,
    private crypto: CryptoUtils,
    private instance: object
  ) {}

  async fetchCertificates(requestFn: () => Promise<CertificateAPIResponse>): Promise<void> {
    try {
      logger.log(this.instance, 'Fetching platform certificates...');

      const response = await requestFn();

      if (response.data) {
        for (const item of response.data) {
          const decryptedCertificate = this.crypto.decryptWebhookData<string>(
            item.encrypt_certificate.ciphertext,
            item.encrypt_certificate.associated_data,
            item.encrypt_certificate.nonce
          );

          const certKey = Buffer.from(decryptedCertificate).toString();
          this.verifier.storePlatformCertificate(item.serial_no, certKey);
        }

        logger.log(this.instance, `Successfully loaded ${response.data.length} platform certificates`);
      }
    } catch (error) {
      logger.error(this.instance, 'Failed to fetch platform certificates', error as Error);
      throw error;
    }
  }
}
