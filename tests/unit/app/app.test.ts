import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppPayment } from '../../../src/app/app';

describe('AppPayment', () => {
  let appPayment: AppPayment;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getAppId: () => 'test_app_id',
      getMerchantId: () => 'test_mch_id',
      getNotifyUrl: () => 'https://example.com/webhook',
      request: vi.fn()
    };

    appPayment = new AppPayment(mockClient, {});
  });

  it('应正确创建 APP 支付订单', async () => {
    mockClient.request.mockResolvedValue({ prepay_id: 'prepay123' });

    const result = await appPayment.create({
      out_trade_no: 'order123',
      description: '测试支付',
      amount_fen: 9900,
      payer_client_ip: '1.2.3.4'
    });

    expect(result.prepay_id).toBe('prepay123');
    expect(result.out_trade_no).toBe('order123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/pay/transactions/app',
      expect.objectContaining({
        amount: expect.objectContaining({
          total: 9900
        })
      })
    );
  });

  it('应正确创建 APP 合单支付订单', async () => {
    mockClient.request.mockResolvedValue({ prepay_id: 'prepay_combine' });

    const result = await appPayment.createCombine({
      combine_out_trade_no: 'combine_123',
      notify_url: 'https://example.com/combine',
      payer_client_ip: '1.2.3.4',
      sub_orders: [
        {
          mchid: 'sub_mch_id',
          out_trade_no: 'sub_order_1',
          description: '子单商品',
          attach: 'attach_data',
          amount: {
            total_amount_fen: 1001
          }
        }
      ]
    });

    expect(result.prepay_id).toBe('prepay_combine');
    expect(result.combine_out_trade_no).toBe('combine_123');
    expect(mockClient.request).toHaveBeenCalledWith(
      'POST',
      '/v3/combine-transactions/app',
      expect.objectContaining({
        combine_out_trade_no: 'combine_123',
        notify_url: 'https://example.com/combine',
        scene_info: expect.objectContaining({
          payer_client_ip: '1.2.3.4'
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
