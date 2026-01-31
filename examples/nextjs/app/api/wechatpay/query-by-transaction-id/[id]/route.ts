import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../../lib/wechatpay';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transaction_id } = await params;

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'Missing transaction_id' },
        { status: 400 }
      );
    }

    const wechatPay = getWeChatPayClient();
    const order = await wechatPay.native.queryByTransactionId({
      transaction_id,
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
