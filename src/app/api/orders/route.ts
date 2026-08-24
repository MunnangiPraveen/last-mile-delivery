import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateRate } from '@/services/rateCalculation';
import { createTrackingRecord } from '@/services/tracking';
import { notifyOrderEvent } from '@/services/notification';

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const zone = searchParams.get('zone');
    const agentId = searchParams.get('agentId');
    const orderType = searchParams.get('orderType');
    const paymentType = searchParams.get('paymentType');
    const searchQuery = searchParams.get('search'); // tracking number

    // Build query conditions
    const where: any = {};

    // Role-based scoping
    if (user.role === 'CUSTOMER') {
      where.customerId = user.userId;
    } else if (user.role === 'AGENT') {
      // Find orders currently assigned to this agent
      where.assignments = {
        some: {
          agentId: user.userId,
          isActive: true
        }
      };
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Admin/Customer filtering
    if (status) {
      where.status = status;
    }
    if (zone) {
      where.OR = [
        { pickupZoneId: zone },
        { dropZoneId: zone }
      ];
    }
    if (agentId) {
      where.assignments = {
        some: {
          agentId: agentId,
          isActive: true
        }
      };
    }
    if (orderType) {
      where.orderType = orderType;
    }
    if (paymentType) {
      where.paymentType = paymentType;
    }
    if (searchQuery) {
      where.trackingNumber = {
        contains: searchQuery
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        }
      }
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('GET orders error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pickupAddress,
      pickupPincode,
      dropAddress,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
      customerId // Only used by ADMIN
    } = body;

    // Base validation
    if (!pickupAddress || !pickupPincode || !dropAddress || !dropPincode || !length || !breadth || !height || !actualWeight || !orderType || !paymentType) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    // Role-based target customer
    let targetCustomerId = user.userId;
    if (user.role === 'ADMIN') {
      if (!customerId) {
        return NextResponse.json({ success: false, error: 'customerId is required for admin order creation' }, { status: 400 });
      }
      targetCustomerId = customerId;
    } else if (user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Calculate rates
    const calc = await calculateRate({
      pickupAddress,
      pickupPincode,
      dropAddress,
      dropPincode,
      length: parseFloat(length),
      breadth: parseFloat(breadth),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType
    });

    const trackingNumber = `LMD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create the order
    const order = await prisma.order.create({
      data: {
        trackingNumber,
        customerId: targetCustomerId,
        status: 'CREATED',
        pickupAddress,
        pickupPincode,
        dropAddress,
        dropPincode,
        length: parseFloat(length),
        breadth: parseFloat(breadth),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        volumetricWeight: calc.volumetricWeight,
        billableWeight: calc.billableWeight,
        orderType,
        paymentType,
        pickupZoneId: calc.pickupZoneId,
        dropZoneId: calc.dropZoneId,
        rateType: calc.rateType,
        baseCharge: calc.baseCharge,
        codSurcharge: calc.codSurcharge,
        totalCharge: calc.totalCharge
      }
    });

    // Create initial tracking record
    await createTrackingRecord(order.id, null, 'CREATED', user.userId, 'Order created');

    // Create notification
    await notifyOrderEvent(order.id, targetCustomerId, 'ORDER_CREATED', 'Created', trackingNumber);

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('POST order error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
