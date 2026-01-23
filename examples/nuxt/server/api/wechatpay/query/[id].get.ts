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

    const mchid = getQuery(event).mchid as string | undefined;

    const wechatPay = getWeChatPayClient();
    const order = await wechatPay.native.query({
      out_trade_no,
      mchid,
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
