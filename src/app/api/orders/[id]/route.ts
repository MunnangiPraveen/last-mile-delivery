import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { name: true, email: true }
        },
        pickupZone: true,
        dropZone: true,
        assignments: {
          where: { isActive: true },
          include: {
            agent: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        trackingHistory: {
          include: {
            actor: {
              select: { name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        reschedules: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Role-based visibility check
    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'AGENT') {
      const isAssigned = order.assignments.some(a => a.agentId === user.userId);
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('GET order details error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
