import { getWeChatPayClient } from '../../utils/wechatpay';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { out_trade_no, amount, reason } = body;

    if (!out_trade_no || typeof amount !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: out_trade_no, amount',
      });
    }

    const wechatPay = getWeChatPayClient();
    
    // Generate refund number
    const out_refund_no = `refund_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const result = await wechatPay.native.refund({
      out_trade_no,
      out_refund_no,
      refund: amount,
      total: amount,
      reason: reason || undefined,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('Failed to create refund:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create refund',
    });
  }
});
