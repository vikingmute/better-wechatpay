import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../lib/wechatpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { out_trade_no, description, amount, currency, payer_client_ip } = body;

    if (!out_trade_no || !description || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: out_trade_no, description, amount' },
        { status: 400 }
      );
    }

    const wechatPay = getWeChatPayClient();
    const payment = await wechatPay.native.create({
      out_trade_no,
      description,
      amount,
      currency,
      payer_client_ip,
    });

    return NextResponse.json({
      success: true,
      code_url: payment.code_url,
      out_trade_no: payment.out_trade_no,
    });
  } catch (error: any) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
