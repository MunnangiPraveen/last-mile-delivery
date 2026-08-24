import { prisma } from '@/lib/prisma';
import type { OrderStatus } from '@/types';
import { VALID_STATUS_TRANSITIONS } from '@/types';

/**
 * Tracking Service - Creates immutable tracking records
 */

/**
 * Validate if a status transition is allowed
 * Admin can override any status
 */
export function isValidTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true; // Admin can override
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed?.includes(newStatus) ?? false;
}

/**
 * Create an immutable tracking history record
 */
export async function createTrackingRecord(
  orderId: string,
  previousStatus: string | null,
  newStatus: string,
  actorId: string,
  note?: string
) {
  return prisma.trackingHistory.create({
    data: {
      orderId,
      previousStatus,
      newStatus,
      actorId,
      note: note || null,
    },
  });
}

/**
 * Update order status with tracking
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorId: string,
  actorRole: string,
  note?: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const currentStatus = order.status as OrderStatus;
  const isAdmin = actorRole === 'ADMIN';

  if (!isValidTransition(currentStatus, newStatus, isAdmin)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }

  // Update order status and create tracking record in a transaction
  const [updatedOrder, trackingRecord] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    }),
    prisma.trackingHistory.create({
      data: {
        orderId,
        previousStatus: currentStatus,
        newStatus,
        actorId,
        note: note || null,
      },
    }),
  ]);

  return { order: updatedOrder, tracking: trackingRecord };
}

/**
 * Get full tracking history for an order
 */
export async function getTrackingHistory(orderId: string) {
  return prisma.trackingHistory.findMany({
    where: { orderId },
    include: {
      actor: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}
