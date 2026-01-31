import type { HttpClient } from '../core/client.js';
import type {
  CreateNativePaymentParams,
  CreateNativePaymentResult,
  CreateCombineNativePaymentParams,
  CreateCombineNativePaymentResult,
  CreateCombineNativePaymentAPIResponse
} from '../types/index.js';
import { BasePayment } from '../core/base-payment.js';
import { logger } from '../core/debug.js';

/**
 * Native支付（扫码支付）
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791874
 */
export class NativePayment extends BasePayment {
  constructor(client: HttpClient, instance: object) {
    super(client, instance);
  }

  /**
   * Native下单
   * 商户系统先调用该接口在微信支付服务后台生成预支付交易单，返回正确的 code_url 后，
   * 将其生成二维码，用户扫码后即可完成支付。
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791875
   */
  async create(params: CreateNativePaymentParams): Promise<CreateNativePaymentResult> {
    logger.log(this.instance, 'Creating native payment:', params);

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
        total: this.formatAmount(params.amount),
        currency: params.currency || 'CNY'
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

    const result = await this.client.request<{ code_url: string }>(
      'POST',
      '/v3/pay/transactions/native',
      data
    );

    return {
      code_url: result.code_url,
      out_trade_no: params.out_trade_no
    };
  }

  /**
   * Native合单下单
   */
  async createCombine(params: CreateCombineNativePaymentParams): Promise<CreateCombineNativePaymentResult> {
    logger.log(this.instance, 'Creating native combine payment:', params);

    const data = this.removeUndefined({
      combine_appid: this.client.getAppId(),
      combine_mchid: this.client.getMerchantId(),
      combine_out_trade_no: params.combine_out_trade_no,
      time_expire: params.time_expire,
      notify_url: params.notify_url || this.client.getNotifyUrl(),
      scene_info: params.payer_client_ip || params.scene_info ? {
        payer_client_ip: params.payer_client_ip || params.scene_info?.payer_client_ip || '127.0.0.1',
        device_id: params.scene_info?.device_id,
        store_info: params.scene_info?.store_info
      } : undefined,
      sub_orders: params.sub_orders.map((order) => ({
        mchid: order.mchid,
        attach: order.attach,
        out_trade_no: order.out_trade_no,
        description: order.description,
      amount: {
          total_amount: this.formatAmount(order.amount.total_amount),
          currency: order.amount.currency || 'CNY'
        },
        detail: order.detail,
        goods_tag: order.goods_tag,
        settle_info: order.settle_info
      }))
    });

    const result = await this.client.request<CreateCombineNativePaymentAPIResponse>(
      'POST',
      '/v3/combine-transactions/native',
      data
    );

    return {
      code_url: result.code_url,
      combine_out_trade_no: params.combine_out_trade_no
    };
  }
}
