import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateOrderStatus } from '@/services/tracking';
import { releaseAgent } from '@/services/agentAssignment';
import { notifyOrderEvent } from '@/services/notification';
import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Retrieve order to check assignment if agent
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { isActive: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Auth and Role check
    if (user.role === 'AGENT') {
      const isAssigned = order.assignments.some(a => a.agentId === user.userId);
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: 'Forbidden: You are not assigned to this order' }, { status: 403 });
      }
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Update status (validates transition inside)
    const { order: updatedOrder } = await updateOrderStatus(
      id,
      status as OrderStatus,
      user.userId,
      user.role,
      note
    );

    // Release agent if completed or failed
    if (status === 'DELIVERED' || status === 'FAILED') {
      await releaseAgent(id);
    }

    // Create notifications for the customer
    let notifType = status;
    // Map status string to NotificationType
    if (status === 'PICKED_UP') notifType = 'PICKED_UP';
    else if (status === 'IN_TRANSIT') notifType = 'IN_TRANSIT';
    else if (status === 'OUT_FOR_DELIVERY') notifType = 'OUT_FOR_DELIVERY';
    else if (status === 'DELIVERED') notifType = 'DELIVERED';
    else if (status === 'FAILED') notifType = 'FAILED';

    await notifyOrderEvent(id, order.customerId, notifType, status, order.trackingNumber);

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error('POST status error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
