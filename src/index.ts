import type { WeChatPayConfig, WeChatPayOptions } from './types/config.js';
import { loadConfig } from './config/loader.js';
import { setDebugEnabled } from './core/debug.js';
import { Signer } from './core/sign.js';
import { Verifier } from './core/verify.js';
import { CryptoUtils } from './core/crypto.js';
import { CertificateManager } from './core/cert-manager.js';
import { HttpClient } from './core/client.js';
import { NativePayment } from './native/native.js';
import { JSAPIPayment } from './jsapi/jsapi.js';
import { AppPayment } from './app/app.js';
import { H5Payment } from './h5/h5.js';
import { Webhook } from './webhook/webhook.js';
import type { CertificateAPIResponse } from './types/api.js';

export class WeChatPay {
  public readonly config: any;
  public readonly native: NativePayment;
  public readonly jsapi: JSAPIPayment;
  public readonly app: AppPayment;
  public readonly h5: H5Payment;
  public readonly webhook: Webhook;
  private readonly httpClient: HttpClient;
  private readonly certManager: CertificateManager;
  private readonly initPromise: Promise<void>;

  constructor(options: any) {
    const config = loadConfig(options);
    setDebugEnabled(this, config.debug || false);

    const signer = new Signer(config);
    const verifier = new Verifier(config, this);
    const cryptoUtils = new CryptoUtils(config);

    const httpClient = new HttpClient(config, signer, verifier, this);
    const certManager = new CertificateManager(config, verifier, cryptoUtils, this);

    this.config = config;
    this.httpClient = httpClient;
    this.certManager = certManager;
    this.native = new NativePayment(httpClient, this);
    this.jsapi = new JSAPIPayment(httpClient, this);
    this.app = new AppPayment(httpClient, this);
    this.h5 = new H5Payment(httpClient, this);
    this.webhook = new Webhook(verifier, cryptoUtils, this);

    this.initPromise = this.initializeCertificates(certManager, httpClient, config);
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
    if (config.skipFetchPlatformCertificates) {
      return;
    }

    await certManager.fetchCertificates(() =>
      httpClient.request<CertificateAPIResponse>('GET', '/v3/certificates', undefined, true)
    );
  }

  public static async initialize(options: any): Promise<WeChatPay> {
    const instance = new WeChatPay(options);
    await instance.initPromise;
    return instance;
  }
}

export * from './types/config.js';
export * from './types/payment.js';
export * from './types/webhook.js';
export default WeChatPay;
