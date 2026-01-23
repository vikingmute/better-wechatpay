// ==================== API 响应类型 ====================

export interface CreateNativePaymentAPIResponse {
  code_url: string;
}

export interface CreateJSAPIPaymentAPIResponse {
  prepay_id: string;
}

export interface CreateAppPaymentAPIResponse {
  prepay_id: string;
}

export interface CreateH5PaymentAPIResponse {
  h5_url: string;
}

export interface CreateCombineAppPaymentAPIResponse {
  prepay_id: string;
}

export interface CreateCombineJSAPIPaymentAPIResponse {
  prepay_id: string;
}

export interface CreateCombineMiniProgramPaymentAPIResponse {
  prepay_id: string;
}

export interface CreateCombineH5PaymentAPIResponse {
  h5_url: string;
}

export interface CreateCombineNativePaymentAPIResponse {
  code_url: string;
}

export interface OrderQueryAPIResponse {
  mchid: string;
  appid: string;
  out_trade_no: string;
  transaction_id: string;
  trade_type: string;
  trade_state: string;
  trade_state_desc: string;
  bank_type: string;
  success_time?: string;
  payer: {
    openid: string;
  };
  amount: {
    total: number;
    payer_total: number;
    currency: string;
    payer_currency: string;
  };
}

export interface CertificateAPIResponse {
  data: Array<{
    serial_no: string;
    effective_time: string;
    expire_time: string;
    encrypt_certificate: {
      algorithm: string;
      nonce: string;
      associated_data: string;
      ciphertext: string;
    };
  }>;
}

export interface WebhookNotification {
  id: string;
  create_time: string;
  resource_type: 'encrypt-resource';
  event_type: string;
  summary: string;
  resource: {
    original_type: 'transaction' | 'refund';
    algorithm: 'AEAD_AES_256_GCM';
    ciphertext: string;
    associated_data: string;
    nonce: string;
  };
}

export interface DecryptedTransactionNotification {
  mchid: string;
  appid: string;
  out_trade_no: string;
  transaction_id: string;
  trade_type: string;
  trade_state: string;
  trade_state_desc: string;
  bank_type: string;
  success_time: string;
  payer: {
    openid: string;
  };
  amount: {
    total: number;
    payer_total: number;
    currency: string;
    payer_currency: string;
  };
}

export interface DecryptedRefundNotification {
  mchid: string;
  out_trade_no: string;
  transaction_id: string;
  out_refund_no: string;
  refund_id: string;
  refund_status: string;
  success_time?: string;
  user_received_account: string;
  amount: {
    total: number;
    refund: number;
    payer_total: number;
    payer_refund: number;
  };
}

export interface RefundAPIResponse {
  refund_id: string;
  out_refund_no: string;
  transaction_id?: string;
  out_trade_no?: string;
  channel: string;
  user_received_account: string;
  success_time?: string;
  create_time: string;
  status: string;
  funds_account: string;
  amount: {
    total: number;
    refund: number;
    from?: Array<{ account: string; amount: number }>;
    payer_total: number;
    payer_refund: number;
    settlement_refund: number;
    settlement_total: number;
    discount_refund: number;
    currency: string;
    refund_fee?: number;
  };
  promotion_detail?: Array<{
    promotion_id: string;
    scope: string;
    type: string;
    amount: number;
    refund_amount: number;
    goods_detail?: Array<{
      merchant_goods_id: string;
      wechatpay_goods_id?: string;
      goods_name?: string;
      unit_price: number;
      refund_amount: number;
      refund_quantity: number;
    }>;
  }>;
  goods_detail?: Array<{
    merchant_goods_id: string;
    wechatpay_goods_id?: string;
    goods_name?: string;
    unit_price: number;
    refund_amount: number;
    refund_quantity: number;
  }>;
}

export interface BillAPIResponse {
  hash_type: string;
  hash_value: string;
  download_url: string;
}
