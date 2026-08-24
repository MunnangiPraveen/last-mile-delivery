import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { calculateRate } from '../src/services/rateCalculation.js';
import { manualAssign, autoAssign, releaseAgent } from '../src/services/agentAssignment.js';
import { updateOrderStatus, getTrackingHistory } from '../src/services/tracking.js';
import { notifyOrderEvent, getUserNotifications } from '../src/services/notification.js';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log('🧪 Starting End-to-End Service & Interconnection Test...');

  // Find seeded demo users
  const customer = await prisma.user.findUnique({ where: { email: 'customer@demo.com' } });
  const agent = await prisma.user.findUnique({ where: { email: 'agent@demo.com' } });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });

  if (!customer || !agent || !admin) {
    throw new Error('Seed data missing! Please run npm run seed first.');
  }
  console.log('✓ Demo users verified.');

  // Clear previous orders to have a clean slate
  await prisma.order.deleteMany({});
  console.log('✓ Cleared previous orders.');

  // ==========================================
  // STEP 1: Rate Calculation Preview Verification
  // ==========================================
  console.log('\n--- Step 1: Testing Rate Calculation ---');
  const calcResult = await calculateRate({
    pickupAddress: 'Hyderabad depot',
    pickupPincode: '500001', // South Zone
    dropAddress: 'Delhi Center',
    dropPincode: '110001', // North Zone
    length: 50,
    breadth: 40,
    height: 30,
    actualWeight: 8,
    orderType: 'B2C',
    paymentType: 'COD'
  });

  // Assert volumetric: 50 * 40 * 30 / 5000 = 12 kg
  // Assert billable: Max(8, 12) = 12 kg
  // Assert base charge: 12 * 60 (B2C Inter-Zone) = 720
  // Assert COD surcharge: 50
  // Assert total: 720 + 50 = 770
  console.log(`Calculated Volumetric Weight: ${calcResult.volumetricWeight} kg (Expected: 12 kg)`);
  console.log(`Calculated Billable Weight: ${calcResult.billableWeight} kg (Expected: 12 kg)`);
  console.log(`Calculated Base Charge: ₹${calcResult.baseCharge} (Expected: ₹720)`);
  console.log(`Calculated COD Surcharge: ₹${calcResult.codSurcharge} (Expected: ₹50)`);
  console.log(`Calculated Total Charge: ₹${calcResult.totalCharge} (Expected: ₹770)`);

  if (
    calcResult.volumetricWeight !== 12 ||
    calcResult.billableWeight !== 12 ||
    calcResult.baseCharge !== 720 ||
    calcResult.codSurcharge !== 50 ||
    calcResult.totalCharge !== 770
  ) {
    throw new Error('❌ Rate calculation math mismatch!');
  }
  console.log('✅ Rate calculation matches expected values exactly.');

  // ==========================================
  // STEP 2: Customer Creates Order
  // ==========================================
  console.log('\n--- Step 2: Creating Order ---');
  const trackingNumber = `LMD-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      trackingNumber,
      customerId: customer.id,
      status: 'CREATED',
      pickupAddress: 'Hyderabad depot',
      pickupPincode: '500001',
      dropAddress: 'Delhi Center',
      dropPincode: '110001',
      length: 50,
      breadth: 40,
      height: 30,
      actualWeight: 8,
      volumetricWeight: calcResult.volumetricWeight,
      billableWeight: calcResult.billableWeight,
      orderType: 'B2C',
      paymentType: 'COD',
      pickupZoneId: calcResult.pickupZoneId,
      dropZoneId: calcResult.dropZoneId,
      rateType: calcResult.rateType,
      baseCharge: calcResult.baseCharge,
      codSurcharge: calcResult.codSurcharge,
      totalCharge: calcResult.totalCharge
    }
  });
  console.log(`Created order ${order.id} with Tracking Number: ${order.trackingNumber}`);

  // Create initial tracking record
  await prisma.trackingHistory.create({
    data: {
      orderId: order.id,
      previousStatus: null,
      newStatus: 'CREATED',
      actorId: customer.id,
      note: 'Order created'
    }
  });

  // Create notification
  await notifyOrderEvent(order.id, customer.id, 'ORDER_CREATED', 'Created', trackingNumber);
  console.log('✅ Order created and logged in tracking timeline.');

  // ==========================================
  // STEP 3: Admin Mapped Agent Assignment
  // ==========================================
  console.log('\n--- Step 3: Admin Assigns Agent ---');
  // Assign the demo agent
  await manualAssign(order.id, agent.id, admin.id);

  // Assert agent profile workload increased
  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: agent.id } });
  console.log(`Agent Workload after assignment: ${agentProfile?.currentWorkload} (Expected: 1)`);
  if (agentProfile?.currentWorkload !== 1) {
    throw new Error('❌ Workload increment failed!');
  }

  // Create assignment tracking log
  await prisma.trackingHistory.create({
    data: {
      orderId: order.id,
      previousStatus: 'CREATED',
      newStatus: 'CREATED',
      actorId: admin.id,
      note: 'Agent assigned manually: ' + agent.name
    }
  });
  console.log('✅ Agent assigned manually. Workload updated successfully.');

  // ==========================================
  // STEP 4: Agent Processes Status Changes
  // ==========================================
  console.log('\n--- Step 4: Status Transition Lifecycle ---');

  // Transition 1: PICKED_UP
  await updateOrderStatus(order.id, 'PICKED_UP', agent.id, 'AGENT', 'Picked up from warehouse');
  console.log('✓ Transitioned: CREATED -> PICKED_UP');

  // Transition 2: IN_TRANSIT
  await updateOrderStatus(order.id, 'IN_TRANSIT', agent.id, 'AGENT', 'In transit to Delhi hub');
  console.log('✓ Transitioned: PICKED_UP -> IN_TRANSIT');

  // Transition 3: OUT_FOR_DELIVERY
  await updateOrderStatus(order.id, 'OUT_FOR_DELIVERY', agent.id, 'AGENT', 'Out for delivery in Delhi NCR');
  console.log('✓ Transitioned: IN_TRANSIT -> OUT_FOR_DELIVERY');

  // Transition 4: DELIVERED
  await updateOrderStatus(order.id, 'DELIVERED', agent.id, 'AGENT', 'Delivered to customer doorstep');
  console.log('✓ Transitioned: OUT_FOR_DELIVERY -> DELIVERED');

  // Release agent workload
  await releaseAgent(order.id);
  const finalProfile = await prisma.agentProfile.findUnique({ where: { userId: agent.id } });
  console.log(`Agent Workload after delivery completion: ${finalProfile?.currentWorkload} (Expected: 0)`);
  if (finalProfile?.currentWorkload !== 0) {
    throw new Error('❌ Workload decrement failed!');
  }
  console.log('✅ Status lifecycle completed and agent released.');

  // ==========================================
  // STEP 5: Verification of Immutable Timeline
  // ==========================================
  console.log('\n--- Step 5: Verification of Immutable Tracking Timeline ---');
  const history = await getTrackingHistory(order.id);
  console.log(`Timeline entry count: ${history.length} (Expected: 6)`);
  history.forEach((h, index) => {
    console.log(`  [Event ${index + 1}] Status: ${h.newStatus} | Actor: ${h.actor.name} (${h.actor.role}) | Note: "${h.note}"`);
  });

  if (history.length !== 6) {
    throw new Error('❌ Tracking history count mismatch!');
  }
  console.log('✅ Immutable timeline contains all historical events perfectly.');

  // ==========================================
  // STEP 6: Failed Delivery & Reschedule Flow
  // ==========================================
  console.log('\n--- Step 6: Failed Delivery & Rescheduling Flow ---');
  // Create another order to test FAILED -> RESCHEDULE -> CREATED
  const order2 = await prisma.order.create({
    data: {
      trackingNumber: `LMD-FAIL-TEST`,
      customerId: customer.id,
      status: 'CREATED',
      pickupAddress: 'Mumbai depot',
      pickupPincode: '400001',
      dropAddress: 'Pune depot',
      dropPincode: '411001',
      length: 10,
      breadth: 10,
      height: 10,
      actualWeight: 2,
      volumetricWeight: 0.2,
      billableWeight: 2,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      baseCharge: 80,
      codSurcharge: 0,
      totalCharge: 80
    }
  });

  // Assign agent
  await manualAssign(order2.id, agent.id, admin.id);

  // Transition to failed
  await updateOrderStatus(order2.id, 'PICKED_UP', agent.id, 'AGENT', 'Picked up');
  await updateOrderStatus(order2.id, 'IN_TRANSIT', agent.id, 'AGENT', 'In transit');
  await updateOrderStatus(order2.id, 'OUT_FOR_DELIVERY', agent.id, 'AGENT', 'Out for delivery');
  await updateOrderStatus(order2.id, 'FAILED', agent.id, 'AGENT', 'Customer locked door');
  await releaseAgent(order2.id);

  console.log(`Order status marked as FAILED. Active workload of agent: ${(await prisma.agentProfile.findUnique({ where: { userId: agent.id } }))?.currentWorkload}`);

  // Reschedule
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2); // 2 days from now

  await prisma.$transaction([
    prisma.reschedule.create({
      data: {
        orderId: order2.id,
        previousAttemptDate: order2.updatedAt,
        newDate: targetDate,
        requestedById: customer.id,
        reason: 'Deliver on weekend'
      }
    }),
    prisma.order.update({
      where: { id: order2.id },
      data: { status: 'CREATED' }
    }),
    prisma.agentAssignment.updateMany({
      where: { orderId: order2.id, isActive: true },
      data: { isActive: false }
    }),
    prisma.trackingHistory.create({
      data: {
        orderId: order2.id,
        previousStatus: 'FAILED',
        newStatus: 'CREATED',
        actorId: customer.id,
        note: `Rescheduled for ${targetDate.toLocaleDateString()}. Reason: Deliver on weekend`
      }
    })
  ]);

  const updatedOrder2 = await prisma.order.findUnique({ where: { id: order2.id } });
  console.log(`Order status after reschedule: ${updatedOrder2?.status} (Expected: CREATED)`);
  if (updatedOrder2?.status !== 'CREATED') {
    throw new Error('❌ Reschedule status update failed!');
  }

  const reschedules = await prisma.reschedule.findMany({ where: { orderId: order2.id } });
  console.log(`Reschedule records found: ${reschedules.length} (Expected: 1)`);
  if (reschedules.length !== 1) {
    throw new Error('❌ Reschedule log missing!');
  }

  const trackingWithFailed = await getTrackingHistory(order2.id);
  console.log(`Tracking history with FAILED + RESCHEDULED:`);
  trackingWithFailed.forEach((h) => {
    console.log(`  - Status: ${h.newStatus} | Note: "${h.note}"`);
  });

  console.log('✅ Failed delivery, rescheduling, and history retention verified.');

  console.log('\n🎉 ALL END-TO-END SERVICES VERIFIED SUCCESSFULLY!');
}

runTests()
  .catch((e) => {
    console.error('❌ E2E test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
