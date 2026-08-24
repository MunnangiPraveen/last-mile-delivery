import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const zones = await prisma.zone.findMany({
      include: {
        areas: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: zones });
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
    const { name, description, isDefault } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Zone name is required' }, { status: 400 });
    }

    if (isDefault) {
      // Unset other defaults
      await prisma.zone.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        description,
        isDefault: !!isDefault
      }
    });

    return NextResponse.json({ success: true, data: zone });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
