import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { manualAssign } from '@/services/agentAssignment';
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
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ success: false, error: 'Agent ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Perform assignment
    await manualAssign(id, agentId, user.userId);

    // Create tracking record
    await createTrackingRecord(id, order.status, order.status, user.userId, `Agent assigned manually`);

    // Create notification
    await notifyOrderEvent(id, order.customerId, 'AGENT_ASSIGNED', order.status, order.trackingNumber);

    return NextResponse.json({ success: true, message: 'Agent assigned successfully' });
  } catch (error: any) {
    console.error('Manual assign error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
