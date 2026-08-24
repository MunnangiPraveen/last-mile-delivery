import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTrackingRecord } from '@/services/tracking';
import { notifyOrderEvent } from '@/services/notification';

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
    const { newDate, reason } = body;

    if (!newDate) {
      return NextResponse.json({ success: false, error: 'New delivery date is required' }, { status: 400 });
    }

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

    // Auth check
    if (user.role === 'CUSTOMER' && order.customerId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Verify order is FAILED
    if (order.status !== 'FAILED') {
      return NextResponse.json({ success: false, error: 'Only failed deliveries can be rescheduled' }, { status: 400 });
    }

    // Perform reschedule updates in transaction
    const dateParsed = new Date(newDate);
    if (isNaN(dateParsed.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 });
    }

    await prisma.$transaction([
      // Create reschedule attempt record
      prisma.reschedule.create({
        data: {
          orderId: id,
          previousAttemptDate: order.updatedAt,
          newDate: dateParsed,
          requestedById: user.userId,
          reason: reason || 'Customer requested rescheduling'
        }
      }),
      // Set order status back to CREATED
      prisma.order.update({
        where: { id },
        data: {
          status: 'CREATED'
        }
      }),
      // Deactivate current active assignments so a new agent can be assigned
      prisma.agentAssignment.updateMany({
        where: { orderId: id, isActive: true },
        data: { isActive: false }
      }),
      // Create tracking history
      prisma.trackingHistory.create({
        data: {
          orderId: id,
          previousStatus: 'FAILED',
          newStatus: 'CREATED',
          actorId: user.userId,
          note: `Rescheduled for ${dateParsed.toLocaleDateString()}. Reason: ${reason || 'Not specified'}`
        }
      })
    ]);

    // Send notifications
    await notifyOrderEvent(id, order.customerId, 'RESCHEDULED', 'Rescheduled', order.trackingNumber);

    return NextResponse.json({ success: true, message: 'Order rescheduled successfully' });
  } catch (error: any) {
    console.error('POST reschedule error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
