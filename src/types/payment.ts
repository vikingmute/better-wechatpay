// ==================== 通用类型 ====================

export type TradeState = 
  | 'SUCCESS'
  | 'REFUND'
  | 'NOTPAY'
  | 'CLOSED'
  | 'REVOKED'
  | 'USERPAYING'
  | 'PAYERROR';

export type RefundStatus = 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL';

export type RefundChannel = 'ORIGINAL' | 'BALANCE' | 'OTHER_BALANCE' | 'OTHER_BANKCARD';

export type RefundFundsAccount = 'UNSETTLED' | 'AVAILABLE' | 'UNAVAILABLE' | 'OPERATION' | 'BASIC' | 'ECNY_BASIC';

export type BillType = 'ALL' | 'SUCCESS' | 'REFUND';

export type FundFlowAccountType = 'BASIC' | 'OPERATION' | 'FEES';

// ==================== 通用结构 ====================

/** 商品详情 */
export interface GoodsDetail {
  merchant_goods_id: string;
  wechatpay_goods_id?: string;
  goods_name: string;
  quantity: number;
  unit_price: number;
}

/** 门店信息 */
export interface StoreInfo {
  id: string;
  name?: string;
  area_code?: string;
  address?: string;
}

/** 场景信息 */
export interface SceneInfo {
  payer_client_ip: string;
  device_id?: string;
  store_info?: StoreInfo;
}

/** 订单详情 */
export interface OrderDetail {
  cost_price?: number;
  invoice_id?: string;
  goods_detail?: GoodsDetail[];
}

/** 结算信息 */
export interface SettleInfo {
  profit_sharing: boolean;
}

// ==================== Native 支付 ====================

export interface CreateNativePaymentParams {
  out_trade_no: string;
  description: string;
  amount_fen?: number;
  /** @deprecated 请改用 amount_fen（单位：分） */
  amount?: number;
  currency?: string;
  payer_client_ip?: string;
  time_expire?: string;
  attach?: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  detail?: OrderDetail;
  scene_info?: SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreateNativePaymentResult {
  code_url: string;
  out_trade_no: string;
}

// ==================== APP 支付 ====================

export interface CreateAppPaymentParams {
  out_trade_no: string;
  description: string;
  amount_fen?: number;
  /** @deprecated 请改用 amount_fen（单位：分） */
  amount?: number;
  currency?: string;
  payer_client_ip?: string;
  time_expire?: string;
  attach?: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  detail?: OrderDetail;
  scene_info?: SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreateAppPaymentResult {
  prepay_id: string;
  out_trade_no: string;
}

// ==================== JSAPI / 小程序支付 ====================

export interface CreateJSAPIPaymentParams {
  out_trade_no: string;
  description: string;
  amount_fen?: number;
  /** @deprecated 请改用 amount_fen（单位：分） */
  amount?: number;
  currency?: string;
  openid: string;  // 必填：用户在商户appid下的唯一标识
  payer_client_ip?: string;
  time_expire?: string;
  attach?: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  detail?: OrderDetail;
  scene_info?: SceneInfo;
  settle_info?: SettleInfo;
}

export interface CreateJSAPIPaymentResult {
  prepay_id: string;
  out_trade_no: string;
}

// ==================== H5 支付 ====================

export interface H5Info {
  type: 'Wap' | 'iOS' | 'Android';
  app_name?: string;
  app_url?: string;
  bundle_id?: string;
  package_name?: string;
}

export interface H5SceneInfo {
  payer_client_ip: string;
  device_id?: string;
  store_info?: StoreInfo;
  h5_info: H5Info;  // H5支付必填
}

export interface CreateH5PaymentParams {
  out_trade_no: string;
  description: string;
  amount_fen?: number;
  /** @deprecated 请改用 amount_fen（单位：分） */
  amount?: number;
  currency?: string;
  payer_client_ip?: string;  // 便捷设置，会合并到 scene_info.payer_client_ip
  time_expire?: string;
  attach?: string;
  goods_tag?: string;
  support_fapiao?: boolean;
  detail?: OrderDetail;
  scene_info?: H5SceneInfo;  // H5支付场景信息（包含 h5_info）
  settle_info?: SettleInfo;
  h5_info?: H5Info;  // 便捷设置，会合并到 scene_info.h5_info
}

export interface CreateH5PaymentResult {
  h5_url: string;
  out_trade_no: string;
}

// ==================== 合单支付 ====================

export interface CombineSubOrderAmount {
  total_amount_fen?: number; // 单位：分（推荐）
  /** @deprecated 请改用 total_amount_fen（单位：分） */
  total_amount?: number; // 单位：元（SDK 会自动转换为分）
  currency?: string;
}

export interface CombineSubOrder {
  mchid: string;
  out_trade_no: string;
  description: string;
  attach: string;
  amount: CombineSubOrderAmount;
  detail?: string;
  goods_tag?: string;
  settle_info?: SettleInfo;
}

export interface CombineBaseParams {
  combine_out_trade_no: string;
  time_expire?: string;
  notify_url?: string;
  sub_orders: CombineSubOrder[];
}

export interface CreateCombineAppPaymentParams extends CombineBaseParams {
  payer_client_ip?: string;
  scene_info?: SceneInfo;
}

export interface CreateCombineAppPaymentResult {
  prepay_id: string;
  combine_out_trade_no: string;
}

export interface CreateCombineH5PaymentParams extends CombineBaseParams {
  payer_client_ip?: string;
  scene_info?: H5SceneInfo;
  h5_info?: H5Info;
}

export interface CreateCombineH5PaymentResult {
  h5_url: string;
  combine_out_trade_no: string;
}

export interface CreateCombineJSAPIPaymentParams extends CombineBaseParams {
  openid: string;
}

export interface CreateCombineJSAPIPaymentResult {
  prepay_id: string;
  combine_out_trade_no: string;
}

export interface CreateCombineMiniProgramPaymentParams extends CombineBaseParams {
  openid: string;
}

export interface CreateCombineMiniProgramPaymentResult {
  prepay_id: string;
  combine_out_trade_no: string;
}

export interface CreateCombineNativePaymentParams extends CombineBaseParams {
  payer_client_ip?: string;
  scene_info?: SceneInfo;
}

export interface CreateCombineNativePaymentResult {
  code_url: string;
  combine_out_trade_no: string;
}

// ==================== 订单查询 ====================

export interface QueryOrderParams {
  out_trade_no: string;
  mchid?: string;
}

export interface QueryOrderByTransactionIdParams {
  transaction_id: string;
  mchid?: string;
}

export interface QueryOrderResult {
  transaction_id: string;
  out_trade_no: string;
  trade_state: TradeState;
  trade_state_desc: string;
  bank_type: string;
  success_time?: string;
  amount: {
    total: number;
    currency: string;
  };
}

// ==================== 合单订单查询 ====================

export interface QueryCombineOrderParams {
  combine_out_trade_no: string;
}

export interface QueryCombineOrderResult {
  combine_appid: string;
  combine_mchid: string;
  combine_out_trade_no: string;
  scene_info?: {
    device_id?: string;
  };
  sub_orders: Array<{
    mchid: string;
    trade_type: string;
    trade_state: TradeState;
    bank_type?: string;
    attach?: string;
    success_time?: string;
    transaction_id?: string;
    out_trade_no: string;
    sub_mchid?: string;
    amount: {
      total_amount: number;
      currency?: string;
      payer_amount?: number;
      payer_currency?: string;
    };
  }>;
  combine_payer_info?: {
    openid: string;
  };
}

export interface CloseCombineOrderParams {
  combine_out_trade_no: string;
  sub_orders: Array<{
    mchid: string;
    out_trade_no: string;
  }>;
}

// ==================== 退款 ====================

export interface RefundParams {
  transaction_id?: string;
  out_trade_no?: string;
  out_refund_no: string;
  reason?: string;
  notify_url?: string;
  funds_account?: 'AVAILABLE' | 'UNSETTLED';
  refund: number;
  total: number;
  currency?: string;
  from?: Array<{ account: 'AVAILABLE' | 'UNAVAILABLE'; amount: number }>;
  goods_detail?: Array<{
    merchant_goods_id: string;
    wechatpay_goods_id?: string;
    goods_name?: string;
    unit_price: number;
    refund_amount: number;
    refund_quantity: number;
  }>;
}

export interface RefundResult {
  refund_id: string;
  out_refund_no: string;
  transaction_id?: string;
  out_trade_no?: string;
  channel: RefundChannel;
  user_received_account: string;
  success_time?: string;
  create_time: string;
  status: RefundStatus;
  funds_account: RefundFundsAccount;
  amount: {
    total: number;
    refund: number;
    from?: Array<{ account: 'AVAILABLE' | 'UNAVAILABLE'; amount: number }>;
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
    scope: 'GLOBAL' | 'SINGLE';
    type: 'CASH' | 'NOCASH';
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

export interface QueryRefundParams {
  out_refund_no: string;
}

export interface AbnormalRefundParams {
  refund_id: string;
  out_refund_no: string;
  type: 'USER_BANK_CARD' | 'MERCHANT_BANK_CARD';
  bank_type?: string;
  bank_account?: string;
  real_name?: string;
}

// ==================== 账单 ====================

export interface ApplyTradeBillParams {
  bill_date: string;
  bill_type?: BillType;
  tar_type?: 'GZIP';
}

export interface BillResult {
  hash_type: 'SHA1';
  hash_value: string;
  download_url: string;
}

export interface DownloadBillParams {
  download_url: string;
  local_file_path: string;
  expected_hash_value: string;
  expected_hash_type?: 'SHA1';
  tar_type?: 'GZIP';
}

export interface DownloadBillResult {
  success: boolean;
  file_path: string;
  hash_match?: boolean;
}

export interface ApplyFundFlowBillParams {
  bill_date: string;
  account_type?: FundFlowAccountType;
  tar_type?: 'GZIP';
}
