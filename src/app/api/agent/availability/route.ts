import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { availability } = body;

    if (!availability || !['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
      return NextResponse.json({ success: false, error: 'Invalid availability status' }, { status: 400 });
    }

    const profile = await prisma.agentProfile.update({
      where: { userId: user.userId },
      data: { availability }
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
