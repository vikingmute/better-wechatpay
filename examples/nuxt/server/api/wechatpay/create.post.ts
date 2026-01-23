import { getWeChatPayClient } from '../../utils/wechatpay';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { out_trade_no, description, amount, currency, payer_client_ip } = body;

    if (!out_trade_no || !description || typeof amount !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: out_trade_no, description, amount',
      });
    }

    const wechatPay = getWeChatPayClient();
    const payment = await wechatPay.native.create({
      out_trade_no,
      description,
      amount,
      currency,
      payer_client_ip,
    });

    return {
      success: true,
      code_url: payment.code_url,
      out_trade_no: payment.out_trade_no,
    };
  } catch (error: any) {
    console.error('Failed to create payment:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create payment',
    });
  }
});
