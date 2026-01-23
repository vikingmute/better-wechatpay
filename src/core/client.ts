import { ofetch } from 'ofetch';
import crypto from 'crypto';
import type { Signer } from './sign';
import type { Verifier } from './verify';
import type { WeChatPayConfig } from '../types/index';
import { logger } from './debug';

export class HttpClient {
  constructor(
    private config: WeChatPayConfig,
    private signer: Signer,
    private verifier: Verifier,
    private instance?: object
  ) {}

  getBaseUrl(): string {
    return this.config.baseUrl || 'https://api.mch.weixin.qq.com';
  }

  getMerchantId(): string {
    return this.config.mchId;
  }

  getAppId(): string {
    return this.config.appId;
  }

  getNotifyUrl(): string | undefined {
    return this.config.notifyUrl;
  }

  async request<T>(
    method: string,
    path: string,
    data?: any,
    skipSignatureVerification = false
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const url = `${this.getBaseUrl()}${path}`;
    const body = data ? JSON.stringify(data) : '';

    const signature = this.signer.sign(method, path, timestamp, nonce, body);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'zh-CN',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.verifier.getMerchantSerialNo()}"`,
      'Wechatpay-Serial': this.config.publicKeyId || this.verifier.getMerchantSerialNo()
    };

    logger.log(this.instance || {}, 'Request:', {
      url,
      method,
      headers: this.sanitizeHeaders(headers),
      body: data
    });

    try {
      const response = await ofetch.raw(url, {
        method,
        body: data,
        headers
      });

      logger.log(this.instance || {}, 'Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: response._data
      });

      if (!skipSignatureVerification) {
        await this.verifyResponse(response);
      }

      return response._data as T;
    } catch (error: any) {
      logger.error(this.instance || {}, 'Request failed', error, {
        status: error.status,
        statusText: error.statusText,
        data: error.data
      });
      throw error;
    }
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'WECHATPAY2-SHA256-RSA2048 ***';
    }
    return sanitized;
  }

  private async verifyResponse(response: any): Promise<boolean> {
    try {
      const wechatpayTimestamp = response.headers.get('wechatpay-timestamp');
      const wechatpayNonce = response.headers.get('wechatpay-nonce');
      const wechatpaySignature = response.headers.get('wechatpay-signature');
      const wechatpaySerial = response.headers.get('wechatpay-serial');

      if (!wechatpayTimestamp || !wechatpayNonce || !wechatpaySignature || !wechatpaySerial) {
        return false;
      }

      let responseBody = '';
      if (response._data === null || response._data === undefined) {
        responseBody = '';
      } else if (typeof response._data === 'string') {
        responseBody = response._data;
      } else {
        responseBody = JSON.stringify(response._data);
      }

      return await this.verifier.verify(
        wechatpayTimestamp,
        wechatpayNonce,
        responseBody,
        wechatpaySignature,
        wechatpaySerial
      );
    } catch (error) {
      logger.error(this.instance || {}, 'Response verification failed', error as Error);
      return false;
    }
  }
}
