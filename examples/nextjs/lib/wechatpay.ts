import WeChatPay, { type WeChatPayConfig } from 'better-wechatpay';

let wechatPayInstance: WeChatPay | null = null;

export function getWeChatPayClient(): WeChatPay {
  if (wechatPayInstance) {
    return wechatPayInstance;
  }

  const port = process.env.PORT || '3000';
  const defaultNotifyUrl = `http://localhost:${port}/api/wechatpay/webhook`;
  
  const config: WeChatPayConfig = {
    appId: process.env.WECHAT_PAY_APP_ID!,
    mchId: process.env.WECHAT_PAY_MCH_ID!,
    apiKey: process.env.WECHAT_PAY_API_KEY!,
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY!,
    publicKey: process.env.WECHAT_PAY_PUBLIC_KEY!,
    paymentPublicKey: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
    publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || defaultNotifyUrl,
    debug: process.env.WECHAT_PAY_DEBUG === 'true',
  };

  if (!config.appId || !config.mchId || !config.apiKey || !config.privateKey || !config.publicKey) {
    throw new Error('Missing required WeChat Pay environment variables');
  }

  wechatPayInstance = new WeChatPay({ config });
  return wechatPayInstance;
}
