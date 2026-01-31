import { getWeChatPayClient } from '../../utils/wechatpay';

export default defineEventHandler(async (event) => {
  try {
    const body = await readRawBody(event, 'utf-8');
    const wechatPay = getWeChatPayClient();

    const result = await wechatPay.webhook.verify({
      headers: getHeaders(event) as any,
      body: body || '',
    });

    if (!result.success) {
      console.error('Webhook signature verification failed');
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid signature',
      });
    }

    console.log('Webhook verified:', result.eventType);
    console.log('Decrypted data:', result.decryptedData);

    return 'OK';
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Webhook processing failed',
    });
  }
});
