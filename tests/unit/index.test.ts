import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@peculiar/x509', () => ({
  X509Certificate: class {
    serialNumber = 'mock_serial_no';
  }
}));

import WeChatPay from '../../src/index';
import { CertificateManager } from '../../src/core/cert-manager';
import { createMockConfig } from '../utils/test-helpers';

describe('WeChatPay initialization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch platform certificates by default', async () => {
    const fetchCertificatesSpy = vi
      .spyOn(CertificateManager.prototype, 'fetchCertificates')
      .mockResolvedValue();

    new WeChatPay({
      config: createMockConfig()
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchCertificatesSpy).toHaveBeenCalledTimes(1);
  });

  it('should only fetch platform certificates once when using static initialize', async () => {
    const fetchCertificatesSpy = vi
      .spyOn(CertificateManager.prototype, 'fetchCertificates')
      .mockResolvedValue();

    await WeChatPay.initialize({
      config: createMockConfig()
    });

    expect(fetchCertificatesSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip fetching platform certificates when skipFetchPlatformCertificates is true', async () => {
    const fetchCertificatesSpy = vi
      .spyOn(CertificateManager.prototype, 'fetchCertificates')
      .mockResolvedValue();

    new WeChatPay({
      config: createMockConfig({
        skipFetchPlatformCertificates: true
      })
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchCertificatesSpy).not.toHaveBeenCalled();
  });

  it('should skip fetching by default when paymentPublicKey and publicKeyId are provided', async () => {
    const fetchCertificatesSpy = vi
      .spyOn(CertificateManager.prototype, 'fetchCertificates')
      .mockResolvedValue();

    new WeChatPay({
      config: createMockConfig({
        paymentPublicKey: 'test_payment_public_key',
        publicKeyId: 'PUB_KEY_ID_xxx'
      })
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchCertificatesSpy).not.toHaveBeenCalled();
  });

  it('should force fetching when forceFetchPlatformCertificates is true', async () => {
    const fetchCertificatesSpy = vi
      .spyOn(CertificateManager.prototype, 'fetchCertificates')
      .mockResolvedValue();

    new WeChatPay({
      config: createMockConfig({
        paymentPublicKey: 'test_payment_public_key',
        publicKeyId: 'PUB_KEY_ID_xxx',
        forceFetchPlatformCertificates: true
      })
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchCertificatesSpy).toHaveBeenCalledTimes(1);
  });
});
