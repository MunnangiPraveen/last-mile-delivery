import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { autoAssign } from '@/services/agentAssignment';
import { prisma } from '@/lib/prisma';
import { createTrackingRecord } from '@/services/tracking';
import { notifyOrderEvent } from '@/services/notification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Perform auto assignment
    await autoAssign(id, user.userId);

    // Create tracking record
    await createTrackingRecord(id, order.status, order.status, user.userId, `Agent assigned automatically`);

    // Create notification
    await notifyOrderEvent(id, order.customerId, 'AGENT_ASSIGNED', order.status, order.trackingNumber);

    return NextResponse.json({ success: true, message: 'Agent assigned automatically successfully' });
  } catch (error: any) {
    console.error('Auto assign error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
