import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── DEMO USERS ─────────────────────────────────────

  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const agentPassword = await bcrypt.hash('Agent@123', 12);
  const adminPassword = await bcrypt.hash('Admin@123', 12);

  const customer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: { passwordHash: customerPassword },
    create: {
      name: 'Demo Customer',
      email: 'customer@demo.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log('✓ Customer demo user:', customer.email);

  const agent = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    update: { passwordHash: agentPassword },
    create: {
      name: 'Demo Agent',
      email: 'agent@demo.com',
      passwordHash: agentPassword,
      role: 'AGENT',
    },
  });
  console.log('✓ Agent demo user:', agent.email);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { passwordHash: adminPassword },
    create: {
      name: 'Demo Admin',
      email: 'admin@demo.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin demo user:', admin.email);

  // ─── ZONES ──────────────────────────────────────────

  const zones = [
    { name: 'North', description: 'North India Zone', isDefault: false },
    { name: 'South', description: 'South India Zone', isDefault: false },
    { name: 'East', description: 'East India Zone', isDefault: false },
    { name: 'West', description: 'West India Zone', isDefault: false },
    { name: 'Default', description: 'Fallback zone for unrecognized pincodes', isDefault: true },
  ];

  const createdZones: Record<string, string> = {};

  for (const zone of zones) {
    const z = await prisma.zone.upsert({
      where: { name: zone.name },
      update: { description: zone.description, isDefault: zone.isDefault },
      create: zone,
    });
    createdZones[zone.name] = z.id;
    console.log(`✓ Zone: ${zone.name}`);
  }

  // ─── AREAS (sample pincode → zone mappings) ────────

  const areas = [
    // North zone
    { name: 'Delhi', pincode: '110001', zone: 'North' },
    { name: 'Chandigarh', pincode: '160001', zone: 'North' },
    { name: 'Lucknow', pincode: '226001', zone: 'North' },
    { name: 'Jaipur', pincode: '302001', zone: 'North' },
    // South zone
    { name: 'Hyderabad', pincode: '500001', zone: 'South' },
    { name: 'Chennai', pincode: '600001', zone: 'South' },
    { name: 'Bangalore', pincode: '560001', zone: 'South' },
    { name: 'Kochi', pincode: '682001', zone: 'South' },
    // East zone
    { name: 'Kolkata', pincode: '700001', zone: 'East' },
    { name: 'Bhubaneswar', pincode: '751001', zone: 'East' },
    { name: 'Patna', pincode: '800001', zone: 'East' },
    // West zone
    { name: 'Mumbai', pincode: '400001', zone: 'West' },
    { name: 'Pune', pincode: '411001', zone: 'West' },
    { name: 'Ahmedabad', pincode: '380001', zone: 'West' },
    { name: 'Goa', pincode: '403001', zone: 'West' },
  ];

  for (const area of areas) {
    await prisma.area.upsert({
      where: { pincode: area.pincode },
      update: { name: area.name, zoneId: createdZones[area.zone] },
      create: {
        name: area.name,
        pincode: area.pincode,
        zoneId: createdZones[area.zone],
      },
    });
  }
  console.log(`✓ ${areas.length} areas seeded`);

  // ─── RATE CARDS ─────────────────────────────────────

  const rateCards = [
    { orderType: 'B2B', zoneType: 'INTRA_ZONE', ratePerKg: 30, minCharge: 100 },
    { orderType: 'B2B', zoneType: 'INTER_ZONE', ratePerKg: 50, minCharge: 200 },
    { orderType: 'B2C', zoneType: 'INTRA_ZONE', ratePerKg: 40, minCharge: 80 },
    { orderType: 'B2C', zoneType: 'INTER_ZONE', ratePerKg: 60, minCharge: 150 },
  ];

  for (const rc of rateCards) {
    await prisma.rateCard.upsert({
      where: {
        orderType_zoneType: {
          orderType: rc.orderType,
          zoneType: rc.zoneType,
        },
      },
      update: { ratePerKg: rc.ratePerKg, minCharge: rc.minCharge },
      create: rc,
    });
    console.log(`✓ Rate card: ${rc.orderType} ${rc.zoneType} - ₹${rc.ratePerKg}/kg`);
  }

  // ─── COD CHARGES ────────────────────────────────────

  const codCharges = [
    { orderType: 'B2B', surcharge: 40 },
    { orderType: 'B2C', surcharge: 50 },
  ];

  for (const cod of codCharges) {
    await prisma.codCharge.upsert({
      where: { orderType: cod.orderType },
      update: { surcharge: cod.surcharge },
      create: cod,
    });
    console.log(`✓ COD charge: ${cod.orderType} - ₹${cod.surcharge}`);
  }

  // ─── AGENT PROFILE ─────────────────────────────────

  await prisma.agentProfile.upsert({
    where: { userId: agent.id },
    update: {
      availability: 'AVAILABLE',
      zoneId: createdZones['South'],
    },
    create: {
      userId: agent.id,
      availability: 'AVAILABLE',
      currentWorkload: 0,
      zoneId: createdZones['South'],
      phone: '+91-9876543210',
    },
  });
  console.log('✓ Agent profile created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo Credentials:');
  console.log('  Customer: customer@demo.com / Customer@123');
  console.log('  Agent:    agent@demo.com / Agent@123');
  console.log('  Admin:    admin@demo.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
