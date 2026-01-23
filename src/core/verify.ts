import { createVerify } from 'crypto';
import { X509Certificate } from '@peculiar/x509';
import type { WeChatPayConfig } from '../types/index';

export class Verifier {
  private publicKey: Buffer;
  private serialNo: string;
  private platformCertificates = new Map<string, string>();

  constructor(private config: WeChatPayConfig) {
    this.publicKey = this.loadPublicKey();
    this.serialNo = this.getSerialNumber(this.publicKey);
  }

  private loadPublicKey(): Buffer {
    if (typeof this.config.publicKey !== 'string') {
      return this.config.publicKey;
    }
    return Buffer.from(this.config.publicKey);
  }

  private getSerialNumber(certificateData: Buffer): string {
    const certificate = new X509Certificate(new Uint8Array(certificateData));
    return certificate.serialNumber;
  }

  getMerchantSerialNo(): string {
    return this.serialNo;
  }

  getPublicKey(): Buffer {
    return this.publicKey;
  }

  storePlatformCertificate(serialNo: string, publicKey: string) {
    this.platformCertificates.set(serialNo, publicKey);
  }

  hasPlatformCertificate(serialNo: string): boolean {
    return this.platformCertificates.has(serialNo);
  }

  async verify(
    timestamp: string,
    nonce: string,
    body: string,
    signature: string,
    serialNo: string
  ): Promise<boolean> {
    const message = `${timestamp}\n${nonce}\n${body}\n`;

    if (this.config.paymentPublicKey && this.config.publicKeyId && serialNo === this.config.publicKeyId) {
      const paymentPublicKey = typeof this.config.paymentPublicKey === 'string'
        ? Buffer.from(this.config.paymentPublicKey)
        : this.config.paymentPublicKey;

      try {
        const verify = createVerify('RSA-SHA256');
        verify.update(message);
        const isValid = verify.verify(paymentPublicKey, signature, 'base64');
        if (isValid) return true;
      } catch (error) {
      }
    }

    const platformPublicKey = this.platformCertificates.get(serialNo);
    if (!platformPublicKey) {
      return false;
    }

    try {
      const verify = createVerify('RSA-SHA256');
      verify.update(message);
      const isValid = verify.verify(platformPublicKey, signature, 'base64');
      return isValid;
    } catch (error) {
      return false;
    }
  }
}
