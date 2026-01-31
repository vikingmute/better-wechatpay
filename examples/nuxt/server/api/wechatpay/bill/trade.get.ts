import { getWeChatPayClient } from '../../../utils/wechatpay';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const bill_date = query.bill_date as string;
    const bill_type = (query.bill_type as string) || 'ALL';

    if (!bill_date) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing bill_date',
      });
    }

    const wechatPay = getWeChatPayClient();
    const result = await wechatPay.native.applyTradeBill({
      bill_date,
      bill_type: bill_type as any,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('Failed to get trade bill:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get trade bill',
    });
  }
});
