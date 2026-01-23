const DEFAULT_DEBUG = process.env.WECHAT_PAY_DEBUG === 'true' || false;

const debugEnabled = new WeakMap<object, boolean>();

export function setDebugEnabled(instance: object, enabled: boolean) {
  debugEnabled.set(instance, enabled);
}

export function getDebugEnabled(instance: object): boolean {
  return debugEnabled.get(instance) ?? DEFAULT_DEBUG;
}

export const logger = {
  log: (instance: object, message: string, ...args: any[]) => {
    if (getDebugEnabled(instance)) {
      console.log(`[WeChatPay] ${message}`, ...args);
    }
  },
  error: (instance: object, message: string, error?: Error, ...args: any[]) => {
    console.error(`[WeChatPay] ${message}`, error?.message, ...args);
    if (error && getDebugEnabled(instance)) {
      console.error(error.stack);
    }
  }
};
