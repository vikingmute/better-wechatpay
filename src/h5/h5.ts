import type { HttpClient } from '../core/client.js';
import type {
  CreateH5PaymentParams,
  CreateH5PaymentResult,
  CreateH5PaymentAPIResponse,
  CreateCombineH5PaymentParams,
  CreateCombineH5PaymentResult,
  CreateCombineH5PaymentAPIResponse
} from '../types/index.js';
import { BasePayment } from '../core/base-payment.js';
import { logger } from '../core/debug.js';

/**
 * H5支付
 * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791832
 */
export class H5Payment extends BasePayment {
  constructor(client: HttpClient, instance: object) {
    super(client, instance);
  }

  /**
   * H5下单
   * 商户系统先调用该接口在微信支付服务后台生成预支付交易单，返回用于调起支付的H5支付链接（h5_url）。
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012791834
   */
  async create(params: CreateH5PaymentParams): Promise<CreateH5PaymentResult> {
    logger.log(this.instance, 'Creating H5 payment:', params);

    // H5支付必须提供 h5_info
    const h5Info = params.h5_info || params.scene_info?.h5_info;
    if (!h5Info) {
      throw new Error('h5_info is required for H5 payment');
    }

    if (!h5Info.type) {
      throw new Error('h5_info.type is required (Wap, iOS, or Android)');
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
        store_info: params.scene_info?.store_info,
        h5_info: {
          type: h5Info.type,
          app_name: h5Info.app_name,
          app_url: h5Info.app_url,
          bundle_id: h5Info.bundle_id,
          package_name: h5Info.package_name
      }
      },
      settle_info: params.settle_info
    });

    const result = await this.client.request<CreateH5PaymentAPIResponse>(
      'POST',
      '/v3/pay/transactions/h5',
      data
    );

    return {
      h5_url: result.h5_url,
      out_trade_no: params.out_trade_no
    };
  }

  /**
   * H5合单下单
   * @see https://pay.weixin.qq.com/doc/v3/merchant/4012556961
   */
  async createCombine(params: CreateCombineH5PaymentParams): Promise<CreateCombineH5PaymentResult> {
    logger.log(this.instance, 'Creating H5 combine payment:', params);

    const h5Info = params.h5_info || params.scene_info?.h5_info;
    if (!h5Info) {
      throw new Error('h5_info is required for H5 combine payment');
    }

    if (!h5Info.type) {
      throw new Error('h5_info.type is required (Wap, iOS, or Android)');
    }

    const data = this.removeUndefined({
      combine_appid: this.client.getAppId(),
      combine_mchid: this.client.getMerchantId(),
      combine_out_trade_no: params.combine_out_trade_no,
      time_expire: params.time_expire,
      notify_url: params.notify_url || this.client.getNotifyUrl(),
      scene_info: {
        payer_client_ip: params.payer_client_ip || params.scene_info?.payer_client_ip || '127.0.0.1',
        device_id: params.scene_info?.device_id,
        store_info: params.scene_info?.store_info,
        h5_info: {
          type: h5Info.type,
          app_name: h5Info.app_name,
          app_url: h5Info.app_url,
          bundle_id: h5Info.bundle_id,
          package_name: h5Info.package_name
        }
      },
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

    const result = await this.client.request<CreateCombineH5PaymentAPIResponse>(
      'POST',
      '/v3/combine-transactions/h5',
      data
    );

    return {
      h5_url: result.h5_url,
      combine_out_trade_no: params.combine_out_trade_no
    };
  }
}
