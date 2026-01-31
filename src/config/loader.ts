import { WeChatPayConfig, WeChatPayOptions } from '../types/index.js';

export function loadConfig(options: WeChatPayOptions | WeChatPayConfig): WeChatPayConfig {
  if ((options as WeChatPayOptions).configPath) {
    throw new Error('Loading config from file is not yet implemented');
  }

  let config: WeChatPayConfig;
  
  if ((options as WeChatPayOptions).config) {
    config = (options as WeChatPayOptions).config!;
  } else {
    config = options as WeChatPayConfig;
  }

  if (!config.appId) throw new Error('appId is required');
  if (!config.mchId) throw new Error('mchId is required');
  if (!config.apiKey) throw new Error('apiKey is required');
  if (!config.privateKey) throw new Error('privateKey is required');
  if (!config.publicKey) throw new Error('publicKey is required');

  if (config.debug === undefined) {
    config.debug = process.env.WECHAT_PAY_DEBUG === 'true';
  }

  if (!config.baseUrl) {
    config.baseUrl = 'https://api.mch.weixin.qq.com';
  }

  return config;
}
