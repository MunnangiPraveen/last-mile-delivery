import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const areas = await prisma.area.findMany({
      include: {
        zone: true
      },
      orderBy: { pincode: 'asc' }
    });

    return NextResponse.json({ success: true, data: areas });
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
    const { name, pincode, zoneId } = body;

    if (!name || !pincode || !zoneId) {
      return NextResponse.json({ success: false, error: 'Name, pincode and zoneId are required' }, { status: 400 });
    }

    // Check if pincode already exists
    const existing = await prisma.area.findUnique({
      where: { pincode }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Pincode already mapped to a zone' }, { status: 400 });
    }

    const area = await prisma.area.create({
      data: {
        name,
        pincode,
        zoneId
      }
    });

    return NextResponse.json({ success: true, data: area });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
