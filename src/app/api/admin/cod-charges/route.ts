import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const codCharges = await prisma.codCharge.findMany({
      orderBy: { orderType: 'asc' }
    });

    return NextResponse.json({ success: true, data: codCharges });
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
    const { orderType, surcharge, isActive } = body;

    if (!orderType || surcharge === undefined) {
      return NextResponse.json({ success: false, error: 'orderType and surcharge are required' }, { status: 400 });
    }

    const codCharge = await prisma.codCharge.upsert({
      where: {
        orderType
      },
      update: {
        surcharge: parseFloat(surcharge),
        isActive: isActive !== undefined ? !!isActive : true
      },
      create: {
        orderType,
        surcharge: parseFloat(surcharge),
        isActive: isActive !== undefined ? !!isActive : true
      }
    });

    return NextResponse.json({ success: true, data: codCharge });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
