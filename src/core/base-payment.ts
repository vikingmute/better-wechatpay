import type { HttpClient } from './client';
import type {
  QueryOrderParams,
  QueryOrderResult,
  OrderQueryAPIResponse,
  QueryOrderByTransactionIdParams,
  QueryCombineOrderParams,
  QueryCombineOrderResult,
  CloseCombineOrderParams,
  RefundParams,
  RefundResult,
  QueryRefundParams,
  AbnormalRefundParams,
  ApplyTradeBillParams,
  BillResult,
  ApplyFundFlowBillParams
} from '../types';
import { logger } from './debug';

/**
 * 支付基类
 * 包含所有支付方式共用的方法：查询、关闭、退款、账单等
 */
export abstract class BasePayment {
  protected constructor(
    protected client: HttpClient,
    protected instance: object
  ) {}

  /**
   * 通过商户订单号查询订单
   */
  async query(params: QueryOrderParams): Promise<QueryOrderResult> {
    logger.log(this.instance, 'Querying order:', params);

    const mchid = params.mchid || this.client.getMerchantId();
    const result = await this.client.request<OrderQueryAPIResponse>(
      'GET',
      `/v3/pay/transactions/out-trade-no/${params.out_trade_no}?mchid=${mchid}`
    );

    return {
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      trade_state: result.trade_state as any,
      trade_state_desc: result.trade_state_desc,
      bank_type: result.bank_type,
      success_time: result.success_time,
      amount: {
        total: result.amount.total,
        currency: result.amount.currency
      }
    };
  }

  /**
   * 关闭订单
   */
  async close(out_trade_no: string): Promise<void> {
    logger.log(this.instance, 'Closing order:', out_trade_no);

    await this.client.request(
      'POST',
      `/v3/pay/transactions/out-trade-no/${out_trade_no}/close`,
      { mchid: this.client.getMerchantId() }
    );
  }

  /**
   * 查询合单订单
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557006
   */
  async queryCombineOrder(params: QueryCombineOrderParams): Promise<QueryCombineOrderResult> {
    logger.log(this.instance, 'Querying combine order:', params);

    const result = await this.client.request<any>(
      'GET',
      `/v3/combine-transactions/out-trade-no/${params.combine_out_trade_no}`
    );

    return {
      combine_appid: result.combine_appid,
      combine_mchid: result.combine_mchid,
      combine_out_trade_no: result.combine_out_trade_no,
      scene_info: result.scene_info,
      sub_orders: result.sub_orders,
      combine_payer_info: result.combine_payer_info
    };
  }

  /**
   * 关闭合单订单
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012557007
   */
  async closeCombineOrder(params: CloseCombineOrderParams): Promise<void> {
    logger.log(this.instance, 'Closing combine order:', params);

    const data = {
      combine_appid: this.client.getAppId(),
      sub_orders: params.sub_orders
    };

    await this.client.request(
      'POST',
      `/v3/combine-transactions/out-trade-no/${params.combine_out_trade_no}/close`,
      data
    );
  }

  /**
   * 通过微信支付订单号查询订单
   */
  async queryByTransactionId(params: QueryOrderByTransactionIdParams): Promise<QueryOrderResult> {
    logger.log(this.instance, 'Querying order by transaction id:', params);

    const mchid = params.mchid || this.client.getMerchantId();
    const result = await this.client.request<OrderQueryAPIResponse>(
      'GET',
      `/v3/pay/transactions/id/${params.transaction_id}?mchid=${mchid}`
    );

    return {
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      trade_state: result.trade_state as any,
      trade_state_desc: result.trade_state_desc,
      bank_type: result.bank_type,
      success_time: result.success_time,
      amount: {
        total: result.amount.total,
        currency: result.amount.currency
      }
    };
  }

  /**
   * 申请退款
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    logger.log(this.instance, 'Creating refund:', params);

    const data = this.removeUndefined({
      transaction_id: params.transaction_id,
      out_trade_no: params.out_trade_no,
      out_refund_no: params.out_refund_no,
      reason: params.reason,
      notify_url: params.notify_url,
      funds_account: params.funds_account,
      amount: {
        refund: this.formatAmount(params.refund),
        total: this.formatAmount(params.total),
        currency: params.currency || 'CNY',
        from: params.from
      },
      goods_detail: params.goods_detail
    });

    const result = await this.client.request<any>('POST', '/v3/refund/domestic/refunds', data);

    return this.parseRefundResult(result);
  }

  /**
   * 查询单笔退款
   */
  async queryRefund(params: QueryRefundParams): Promise<RefundResult> {
    logger.log(this.instance, 'Querying refund:', params);

    const result = await this.client.request<any>(
      'GET',
      `/v3/refund/domestic/refunds/${params.out_refund_no}`
    );

    return this.parseRefundResult(result);
  }

  /**
   * 发起异常退款
   */
  async applyAbnormalRefund(params: AbnormalRefundParams): Promise<RefundResult> {
    logger.log(this.instance, 'Applying abnormal refund:', params);

    const data = this.removeUndefined({
      out_refund_no: params.out_refund_no,
      type: params.type,
      bank_type: params.bank_type,
      bank_account: params.bank_account,
      real_name: params.real_name
    });

    const result = await this.client.request<any>(
      'POST',
      `/v3/refund/domestic/refunds/${params.refund_id}/apply-abnormal-refund`,
      data
    );

    return this.parseRefundResult(result);
  }

  /**
   * 申请交易账单
   */
  async applyTradeBill(params: ApplyTradeBillParams): Promise<BillResult> {
    logger.log(this.instance, 'Applying trade bill:', params);

    const queryParams = this.buildQueryString({
      bill_date: params.bill_date,
      bill_type: params.bill_type,
      tar_type: params.tar_type
    });

    const result = await this.client.request<any>(
      'GET',
      `/v3/bill/tradebill?${queryParams}`
    );

    return {
      hash_type: result.hash_type,
      hash_value: result.hash_value,
      download_url: result.download_url
    };
  }

  /**
   * 申请资金账单
   */
  async applyFundFlowBill(params: ApplyFundFlowBillParams): Promise<BillResult> {
    logger.log(this.instance, 'Applying fund flow bill:', params);

    const queryParams = this.buildQueryString({
      bill_date: params.bill_date,
      account_type: params.account_type,
      tar_type: params.tar_type
    });

    const result = await this.client.request<any>(
      'GET',
      `/v3/bill/fundflowbill?${queryParams}`
    );

    return {
      hash_type: result.hash_type,
      hash_value: result.hash_value,
      download_url: result.download_url
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 解析退款结果
   */
  protected parseRefundResult(result: any): RefundResult {
    return {
      refund_id: result.refund_id,
      out_refund_no: result.out_refund_no,
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      channel: result.channel as any,
      user_received_account: result.user_received_account,
      success_time: result.success_time,
      create_time: result.create_time,
      status: result.status as any,
      funds_account: result.funds_account as any,
      amount: {
        total: result.amount.total,
        refund: result.amount.refund,
        from: result.amount.from,
        payer_total: result.amount.payer_total,
        payer_refund: result.amount.payer_refund,
        settlement_refund: result.amount.settlement_refund,
        settlement_total: result.amount.settlement_total,
        discount_refund: result.amount.discount_refund,
        currency: result.amount.currency,
        refund_fee: result.amount.refund_fee
      },
      promotion_detail: result.promotion_detail,
      goods_detail: result.goods_detail
    };
  }

  /**
   * 金额转换：元 → 分
   */
  protected formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * 递归移除对象中的 undefined 值
   */
  protected removeUndefined<T extends object>(obj: T): T {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        continue;
      }
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const cleaned = this.removeUndefined(value);
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned;
        }
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.removeUndefined(item) 
            : item
        );
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * 构建 URL 查询字符串，自动过滤 undefined 值
   */
  protected buildQueryString(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    }
    
    return searchParams.toString();
  }
}
