import { NextRequest, NextResponse } from 'next/server';
import { getWeChatPayClient } from '../../../../../lib/wechatpay';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bill_date = searchParams.get('bill_date');
    const bill_type = searchParams.get('bill_type') as 'ALL' | 'SUCCESS' | 'REFUND' | undefined;

    if (!bill_date) {
      return NextResponse.json(
        { error: 'Missing bill_date' },
        { status: 400 }
      );
    }

    const wechatPay = getWeChatPayClient();
    const result = await wechatPay.native.applyTradeBill({
      bill_date,
      bill_type,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Failed to get trade bill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get trade bill' },
      { status: 500 }
    );
  }
}
