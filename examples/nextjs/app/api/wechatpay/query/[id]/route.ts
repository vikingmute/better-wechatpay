import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../../lib/wechatpay';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: out_trade_no } = await params;

    if (!out_trade_no) {
      return NextResponse.json(
        { error: 'Missing out_trade_no' },
        { status: 400 }
      );
    }

    const wechatPay = getWeChatPayClient();
    const order = await wechatPay.native.query({
      out_trade_no,
    });

    return NextResponse.json({
      success: true,
      ...order,
    });
  } catch (error: any) {
    console.error('Failed to query order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query order' },
      { status: 500 }
    );
  }
}
