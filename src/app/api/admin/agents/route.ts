import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        agentProfile: {
          select: {
            availability: true,
            currentWorkload: true,
            phone: true,
            zone: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: agents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
