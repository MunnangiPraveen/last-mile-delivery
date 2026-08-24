import { prisma } from '@/lib/prisma';
import type { NotificationType } from '@/types';

/**
 * Notification Service
 * Creates in-app notification records.
 * Email/SMS integration can be added via environment variables.
 */

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  orderId?: string
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      orderId: orderId || null,
    },
  });

  // Attempt external notification (email/SMS) if configured
  await sendExternalNotification(userId, title, message);

  return notification;
}

/**
 * Send external notification (email/SMS) if provider is configured
 * Gracefully skips if credentials are not available
 */
async function sendExternalNotification(
  userId: string,
  title: string,
  message: string
) {
  try {
    // Email notification
    if (process.env.EMAIL_PROVIDER_API_KEY) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user) {
        console.log(`[Notification] Email would be sent to ${user.email}: ${title}`);
        // Integration point: Add actual email provider here
      }
    }

    // SMS notification
    if (process.env.SMS_PROVIDER_API_KEY) {
      console.log(`[Notification] SMS would be sent for: ${title}`);
      // Integration point: Add actual SMS provider here
    }
  } catch {
    // Never let notification failures break the main flow
    console.log(`[Notification] External notification skipped: ${title} - ${message}`);
  }
}

/**
 * Create order event notification for customer
 */
export async function notifyOrderEvent(
  orderId: string,
  customerId: string,
  type: NotificationType,
  statusLabel: string,
  trackingNumber: string
) {
  const titles: Record<string, string> = {
    ORDER_CREATED: 'Order Created',
    AGENT_ASSIGNED: 'Agent Assigned',
    PICKED_UP: 'Package Picked Up',
    IN_TRANSIT: 'Package In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Package Delivered',
    FAILED: 'Delivery Failed',
    RESCHEDULED: 'Delivery Rescheduled',
  };

  const messages: Record<string, string> = {
    ORDER_CREATED: `Your order ${trackingNumber} has been created successfully.`,
    AGENT_ASSIGNED: `A delivery agent has been assigned to your order ${trackingNumber}.`,
    PICKED_UP: `Your package for order ${trackingNumber} has been picked up.`,
    IN_TRANSIT: `Your order ${trackingNumber} is now in transit.`,
    OUT_FOR_DELIVERY: `Your order ${trackingNumber} is out for delivery.`,
    DELIVERED: `Your order ${trackingNumber} has been delivered successfully.`,
    FAILED: `Delivery attempt for order ${trackingNumber} has failed. You can reschedule.`,
    RESCHEDULED: `Your order ${trackingNumber} has been rescheduled for a new delivery attempt.`,
  };

  return createNotification(
    customerId,
    titles[type] || statusLabel,
    messages[type] || `Order ${trackingNumber} status: ${statusLabel}`,
    type,
    orderId
  );
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
