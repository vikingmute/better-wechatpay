import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../lib/wechatpay';
import QRCode from 'qrcode';

function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description } = body;

    if (!description || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: description, amount' },
        { status: 400 }
      );
    }

    const out_trade_no = generateOrderId();
    const wechatPay = getWeChatPayClient();
    const payment = await wechatPay.native.create({
      out_trade_no,
      description,
      amount,
    });

    // Generate QR code as base64
    const qrCode = await QRCode.toDataURL(payment.code_url);

    return NextResponse.json({
      success: true,
      code_url: payment.code_url,
      out_trade_no: payment.out_trade_no,
      qrCode,
    });
  } catch (error: any) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
