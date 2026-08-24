import { prisma } from '@/lib/prisma';

/**
 * Agent Assignment Service
 * Handles manual and automatic agent assignment
 */

/**
 * Manually assign an agent to an order
 */
export async function manualAssign(
  orderId: string,
  agentId: string,
  assignedById: string
) {
  // Verify agent exists and is available
  const agent = await prisma.user.findFirst({
    where: { id: agentId, role: 'AGENT' },
    include: { agentProfile: true },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  if (!agent.agentProfile) {
    throw new Error('Agent profile not found');
  }

  // Deactivate previous assignments for this order
  await prisma.agentAssignment.updateMany({
    where: { orderId, isActive: true },
    data: { isActive: false },
  });

  // Create new assignment
  const assignment = await prisma.agentAssignment.create({
    data: {
      orderId,
      agentId,
      assignedById,
      isActive: true,
    },
  });

  // Update agent workload
  await prisma.agentProfile.update({
    where: { userId: agentId },
    data: {
      currentWorkload: { increment: 1 },
      availability: agent.agentProfile.currentWorkload >= 4 ? 'BUSY' : agent.agentProfile.availability,
    },
  });

  return assignment;
}

/**
 * Auto-assign an agent to an order
 * Algorithm:
 * 1. Find all AVAILABLE agents
 * 2. Prefer agents in the pickup zone
 * 3. Choose agent with lowest current workload
 * 4. If no zone match, choose any available agent with lowest workload
 */
export async function autoAssign(
  orderId: string,
  assignedById: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Find available agents
  const availableAgents = await prisma.agentProfile.findMany({
    where: {
      availability: 'AVAILABLE',
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: {
      currentWorkload: 'asc',
    },
  });

  if (availableAgents.length === 0) {
    throw new Error('No available agents found for assignment');
  }

  // Prefer agents in the pickup zone
  let selectedAgent = null;

  if (order.pickupZoneId) {
    const zoneAgent = availableAgents.find(a => a.zoneId === order.pickupZoneId);
    if (zoneAgent) {
      selectedAgent = zoneAgent;
    }
  }

  // If no zone match, use agent with lowest workload
  if (!selectedAgent) {
    selectedAgent = availableAgents[0]; // Already sorted by workload ASC
  }

  // Perform the assignment
  return manualAssign(orderId, selectedAgent.userId, assignedById);
}

/**
 * Release agent from completed/failed order assignment
 */
export async function releaseAgent(orderId: string) {
  const assignment = await prisma.agentAssignment.findFirst({
    where: { orderId, isActive: true },
    include: { agent: { include: { agentProfile: true } } },
  });

  if (assignment && assignment.agent.agentProfile) {
    await prisma.agentProfile.update({
      where: { userId: assignment.agentId },
      data: {
        currentWorkload: Math.max(0, assignment.agent.agentProfile.currentWorkload - 1),
        availability: assignment.agent.agentProfile.currentWorkload <= 1 ? 'AVAILABLE' : assignment.agent.agentProfile.availability,
      },
    });
  }
}

/**
 * Get available agents list
 */
export async function getAvailableAgents() {
  return prisma.agentProfile.findMany({
    where: {
      availability: { in: ['AVAILABLE', 'BUSY'] },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      zone: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      currentWorkload: 'asc',
    },
  });
}
