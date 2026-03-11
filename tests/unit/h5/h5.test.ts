import { describe, it, expect, beforeEach, vi } from 'vitest';
import { H5Payment } from '../../../src/h5/h5';

describe('H5Payment', () => {
  let h5Payment: H5Payment;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getAppId: () => 'test_app_id',
      getMerchantId: () => 'test_mch_id',
      getNotifyUrl: () => 'https://example.com/webhook',
      request: vi.fn()
    };

    h5Payment = new H5Payment(mockClient, {});
  });

  it('h5_info 缺失时应抛出错误', async () => {
    await expect(h5Payment.create({
      out_trade_no: 'order123',
      description: '测试支付',
      amount: 1.00
    } as any)).rejects.toThrow('h5_info is required');
  });

  it('应正确创建 H5 支付订单', async () => {
    mockClient.request.mockResolvedValue({ h5_url: 'https://wx.tenpay.com/xxx' });

    const result = await h5Payment.create({
      out_trade_no: 'order123',
      description: '测试支付',
      amount_cents: 9900,
      payer_client_ip: '1.2.3.4',
      h5_info: {
        type: 'Wap',
        app_name: '测试应用',
        app_url: 'https://example.com'
      }
    });

    expect(result.h5_url).toContain('tenpay');
    expect(result.out_trade_no).toBe('order123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/pay/transactions/h5',
      expect.objectContaining({
        scene_info: expect.objectContaining({
          h5_info: expect.objectContaining({
            type: 'Wap'
          })
        }),
        amount: expect.objectContaining({
          total: 9900
        })
      })
    );
  });

  it('应正确创建 H5 合单支付订单', async () => {
    mockClient.request.mockResolvedValue({ h5_url: 'https://wx.tenpay.com/combine' });

    const result = await h5Payment.createCombine({
      combine_out_trade_no: 'combine_123',
      notify_url: 'https://example.com/combine',
      payer_client_ip: '1.2.3.4',
      h5_info: {
        type: 'Wap',
        app_name: '测试应用',
        app_url: 'https://example.com'
      },
      sub_orders: [
        {
          mchid: 'sub_mch_id',
          out_trade_no: 'sub_order_1',
          description: '子单商品',
          attach: 'attach_data',
          amount: {
            total_amount_cents: 1001
          }
        }
      ]
    });

    expect(result.h5_url).toContain('tenpay');
    expect(result.combine_out_trade_no).toBe('combine_123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/combine-transactions/h5',
      expect.objectContaining({
        scene_info: expect.objectContaining({
          h5_info: expect.objectContaining({
            type: 'Wap'
          })
        }),
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
});
