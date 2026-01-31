import WeChatPay, { type WeChatPayConfig } from 'better-wechatpay';

let wechatPayInstance: WeChatPay | null = null;

export function getWeChatPayClient(): WeChatPay {
  if (wechatPayInstance) {
    return wechatPayInstance;
  }

  const runtimeConfig = useRuntimeConfig();
  const port = process.env.PORT || '3000';
  const defaultNotifyUrl = `http://localhost:${port}/api/wechatpay/webhook`;
  
  const config: WeChatPayConfig = {
    appId: runtimeConfig.wechatPay.appId,
    mchId: runtimeConfig.wechatPay.mchId,
    apiKey: runtimeConfig.wechatPay.apiKey,
    privateKey: runtimeConfig.wechatPay.privateKey,
    publicKey: runtimeConfig.wechatPay.publicKey,
    paymentPublicKey: runtimeConfig.wechatPay.paymentPublicKey,
    publicKeyId: runtimeConfig.wechatPay.publicKeyId,
    notifyUrl: runtimeConfig.wechatPay.notifyUrl || defaultNotifyUrl,
    debug: runtimeConfig.wechatPay.debug,
  };

  if (!config.appId || !config.mchId || !config.apiKey || !config.privateKey || !config.publicKey) {
    throw new Error('Missing required WeChat Pay environment variables');
  }

  wechatPayInstance = new WeChatPay({ config });
  return wechatPayInstance;
}
