import type { WeChatPayConfig, WeChatPayOptions } from './types/config';
import { loadConfig } from './config/loader';
import { setDebugEnabled } from './core/debug';
import { Signer } from './core/sign';
import { Verifier } from './core/verify';
import { CryptoUtils } from './core/crypto';
import { CertificateManager } from './core/cert-manager';
import { HttpClient } from './core/client';
import { NativePayment } from './native/native';
import { JSAPIPayment } from './jsapi/jsapi';
import { AppPayment } from './app/app';
import { H5Payment } from './h5/h5';
import { Webhook } from './webhook/webhook';
import type { CertificateAPIResponse } from './types/api';

export class WeChatPay {
  public readonly config: any;
  public readonly native: NativePayment;
  public readonly jsapi: JSAPIPayment;
  public readonly app: AppPayment;
  public readonly h5: H5Payment;
  public readonly webhook: Webhook;
  private readonly httpClient: HttpClient;

  constructor(options: any) {
    const config = loadConfig(options);
    setDebugEnabled(this, config.debug || false);

    const signer = new Signer(config);
    const verifier = new Verifier(config);
    const cryptoUtils = new CryptoUtils(config);

    const httpClient = new HttpClient(config, signer, verifier);
    const certManager = new CertificateManager(config, verifier, cryptoUtils, this);

    this.config = config;
    this.httpClient = httpClient;
    this.native = new NativePayment(httpClient, this);
    this.jsapi = new JSAPIPayment(httpClient, this);
    this.app = new AppPayment(httpClient, this);
    this.h5 = new H5Payment(httpClient, this);
    this.webhook = new Webhook(verifier, cryptoUtils, this);

    this.initializeCertificates(certManager, httpClient, config);
  }

  /**
   * 获取底层 HTTP 客户端，用于自定义 API 调用
   * @example
   * ```typescript
   * const result = await wechat.request('GET', '/v3/custom/endpoint');
   * ```
   */
  public async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any
  ): Promise<T> {
    return this.httpClient.request<T>(method, url, data);
  }

  private async initializeCertificates(
    certManager: CertificateManager,
    httpClient: HttpClient,
    config: any
  ): Promise<void> {
    if (!config.paymentPublicKey || !config.publicKeyId) {
      await certManager.fetchCertificates(() =>
        httpClient.request<CertificateAPIResponse>('GET', '/v3/certificates', undefined, true)
      );
    }
  }

  public static async initialize(options: any): Promise<WeChatPay> {
    const instance = new WeChatPay(options);
    await instance.initializeCertificates(
      (instance as any).certManager,
      (instance as any).httpClient,
      instance.config
    );
    return instance;
  }
}

export * from './types/config';
export * from './types/payment';
export * from './types/webhook';
export default WeChatPay;
