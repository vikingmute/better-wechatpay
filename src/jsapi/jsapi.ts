import type { HttpClient } from '../core/client.js';
import type {
  CreateJSAPIPaymentParams,
  CreateJSAPIPaymentResult,
  CreateJSAPIPaymentAPIResponse,
  CreateCombineJSAPIPaymentParams,
  CreateCombineJSAPIPaymentResult,
  CreateCombineJSAPIPaymentAPIResponse,
  CreateCombineMiniProgramPaymentParams,
  CreateCombineMiniProgramPaymentResult,
  CreateCombineMiniProgramPaymentAPIResponse
} from '../types/index.js';
import { BasePayment } from '../core/base-payment.js';
import { logger } from '../core/debug.js';

/**
 * JSAPI支付 / 小程序支付
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791854
 */
export class JSAPIPayment extends BasePayment {
  constructor(client: HttpClient, instance: object) {
    super(client, instance);
  }

  /**
   * JSAPI/小程序下单
   * 商户系统先调用该接口在微信支付服务后台生成预支付交易单，返回正确的预支付交易会话标识后，
   * 再按照JSAPI调起支付的规范调起支付。
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791856
   */
  async create(params: CreateJSAPIPaymentParams): Promise<CreateJSAPIPaymentResult> {
    logger.log(this.instance, 'Creating JSAPI payment:', params);

    if (!params.openid) {
      throw new Error('openid is required for JSAPI/MiniProgram payment');
    }

    const data = this.removeUndefined({
      appid: this.client.getAppId(),
      mchid: this.client.getMerchantId(),
      description: params.description,
      out_trade_no: params.out_trade_no,
      time_expire: params.time_expire,
      attach: params.attach,
      notify_url: this.client.getNotifyUrl(),
      goods_tag: params.goods_tag,
      support_fapiao: params.support_fapiao,
      amount: {
        total: this.resolveAmountInCents(params.amount_cents, params.amount),
        currency: params.currency || 'CNY'
      },
      payer: {
        openid: params.openid
      },
      detail: params.detail ? {
        cost_price: params.detail.cost_price,
        invoice_id: params.detail.invoice_id,
        goods_detail: params.detail.goods_detail
      } : undefined,
      scene_info: {
        payer_client_ip: params.payer_client_ip || params.scene_info?.payer_client_ip || '127.0.0.1',
        device_id: params.scene_info?.device_id,
        store_info: params.scene_info?.store_info
      },
      settle_info: params.settle_info
    });

    const result = await this.client.request<CreateJSAPIPaymentAPIResponse>(
      'POST',
      '/v3/pay/transactions/jsapi',
      data
    );

    return {
      prepay_id: result.prepay_id,
      out_trade_no: params.out_trade_no
    };
  }

  /**
   * JSAPI合单下单
   */
  async createCombine(params: CreateCombineJSAPIPaymentParams): Promise<CreateCombineJSAPIPaymentResult> {
    logger.log(this.instance, 'Creating JSAPI combine payment:', params);

    if (!params.openid) {
      throw new Error('openid is required for JSAPI combine payment');
    }

    const data = this.removeUndefined({
      combine_appid: this.client.getAppId(),
      combine_mchid: this.client.getMerchantId(),
      combine_out_trade_no: params.combine_out_trade_no,
      time_expire: params.time_expire,
      notify_url: params.notify_url || this.client.getNotifyUrl(),
      combine_payer_info: {
        openid: params.openid
      },
      sub_orders: params.sub_orders.map((order) => ({
        mchid: order.mchid,
        attach: order.attach,
        out_trade_no: order.out_trade_no,
        description: order.description,
        amount: {
          total_amount: this.resolveAmountInCents(order.amount.total_amount_cents, order.amount.total_amount, 'sub_orders[].amount.total_amount_cents'),
          currency: order.amount.currency || 'CNY'
        },
        detail: order.detail,
        goods_tag: order.goods_tag,
        settle_info: order.settle_info
      }))
    });

    const result = await this.client.request<CreateCombineJSAPIPaymentAPIResponse>(
      'POST',
      '/v3/combine-transactions/jsapi',
      data
    );

    return {
      prepay_id: result.prepay_id,
      combine_out_trade_no: params.combine_out_trade_no
    };
  }

  /**
   * 小程序合单下单
   */
  async createCombineMiniProgram(
    params: CreateCombineMiniProgramPaymentParams
  ): Promise<CreateCombineMiniProgramPaymentResult> {
    logger.log(this.instance, 'Creating mini-program combine payment:', params);

    if (!params.openid) {
      throw new Error('openid is required for mini-program combine payment');
    }

    const data = this.removeUndefined({
      combine_appid: this.client.getAppId(),
      combine_mchid: this.client.getMerchantId(),
      combine_out_trade_no: params.combine_out_trade_no,
      time_expire: params.time_expire,
      notify_url: params.notify_url || this.client.getNotifyUrl(),
      combine_payer_info: {
        openid: params.openid
      },
      sub_orders: params.sub_orders.map((order) => ({
        mchid: order.mchid,
        attach: order.attach,
        out_trade_no: order.out_trade_no,
        description: order.description,
        amount: {
          total_amount: this.resolveAmountInCents(order.amount.total_amount_cents, order.amount.total_amount, 'sub_orders[].amount.total_amount_cents'),
          currency: order.amount.currency || 'CNY'
        },
        detail: order.detail,
        goods_tag: order.goods_tag,
        settle_info: order.settle_info
      }))
    });

    const result = await this.client.request<CreateCombineMiniProgramPaymentAPIResponse>(
      'POST',
      '/v3/combine-transactions/mini-program',
      data
    );

    return {
      prepay_id: result.prepay_id,
      combine_out_trade_no: params.combine_out_trade_no
    };
  }
}
