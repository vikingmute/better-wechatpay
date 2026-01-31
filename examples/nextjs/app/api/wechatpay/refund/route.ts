import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../lib/wechatpay';

function generateRefundNo(): string {
  return `refund_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { out_trade_no, amount, reason } = body;

    if (!out_trade_no || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: out_trade_no, amount' },
        { status: 400 }
      );
    }

    const out_refund_no = generateRefundNo();
    const wechatPay = getWeChatPayClient();
    
    const result = await wechatPay.native.refund({
      out_trade_no,
      out_refund_no,
      refund: amount,
      total: amount,
      reason: reason || undefined,
    });

    return NextResponse.json({
      success: true,
      out_refund_no: result.out_refund_no,
      refund_id: result.refund_id,
      status: result.status,
    });
  } catch (error: any) {
    console.error('Failed to create refund:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create refund' },
      { status: 500 }
    );
  }
}
