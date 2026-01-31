import { getWeChatPayClient } from '../../../utils/wechatpay';

export default defineEventHandler(async (event) => {
  try {
    const transaction_id = getRouterParam(event, 'id');

    if (!transaction_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing transaction_id',
      });
    }

    const wechatPay = getWeChatPayClient();
    const order = await wechatPay.native.queryByTransactionId({
      transaction_id,
    });

    return {
      success: true,
      ...order,
    };
  } catch (error: any) {
    console.error('Failed to query order:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to query order',
    });
  }
});
