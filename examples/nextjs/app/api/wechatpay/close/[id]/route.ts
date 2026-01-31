import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../../lib/wechatpay';

export async function POST(
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
    await wechatPay.native.close(out_trade_no);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to close order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to close order' },
      { status: 500 }
    );
  }
}
