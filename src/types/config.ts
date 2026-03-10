export interface WeChatPayConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  privateKey: Buffer | string;
  publicKey: Buffer | string;
  paymentPublicKey?: Buffer | string;
  publicKeyId?: string;
  skipFetchPlatformCertificates?: boolean;
  notifyUrl?: string;
  baseUrl?: string;
  debug?: boolean;
}

export interface WeChatPayOptions {
  config?: WeChatPayConfig;
  configPath?: string;
}
