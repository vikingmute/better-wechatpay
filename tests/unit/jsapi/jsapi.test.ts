import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSAPIPayment } from '../../../src/jsapi/jsapi';

describe('JSAPIPayment', () => {
  let jsapiPayment: JSAPIPayment;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getAppId: () => 'test_app_id',
      getMerchantId: () => 'test_mch_id',
      getNotifyUrl: () => 'https://example.com/webhook',
      request: vi.fn()
    };

    jsapiPayment = new JSAPIPayment(mockClient, {});
  });

  it('openid 缺失时应抛出错误', async () => {
    await expect(jsapiPayment.create({
      out_trade_no: 'order123',
      description: '测试支付',
      amount: 1.00
    } as any)).rejects.toThrow('openid is required');
  });

  it('应正确创建 JSAPI/小程序支付订单', async () => {
    mockClient.request.mockResolvedValue({ prepay_id: 'prepay123' });

    const result = await jsapiPayment.create({
      out_trade_no: 'order123',
      description: '测试支付',
      amount: 99.00,
      openid: 'openid123',
      payer_client_ip: '1.2.3.4'
    });

    expect(result.prepay_id).toBe('prepay123');
    expect(result.out_trade_no).toBe('order123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/pay/transactions/jsapi',
      expect.objectContaining({
        payer: { openid: 'openid123' },
        amount: expect.objectContaining({
          total: 9900
        })
      })
    );
  });

  it('应正确创建 JSAPI 合单支付订单', async () => {
    mockClient.request.mockResolvedValue({ prepay_id: 'prepay_combine' });

    const result = await jsapiPayment.createCombine({
      combine_out_trade_no: 'combine_123',
      notify_url: 'https://example.com/combine',
      openid: 'openid123',
      sub_orders: [
        {
          mchid: 'sub_mch_id',
          out_trade_no: 'sub_order_1',
          description: '子单商品',
          attach: 'attach_data',
          amount: {
            total_amount: 10.01
          }
        }
      ]
    });

    expect(result.prepay_id).toBe('prepay_combine');
    expect(result.combine_out_trade_no).toBe('combine_123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/combine-transactions/jsapi',
      expect.objectContaining({
        combine_payer_info: { openid: 'openid123' },
        sub_orders: [
          expect.objectContaining({
            amount: expect.objectContaining({
              total_amount: 1001
            })
          })
        ]
      })
    );
  });

  it('应正确创建小程序合单支付订单', async () => {
    mockClient.request.mockResolvedValue({ prepay_id: 'prepay_mini' });

    const result = await jsapiPayment.createCombineMiniProgram({
      combine_out_trade_no: 'combine_456',
      notify_url: 'https://example.com/combine',
      openid: 'openid456',
      sub_orders: [
        {
          mchid: 'sub_mch_id',
          out_trade_no: 'sub_order_2',
          description: '子单商品',
          attach: 'attach_data',
          amount: {
            total_amount: 1.23
          }
        }
      ]
    });

    expect(result.prepay_id).toBe('prepay_mini');
    expect(result.combine_out_trade_no).toBe('combine_456');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/combine-transactions/mini-program',
      expect.objectContaining({
        combine_payer_info: { openid: 'openid456' },
        sub_orders: [
          expect.objectContaining({
            amount: expect.objectContaining({
              total_amount: 123
            })
          })
        ]
      })
    );
  });
});
