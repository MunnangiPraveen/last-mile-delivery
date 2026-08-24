import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function reset() {
  await prisma.$transaction([
    prisma.agentAssignment.deleteMany(),
    prisma.trackingHistory.deleteMany(),
    prisma.reschedule.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.order.deleteMany(),
  ]);
  console.log('🧹 Database reset completed successfully. Ready for evaluation.');
}

reset()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
