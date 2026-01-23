export interface WebhookParams {
  headers: {
    'wechatpay-signature': string;
    'wechatpay-timestamp': string;
    'wechatpay-nonce': string;
    'wechatpay-serial': string;
  };
  body: string;
}

export interface WebhookVerificationResult {
  success: boolean;
  eventType?: WebhookEventType;
  decryptedData?: any;
}

export type WebhookEventType = 
  | 'TRANSACTION.SUCCESS'
  | 'TRANSACTION.CLOSED'
  | 'REFUND.SUCCESS'
  | 'REFUND.CLOSED';
