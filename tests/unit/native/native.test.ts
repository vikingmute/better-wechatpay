import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativePayment } from '../../../src/native/native';
import type { WeChatPayConfig } from '../../../src/types';
import { createMockConfig } from '../../utils/test-helpers';

describe('NativePayment', () => {
  let nativePayment: NativePayment;
  let mockClient: any;
  let config: WeChatPayConfig;

  beforeEach(() => {
    config = createMockConfig();
    mockClient = {
      getAppId: () => 'test_app_id',
      getMerchantId: () => 'test_mch_id',
      getNotifyUrl: () => 'https://example.com/webhook',
      request: vi.fn()
    };

    nativePayment = new NativePayment(mockClient, {});
  });

  describe('create', () => {
    it('应正确创建 Native 支付订单', async () => {
      mockClient.request.mockResolvedValue({ code_url: 'weixin://wxpay/bizpayurl?pr=test' });

      const result = await nativePayment.create({
        out_trade_no: 'order123',
        description: '测试支付',
        amount_fen: 9900,
        payer_client_ip: '1.2.3.4'
      });

      expect(result.code_url).toBe('weixin://wxpay/bizpayurl?pr=test');
      expect(result.out_trade_no).toBe('order123');
      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/pay/transactions/native',
        expect.objectContaining({
          amount: expect.objectContaining({
            total: 9900
          })
        })
      );
    });

    it('应正确转换金额（元转分）', async () => {
      mockClient.request.mockResolvedValue({ code_url: 'weixin://test' });

      await nativePayment.create({
        out_trade_no: 'order123',
        description: '测试',
        amount: 99.99
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/pay/transactions/native',
        expect.objectContaining({
          amount: expect.objectContaining({
            total: 9999
          })
        })
      );
    });

    it('应正确包含可选参数', async () => {
      mockClient.request.mockResolvedValue({ code_url: 'weixin://test' });

      await nativePayment.create({
        out_trade_no: 'order123',
        description: '测试',
        amount: 100,
        attach: 'custom_data',
        goods_tag: 'discount',
        support_fapiao: true,
        time_expire: '2024-12-31T23:59:59+08:00'
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/pay/transactions/native',
        expect.objectContaining({
          attach: 'custom_data',
          goods_tag: 'discount',
          support_fapiao: true,
          time_expire: '2024-12-31T23:59:59+08:00'
        })
      );
    });


    it('应优先使用 amount_fen（分）并跳过元转换', async () => {
      mockClient.request.mockResolvedValue({ code_url: 'weixin://test' });

      await nativePayment.create({
        out_trade_no: 'order123',
        description: '测试',
        amount_fen: 1001,
        amount: 10.01
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/pay/transactions/native',
        expect.objectContaining({
          amount: expect.objectContaining({
            total: 1001
          })
        })
      );
    });

    it('amount_fen 非整数时应抛出错误', async () => {
      await expect(nativePayment.create({
        out_trade_no: 'order123',
        description: '测试',
        amount_fen: 10.5
      } as any)).rejects.toThrow('amount_fen must be a non-negative integer in fen');
    });

    it('应正确处理 detail 和 scene_info', async () => {
      mockClient.request.mockResolvedValue({ code_url: 'weixin://test' });

      await nativePayment.create({
        out_trade_no: 'order123',
        description: '测试',
        amount: 100,
        detail: {
          cost_price: 80,
          invoice_id: 'INV123',
          goods_detail: [
            {
              merchant_goods_id: 'GOODS001',
              goods_name: '商品1',
              quantity: 1,
              unit_price: 10000
            }
          ]
        },
        scene_info: {
          payer_client_ip: '1.2.3.4',
          device_id: 'DEVICE001',
          store_info: {
            id: 'STORE001',
            name: '测试门店'
          }
        }
      });

      const callArgs = mockClient.request.mock.calls[0][2];
      expect(callArgs.detail).toBeDefined();
      expect(callArgs.scene_info).toBeDefined();
      expect(callArgs.scene_info.store_info.id).toBe('STORE001');
    });
  });

  describe('query', () => {
    it('应正确查询订单', async () => {
      mockClient.request.mockResolvedValue({
        transaction_id: 'wx123',
        out_trade_no: 'order123',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        success_time: '2024-01-01T00:00:00+08:00',
        amount: {
          total: 100,
          currency: 'CNY'
        }
      });

      const result = await nativePayment.query({ out_trade_no: 'order123' });

      expect(result.transaction_id).toBe('wx123');
      expect(result.trade_state).toBe('SUCCESS');
      expect(mockClient.request).toHaveBeenCalledWith(
        'GET',
        '/v3/pay/transactions/out-trade-no/order123?mchid=test_mch_id'
      );
    });
  });

  describe('queryByTransactionId', () => {
    it('应正确通过微信订单号查询订单', async () => {
      mockClient.request.mockResolvedValue({
        transaction_id: 'wx123',
        out_trade_no: 'order123',
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        amount: {
          total: 100,
          currency: 'CNY'
        }
      });

      const result = await nativePayment.queryByTransactionId({ transaction_id: 'wx123' });

      expect(result.transaction_id).toBe('wx123');
      expect(mockClient.request).toHaveBeenCalledWith(
        'GET',
        '/v3/pay/transactions/id/wx123?mchid=test_mch_id'
      );
    });
  });

  describe('close', () => {
    it('应正确关闭订单', async () => {
      mockClient.request.mockResolvedValue({});

      await nativePayment.close('order123');

      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/pay/transactions/out-trade-no/order123/close',
        { mchid: 'test_mch_id' }
      );
    });
  });

  describe('refund', () => {
    it('应正确申请退款', async () => {
      mockClient.request.mockResolvedValue({
        refund_id: 'refund123',
        out_refund_no: 'refund_order123',
        transaction_id: 'txn123',
        out_trade_no: 'order123',
        channel: 'ORIGINAL',
        user_received_account: '用户零钱',
        create_time: '2025-01-01T00:00:00+08:00',
        status: 'SUCCESS',
        funds_account: 'AVAILABLE',
        amount: {
          total: 100,
          refund: 100,
          payer_total: 100,
          payer_refund: 100,
          settlement_refund: 100,
          settlement_total: 100,
          discount_refund: 0,
          currency: 'CNY'
        }
      });

      const result = await nativePayment.refund({
        out_trade_no: 'order123',
        out_refund_no: 'refund_order123',
        refund_fen: 100,
        total_fen: 100
      });

      expect(result.refund_id).toBe('refund123');
      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/refund/domestic/refunds',
        expect.objectContaining({
          out_refund_no: 'refund_order123',
          amount: expect.objectContaining({
            refund: 100,
            total: 100
          })
        })
      );
    });


    it('refund_fen 非整数时应抛出错误', async () => {
      await expect(nativePayment.refund({
        out_trade_no: 'order123',
        out_refund_no: 'refund_order123',
        refund_fen: 10.5,
        total_fen: 100
      } as any)).rejects.toThrow('refund_fen must be a non-negative integer in fen');
    });

    it('应正确处理退款原因', async () => {
      mockClient.request.mockResolvedValue({
        refund_id: 'refund123',
        out_refund_no: 'refund_order123',
        transaction_id: 'txn123',
        out_trade_no: 'order123',
        channel: 'ORIGINAL',
        user_received_account: '用户零钱',
        create_time: '2025-01-01T00:00:00+08:00',
        status: 'SUCCESS',
        funds_account: 'AVAILABLE',
        amount: {
          total: 100,
          refund: 100,
          payer_total: 100,
          payer_refund: 100,
          settlement_refund: 100,
          settlement_total: 100,
          discount_refund: 0,
          currency: 'CNY'
        }
      });

      await nativePayment.refund({
        out_trade_no: 'order123',
        out_refund_no: 'refund_order123',
        reason: '客户申请退款',
        refund: 1.00,
        total: 1.00
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/refund/domestic/refunds',
        expect.objectContaining({
          reason: '客户申请退款'
        })
      );
    });
  });

  describe('queryRefund', () => {
    it('应正确查询退款', async () => {
      mockClient.request.mockResolvedValue({
        refund_id: 'refund123',
        out_refund_no: 'refund_order123',
        transaction_id: 'txn123',
        out_trade_no: 'order123',
        channel: 'ORIGINAL',
        user_received_account: '用户零钱',
        create_time: '2025-01-01T00:00:00+08:00',
        status: 'SUCCESS',
        funds_account: 'AVAILABLE',
        amount: {
          total: 100,
          refund: 100,
          payer_total: 100,
          payer_refund: 100,
          settlement_refund: 100,
          settlement_total: 100,
          discount_refund: 0,
          currency: 'CNY'
        }
      });

      const result = await nativePayment.queryRefund({ out_refund_no: 'refund_order123' });

      expect(result.refund_id).toBe('refund123');
      expect(mockClient.request).toHaveBeenCalledWith(
        'GET',
        '/v3/refund/domestic/refunds/refund_order123'
      );
    });
  });

  describe('applyTradeBill', () => {
    it('应正确申请交易账单', async () => {
      mockClient.request.mockResolvedValue({
        hash_type: 'SHA1',
        hash_value: 'abc123',
        download_url: 'https://api.mch.weixin.qq.com/v3/bill/download/xxx'
      });

      const result = await nativePayment.applyTradeBill({
        bill_date: '2025-01-01',
        bill_type: 'ALL'
      });

      expect(result.download_url).toContain('download');
      expect(mockClient.request).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('/v3/bill/tradebill?bill_date=2025-01-01')
      );
    });
  });

  describe('applyFundFlowBill', () => {
    it('应正确申请资金账单', async () => {
      mockClient.request.mockResolvedValue({
        hash_type: 'SHA1',
        hash_value: 'testhash456',
        download_url: 'https://api.mch.weixin.qq.com/v3/billdownload/file'
      });

      const result = await nativePayment.applyFundFlowBill({
        bill_date: '2024-01-01',
        account_type: 'BASIC'
      });

      expect(result.hash_type).toBe('SHA1');
      expect(result.download_url).toContain('billdownload');
    });
  });

  describe('queryCombineOrder', () => {
    it('应正确查询合单订单', async () => {
      mockClient.request.mockResolvedValue({
        combine_appid: 'test_app_id',
        combine_mchid: 'test_mch_id',
        combine_out_trade_no: 'combine123',
        sub_orders: [
          {
            mchid: 'test_mch_id',
            trade_type: 'NATIVE',
            trade_state: 'SUCCESS',
            transaction_id: 'wx123',
            out_trade_no: 'order123',
            amount: {
              total_amount: 9900,
              currency: 'CNY'
            }
          }
        ]
      });

      const result = await nativePayment.queryCombineOrder({
        combine_out_trade_no: 'combine123'
      });

      expect(result.combine_out_trade_no).toBe('combine123');
      expect(result.sub_orders).toHaveLength(1);
      expect(result.sub_orders[0].trade_state).toBe('SUCCESS');
      expect(mockClient.request).toHaveBeenCalledWith(
        'GET',
        '/v3/combine-transactions/out-trade-no/combine123'
      );
    });
  });

  describe('closeCombineOrder', () => {
    it('应正确关闭合单订单', async () => {
      mockClient.request.mockResolvedValue({});

      await nativePayment.closeCombineOrder({
        combine_out_trade_no: 'combine123',
        sub_orders: [
          { mchid: 'test_mch_id', out_trade_no: 'order123' }
        ]
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        'POST',
        '/v3/combine-transactions/out-trade-no/combine123/close',
        expect.objectContaining({
          combine_appid: 'test_app_id',
          sub_orders: [
            { mchid: 'test_mch_id', out_trade_no: 'order123' }
          ]
        })
      );
    });
  });
});
