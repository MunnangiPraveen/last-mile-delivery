import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { calculateRate } from '@/services/rateCalculation';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pickupPincode,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType
    } = body;

    if (!pickupPincode || !dropPincode || !length || !breadth || !height || !actualWeight || !orderType || !paymentType) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    const calc = await calculateRate({
      pickupAddress: '',
      pickupPincode,
      dropAddress: '',
      dropPincode,
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType
    });

    return NextResponse.json({ success: true, data: calc });
  } catch (error: any) {
    console.error('Calculate rate error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
