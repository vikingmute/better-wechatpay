import { getWeChatPayClient } from '../../../utils/wechatpay';

export default defineEventHandler(async (event) => {
  try {
    const out_trade_no = getRouterParam(event, 'id');

    if (!out_trade_no) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing out_trade_no',
      });
    }

    const wechatPay = getWeChatPayClient();
    await wechatPay.native.close(out_trade_no);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to close order:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to close order',
    });
  }
});
