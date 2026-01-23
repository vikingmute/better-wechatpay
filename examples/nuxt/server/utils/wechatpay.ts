import WeChatPay, { type WeChatPayConfig } from 'better-wechatpay';

let wechatPayInstance: WeChatPay | null = null;

export function getWeChatPayClient(): WeChatPay {
  if (wechatPayInstance) {
    return wechatPayInstance;
  }

  const config: WeChatPayConfig = {
    appId: useRuntimeConfig().wechatPay.appId,
    mchId: useRuntimeConfig().wechatPay.mchId,
    apiKey: useRuntimeConfig().wechatPay.apiKey,
    privateKey: useRuntimeConfig().wechatPay.privateKey,
    publicKey: useRuntimeConfig().wechatPay.publicKey,
    paymentPublicKey: useRuntimeConfig().wechatPay.paymentPublicKey,
    publicKeyId: useRuntimeConfig().wechatPay.publicKeyId,
    notifyUrl: useRuntimeConfig().wechatPay.notifyUrl,
    debug: useRuntimeConfig().wechatPay.debug,
  };

  if (!config.appId || !config.mchId || !config.apiKey || !config.privateKey || !config.publicKey) {
    throw new Error('Missing required WeChat Pay environment variables');
  }

  wechatPayInstance = new WeChatPay({ config });
  return wechatPayInstance;
}
