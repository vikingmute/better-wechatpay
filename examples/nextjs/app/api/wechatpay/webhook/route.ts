import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../lib/wechatpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const wechatPay = getWeChatPayClient();

    const result = await wechatPay.webhook.verify({
      headers: Object.fromEntries(request.headers.entries()) as any,
      body,
    });

    if (!result.success) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Webhook verified:', result.eventType);
    console.log('Decrypted data:', result.decryptedData);

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
