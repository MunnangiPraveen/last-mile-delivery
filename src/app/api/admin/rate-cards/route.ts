import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const rateCards = await prisma.rateCard.findMany({
      orderBy: [
        { orderType: 'asc' },
        { zoneType: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, data: rateCards });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderType, zoneType, ratePerKg, minCharge, isActive } = body;

    if (!orderType || !zoneType || ratePerKg === undefined) {
      return NextResponse.json({ success: false, error: 'orderType, zoneType and ratePerKg are required' }, { status: 400 });
    }

    const rateCard = await prisma.rateCard.upsert({
      where: {
        orderType_zoneType: {
          orderType,
          zoneType
        }
      },
      update: {
        ratePerKg: parseFloat(ratePerKg),
        minCharge: minCharge !== undefined ? parseFloat(minCharge) : 0,
        isActive: isActive !== undefined ? !!isActive : true
      },
      create: {
        orderType,
        zoneType,
        ratePerKg: parseFloat(ratePerKg),
        minCharge: minCharge !== undefined ? parseFloat(minCharge) : 0,
        isActive: isActive !== undefined ? !!isActive : true
      }
    });

    return NextResponse.json({ success: true, data: rateCard });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
